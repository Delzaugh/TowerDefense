"""T6 Pavilion: reference-led, editable low-poly source. Pipeline owns export."""
import bpy, bmesh, math, os, json
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
OUT = Path(os.environ.get('ASSET_BUILD_DIR', str(HERE)))
DETAIL = os.environ.get('PAVILION_BLOCKOUT') != '1'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
root = bpy.data.objects.new('root', None)
scene.collection.objects.link(root)
root['asset_id'] = 'copilot_architect'
root['design'] = 'T6 Pavilion / Architect Copilot'

COLORS = {'cream':'F4DFC0', 'teal':'08607A', 'screen':'041D2A', 'cyan':'00E5EF', 'orange':'FF7308'}
W,H = 40,8
im = bpy.data.images.new('pavilion_palette', width=W, height=H, alpha=True)
pixels=[]
for y in range(H):
    for x in range(W):
        hx=list(COLORS.values())[x//8]
        pixels.extend([int(hx[i:i+2],16)/255 for i in (0,2,4)]+[1.])
im.pixels = pixels
im.filepath_raw=str(OUT/'pavilion_palette.png'); im.file_format='PNG'; im.save(); im.pack()
def material(name, emissive=False):
    m=bpy.data.materials.new(name); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Roughness'].default_value=.77
    tex=m.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=im; tex.interpolation='Linear'
    m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    if emissive:
        bs.inputs['Emission Color'].default_value=(0,.72,.8,1)
        bs.inputs['Emission Strength'].default_value=.55
    return m
mat=material('pavilion_palette')
eye_mat=material('pavilion_eyes',True)
parts=[]
def xyz(p):
    x,h,d=p
    return (x,-d,h)
def mesh(name, verts, faces, role, bevel=0):
    me=bpy.data.meshes.new(name); me.from_pydata([xyz(v) for v in verts],[],faces); me.update()
    ob=bpy.data.objects.new(name,me); scene.collection.objects.link(ob); ob.parent=root
    ob.data.materials.append(eye_mat if role=='cyan' else mat)
    if bevel:
        bpy.context.view_layer.objects.active=ob; ob.select_set(True)
        mod=ob.modifiers.new('manufactured edge','BEVEL'); mod.width=bevel; mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name); ob.select_set(False)
    bm=bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces)); bm.to_mesh(ob.data); bm.free()
    uv=ob.data.uv_layers.new(name='PaletteUV')
    index=list(COLORS).index(role)
    for loop in uv.data: loop.uv=((index*8+4)/W,.5)
    for p in ob.data.polygons: p.use_smooth=False
    ob['palette_role']=role
    group=ob.vertex_groups.new(name=name)
    group.add(list(range(len(ob.data.vertices))),1.0,'REPLACE')
    parts.append(ob)
    return ob
def extrusion(name, outline, a,b,role,bevel=0,axis='depth'):
    # Outline coordinates are x,height for depth extrusion; depth,height for side panels.
    verts=[]
    for k in (a,b):
        verts += [(u,v,k) if axis=='depth' else (k,v,u) for u,v in outline]
    n=len(outline)
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,verts,faces,role,bevel)
def ring(w,d,c):
    return [(-w+c,d),(w-c,d),(w,d-c),(w,-d+c),(w-c,-d),(-w+c,-d),(-w,-d+c),(-w,d-c)]
def loft(name, levels, role):
    verts=[]
    for h,w,d,c in levels: verts += [(x,h,z) for x,z in ring(w,d,c)]
    n=8; faces=[tuple(reversed(range(n))),tuple(range(len(verts)-n,len(verts)))]
    for k in range(len(levels)-1):
        faces += [(k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i) for i in range(n)]
    return mesh(name,verts,faces,role)

# Rounded octagonal sections; the change of width/depth is authored at every
# height, so neither side nor rear is a vertically extruded wall.
def rounded_ring(w,front,back,c):
    return [(-w+c,front),(0,front+.04),(w-c,front),(w-.293*c,front-.293*c),(w,front-c),
            (w+.035,(front+back)/2),(w,back+c),(w-.293*c,back+.293*c),(w-c,back),(0,back-.16),(-w+c,back),
            (-w+.293*c,back+.293*c),(-w,back+c),(-w-.035,(front+back)/2),(-w,front-c),(-w+.293*c,front-.293*c)]
levels=[(0,.59,.26,-.62,.28),(.14,.83,.39,-.88,.38),(.45,1.08,.47,-1.18,.49),
        (.99,1.25,.50,-1.42,.55),(1.49,1.25,.47,-1.38,.55),
        (1.83,1.13,.42,-1.16,.43),(2.07,.96,.35,-.92,.35)]
verts=[]
for h,w,f,b,c in levels: verts += [(x*.80,h,d) for x,d in rounded_ring(w,f,b,c)]
n=16;faces=[tuple(reversed(range(n))),tuple(range(len(verts)-n,len(verts)))]
for j in range(len(levels)-1):
    faces += [(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n)]
mesh('sculpted_barrel_shell',verts,faces,'teal')

# Dark, gently convex display. The recess follows the curved front assembly.
def display_depth(x,h): return .72+.22*math.sin(math.pi*(h-.25)/1.94)-.19*x*x
rows=[(.27,.476),(.43,.539),(.61,.610),(.85,.680),(1.15,.768),(1.55,.885),(1.99,1.013)]
verts=[]
for h,w in rows:
    for j in range(9):
        x=w*(j/4-1);verts.append((x,h,display_depth(x,h)))
faces=[]
for i in range(len(rows)-1):
    for j in range(8): faces.append((i*9+j,i*9+j+1,(i+1)*9+j+1,(i+1)*9+j))
display=mesh('curved_recessed_display',verts,faces,'screen')
for p in display.data.polygons:p.use_smooth=True

# Broad sculpted armour bevels follow a 3D ridge: cheeks project at their middle
# and tuck backward into the jaw. Each plate has a closed shell and proper seat.
def cheek_depth(x,h):
    return 1.04+.53*math.sin(math.pi*(h-.12)/1.93)-.42*(abs(x)-.62)
# Recess sidewalls join the display to the projecting armour, making a deep
# continuous face well rather than a floating screen behind disconnected plates.
for side in (-1,1):
    verts=[]
    for h,w in rows:
        # Keep the dark liner inside the cream plate's inner-edge plane.
        # Coplanar liner/armour faces otherwise flicker from oblique views.
        x=side*(w-.014)
        # Carry the liner behind the display into the body seat, closing the
        # side silhouette between the projecting jaw and the rear casing.
        verts += [(x,h,.30),(x,h,cheek_depth(x,h)-.025)]
    wall=mesh('visor_recess_wall_'+str(side),verts,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(rows)-1)],'screen')
    # A physical liner must also close the well when viewed from outside.
    # Thicken away from the cavity so the interior remains clear of armour.
    bpy.context.view_layer.objects.active=wall
    solid=wall.modifiers.new('solid visor liner','SOLIDIFY')
    solid.thickness=.008;solid.offset=-1
    bpy.ops.object.modifier_apply(modifier=solid.name)
def sculpt_plate(name,outline,depth_fn,role,side=1,inset=.14,thickness=.16,axis='front'):
    cx=sum(p[0] for p in outline)/len(outline);cy=sum(p[1] for p in outline)/len(outline)
    inner=[(cx+(u-cx)*(1-inset),cy+(h-cy)*(1-inset)) for u,h in outline]
    verts=[]
    for points,delta in [(outline,-thickness),(outline,0),(inner,.072)]:
        for u,h in points:
            dep=depth_fn(u,h)+delta
            verts.append((side*u,h,dep) if axis=='front' else (side*dep,h,u))
    n=len(outline)
    front_center=len(verts)
    dep=depth_fn(cx,cy)+.072
    verts.append((side*cx,cy,dep) if axis=='front' else (side*dep,cy,cx))
    back_center=len(verts)
    dep=depth_fn(cx,cy)-thickness
    verts.append((side*cx,cy,dep) if axis=='front' else (side*dep,cy,cx))
    faces=[(back_center,(i+1)%n,i) for i in range(n)]
    faces += [(front_center,2*n+i,2*n+(i+1)%n) for i in range(n)]
    for k in range(2):faces += [(k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i) for i in range(n)]
    return mesh(name,verts,faces,role)
cheek=[(.99,1.91),(1.23,1.55),(1.20,1.08),(1.07,.85),(.87,.68),(.61,.61)]
lower=[(.60,.585),(.87,.655),(1.065,.815),(.84,.34),(.65,.12),(.43,.15)]
for side in (-1,1):
    sculpt_plate('upper_cheek_'+str(side),cheek,cheek_depth,'cream',side,.34,.57)
    sculpt_plate('lower_cheek_'+str(side),lower,cheek_depth,'cream',side,.30,.50)
sculpt_plate('sculpted_chin',[(-.51,.40),(.51,.40),(.43,.12),(.32,.035),(-.32,.035),(-.43,.12)],lambda x,h:1.02+.50*h,'cream',inset=.28,thickness=.47)

# Crown with broad sloping fascia, rounded corner breaks, a thick turned-down
# eave and narrow physical tier joints. The lower edge is not a knife plane.
base=[(-1.24,1.39),(-1.02,1.39),(1.02,1.39),(1.24,1.39),(1.43,1.15),(1.43,-1.20),(1.24,-1.43),(-1.24,-1.43),(-1.43,-1.20),(-1.43,1.15)]
heights=[1.74,1.965,1.965,1.74,1.77,1.965,1.965,1.965,1.965,1.77]
verts=[]
for scale,delta in [(1,-.01),(1,.055)]:
    verts += [(x*scale,h+delta,d*scale) for (x,d),h in zip(base,heights)]
verts += [(x*.86,2.285,d*.84) for x,d in base]
verts += [(0,1.96,0)]
n=len(base);faces=[tuple(range(20,30))]
for k in range(2):faces += [(k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i) for i in range(n)]
faces += [(30,(i+1)%n,i) for i in range(n)]
mesh('thick_sculpted_eave',verts,faces,'cream',.022)
loft('middle_tier_joint',[(2.277,1.112,1.06,.16),(2.301,1.112,1.06,.16)],'screen')
middle=loft('middle_crown',[(2.29,1.125,1.072,.17),(2.325,1.125,1.072,.17),(2.495,.987,.91,.15),(2.505,.967,.89,.15)],'cream')
loft('upper_tier_joint',[(2.492,.803,.756,.15),(2.515,.803,.756,.15)],'screen')
loft('upper_crown',[(2.503,.814,.77,.15),(2.537,.814,.77,.15),(2.683,.733,.666,.14),(2.70,.708,.641,.14)],'cream')

# Sculpted side casings: tilted outward at the shoulder, tapered toward the jaw,
# with broad bevel bands and a lightly cambered central face.
def panel_bulge(d,h):return 1.25-.24*(d+.24)**2-.27*(h-1.13)**2
panel=[(.63,1.54),(.42,1.94),(-.87,1.91),(-1.30,1.53),(-1.18,.65),(-.65,.18),(.28,.19),(.64,.62)]
# Concentric 3D patches avoid a single flat central ngon; even the central field
# has changing normals. Store the surface triangles to fit the glyph exactly.
panel_triangles=[]
for side in (-1,1):
    verts=[];cx=-.22;ch=1.10
    for scale,offset in [(1,-.20),(1,-.035),(.86,.075),(.55,.15),(.27,.185)]:
        for d,h in panel:
            dd=cx+(d-cx)*scale;hh=ch+(h-ch)*scale
            verts.append((side*(panel_bulge(dd,hh)+offset),hh,dd))
    verts.append((side*(panel_bulge(cx,ch)+.20),ch,cx))
    n=len(panel);faces=[tuple(reversed(range(n)))]
    for k in range(4):
        for i in range(n):
            a=k*n+i;b=k*n+(i+1)%n;c=(k+1)*n+(i+1)%n;d=(k+1)*n+i
            faces.extend([(a,b,c),(a,c,d)])
    faces += [(4*n+i,4*n+(i+1)%n,40) for i in range(n)]
    mesh('fitted_side_casing_'+str(side),verts,faces,'teal')
    if side==1:
        panel_triangles=[tuple(verts[i] for i in face) for face in faces[17:]]
def panel_plane(d,h):
    for tri in panel_triangles:
        (xa,ha,da),(xb,hb,db),(xc,hc,dc)=tri
        den=(hb-hc)*(da-dc)+(dc-db)*(ha-hc)
        if abs(den)<1e-10:continue
        a=((hb-hc)*(d-dc)+(dc-db)*(h-hc))/den
        b=((hc-ha)*(d-dc)+(da-dc)*(h-hc))/den;c=1-a-b
        if min(a,b,c)>=-1e-6:return a*xa+b*xb+c*xc
    return panel_bulge(d,h)-.035

if DETAIL:
    # Friendly cyan capsule eyes, extruded shallowly from the display seat.
    for cx in (-.35,.35):
        outline=[]
        radius=.091; center=1.17; half=.17
        for k in range(9):
            a=math.pi*k/8
            outline.append((cx+radius*math.cos(a),center+half+radius*math.sin(a)))
        for k in range(9):
            a=math.pi+math.pi*k/8
            outline.append((cx+radius*math.cos(a),center-half+radius*math.sin(a)))
        eye=extrusion('cyan_eye_'+str(cx),outline,.007,.024,'cyan',.005)
        for v in eye.data.vertices:v.co.y-=display_depth(v.co.x,v.co.z)
    tab=sculpt_plate('orange_chin_clasp',[(-.145,.27),(.145,.27),(.185,0),(-.185,0)],lambda x,h:1.056+.50*h,'orange',inset=.15,thickness=.07)
    # Upper latch follows the sloping cap, without extending into the face.
    extrusion('crown_latch',[(d*1.295,h) for d,h in [(.49,2.685),(.53,2.73),(.65,2.73),(.86,2.475),(.74,2.475),(.705,2.505),(.592,2.513)]],-.14,.14,'orange',.016,axis='side')
    for side in (-1,1):
        socket=extrusion('edge_strip_socket_'+str(side),[(.435,.52),(.615,.52),(.615,1.01),(.435,1.01)],0,.035,'screen',.012,axis='side')
        strip=extrusion('orange_edge_strip_'+str(side),[(.47,.56),(.58,.56),(.58,.97),(.47,.97)],.025,.079,'orange',.022,axis='side')
        for ob in (socket,strip):
            for v in ob.data.vertices:v.co.x=side*(v.co.x+panel_plane(-v.co.y,v.co.z)+.006)

    # Left-side blueprint: closed rectangular rings, four aligned windows and a scroll spindle.
    # glTF positive X is character-left when facing +Z.
    def graphic_ring(name, outer, inner):
        verts=[];faces=[]
        for i in range(len(outer)):
            a=outer[i];b=outer[(i+1)%len(outer)];c=inner[i];d=inner[(i+1)%len(inner)]
            steps=max(1,math.ceil(math.dist(a,b)/.055))
            start=len(verts)
            for j in range(steps+1):
                t=j/steps
                for p,q in [(a,b),(c,d)]:
                    dd=p[0]+t*(q[0]-p[0]);hh=p[1]+t*(q[1]-p[1])
                    verts.append((panel_plane(dd,hh)+.009,hh,dd))
            faces += [(start+j*2,start+j*2+1,start+j*2+3,start+j*2+2) for j in range(steps)]
        mesh(name,verts,faces,'cream')
    def rectangle(name,d,h,w,ht,t=.022):
        outer=[(d-w/2,h-ht/2),(d+w/2,h-ht/2),(d+w/2,h+ht/2),(d-w/2,h+ht/2)]
        inner=[(d-w/2+t,h-ht/2+t),(d+w/2-t,h-ht/2+t),(d+w/2-t,h+ht/2-t),(d-w/2+t,h+ht/2-t)]
        graphic_ring(name,outer,inner)
    rectangle('plan_sheet',-.16,1.15,.62,.65,.026)
    for row in (-1,1):
        for col in (-1,1): rectangle('plan_window',-.18+col*.125,1.15+row*.135,.15,.17,.022)
    # Open-ended spindle rails connect the two circular rolled ends without crossbars.
    for d in (.126,.254):
        verts=[]
        for j in range(18):
            h=.73+.84*j/17
            for dd in (d-.011,d+.011):verts.append((panel_plane(dd,h)+.009,h,dd))
        mesh('scroll_rail',verts,[(j*2,j*2+1,j*2+3,j*2+2) for j in range(17)],'cream')
    for h in (.73,1.57):
        outer=[(.19+.077*math.cos(i*math.tau/16),h+.077*math.sin(i*math.tau/16)) for i in range(16)]
        inner=[(.19+.055*math.cos(i*math.tau/16),h+.055*math.sin(i*math.tau/16)) for i in range(16)]
        graphic_ring('scroll_cap',outer,inner)

# Keep named parts editable through mesh attributes and disconnected islands,
# while delivering one opaque surface mesh and one emissive eye mesh.
for group, name in (([p for p in parts if p.get('palette_role')!='cyan'],'pavilion_body'),([p for p in parts if p.get('palette_role')=='cyan'],'pavilion_eyes')):
    if not group: continue
    bpy.ops.object.select_all(action='DESELECT')
    for p in group: p.select_set(True)
    bpy.context.view_layer.objects.active=group[0]
    bpy.ops.object.join(); joined=bpy.context.object; joined.name=name
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bpy.ops.object.select_all(action='DESELECT')
for name, p in [('anchor_ui',(0,3.02,0)),('anchor_action',(0,1.20,1.22)),('anchor_target',(0,1.3,0))]:
    a=bpy.data.objects.new(name,None); scene.collection.objects.link(a); a.parent=root; a.location=xyz(p)
scene.render.fps=30
scene.frame_set(0)
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ.get('ASSET_SOURCE_NAME','copilot_architect_v01.blend')))
