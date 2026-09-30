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
    return [(-w+c,front),(w-c,front),(w-.293*c,front-.293*c),(w,front-c),
            (w,back+c),(w-.293*c,back+.293*c),(w-c,back),(-w+c,back),
            (-w+.293*c,back+.293*c),(-w,back+c),(-w,front-c),(-w+.293*c,front-.293*c)]
levels=[(0,.62,.40,-.48,.24),(.11,.78,.58,-.65,.27),(.40,1.00,.73,-.87,.33),
        (.91,1.20,.80,-1.04,.38),(1.47,1.27,.79,-1.05,.36),
        (1.80,1.17,.70,-.94,.30),(2.04,1.04,.60,-.78,.26)]
verts=[]
for h,w,f,b,c in levels: verts += [(x,h,d) for x,d in rounded_ring(w,f,b,c)]
n=12;faces=[tuple(reversed(range(n))),tuple(range(len(verts)-n,len(verts)))]
for j in range(len(levels)-1):
    faces += [(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n)]
mesh('sculpted_barrel_shell',verts,faces,'teal')

# Dark, gently convex display. The recess follows the curved front assembly.
def display_depth(x,h): return .875+.155*math.sin(math.pi*(h-.25)/1.94)-.105*x*x
rows=[(.27,.45),(.43,.54),(.78,.71),(1.15,.83),(1.55,.96),(1.99,1.06)]
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
    return .91+.24*math.sin(math.pi*(h-.12)/1.93)-.24*(abs(x)-.62)
def sculpt_plate(name,outline,depth_fn,role,side=1,inset=.14,thickness=.16,axis='front'):
    cx=sum(p[0] for p in outline)/len(outline);cy=sum(p[1] for p in outline)/len(outline)
    inner=[(cx+(u-cx)*(1-inset),cy+(h-cy)*(1-inset)) for u,h in outline]
    verts=[]
    for points,delta in [(outline,-thickness),(outline,0),(inner,.072)]:
        for u,h in points:
            dep=depth_fn(u,h)+delta
            verts.append((side*u,h,dep) if axis=='front' else (side*dep,h,u))
    n=len(outline);faces=[tuple(reversed(range(n))),tuple(range(2*n,3*n))]
    for k in range(2):faces += [(k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i) for i in range(n)]
    return mesh(name,verts,faces,role,.008)
cheek=[(.99,1.91),(1.23,1.55),(1.20,1.08),(1.07,.85),(.87,.68),(.61,.61)]
lower=[(.60,.585),(.87,.655),(1.065,.815),(.84,.34),(.65,.12),(.43,.15)]
for side in (-1,1):
    sculpt_plate('upper_cheek_'+str(side),cheek,cheek_depth,'cream',side,.23,.24)
    sculpt_plate('lower_cheek_'+str(side),lower,cheek_depth,'cream',side,.20,.22)
sculpt_plate('sculpted_chin',[(-.51,.40),(.51,.40),(.43,.12),(.32,.035),(-.32,.035),(-.43,.12)],lambda x,h:.91+.29*h,'cream',inset=.20,thickness=.23)

# Crown with broad sloping fascia, rounded corner breaks, a thick turned-down
# eave and narrow physical tier joints. The lower edge is not a knife plane.
base=[(-1.24,1.16),(-1.02,1.16),(1.02,1.16),(1.24,1.16),(1.43,.97),(1.43,-.89),(1.24,-1.08),(-1.24,-1.08),(-1.43,-.89),(-1.43,.97)]
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
loft('middle_tier_joint',[(2.277,1.112,.819,.12),(2.301,1.112,.819,.12)],'screen')
middle=loft('middle_crown',[(2.29,1.125,.831,.12),(2.325,1.125,.831,.12),(2.495,.987,.708,.115),(2.505,.967,.688,.11)],'cream')
loft('upper_tier_joint',[(2.492,.803,.583,.105),(2.515,.803,.583,.105)],'screen')
loft('upper_crown',[(2.503,.814,.595,.11),(2.537,.814,.595,.11),(2.683,.733,.514,.105),(2.70,.708,.489,.10)],'cream')

# Sculpted side casings: tilted outward at the shoulder, tapered toward the jaw,
# with broad bevel bands and a lightly cambered central face.
def panel_plane(d,h):return 1.19+.22*(h-1.08)-.055*d
panel=[(.67,1.55),(.46,1.91),(-.62,1.89),(-.94,1.61),(-.91,.69),(-.52,.25),(.27,.19),(.59,.57)]
for side in (-1,1):
    sculpt_plate('fitted_side_casing_'+str(side),panel,panel_plane,'teal',side,.18,.17,axis='side')

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
    tab=sculpt_plate('orange_chin_clasp',[(-.145,.27),(.145,.27),(.185,0),(-.185,0)],lambda x,h:.946+.29*h,'orange',inset=.15,thickness=.07)
    # Upper latch follows the sloping cap, without extending into the face.
    extrusion('crown_latch',[(.49,2.685),(.53,2.73),(.65,2.73),(.86,2.475),(.74,2.475),(.705,2.505),(.592,2.513)],-.14,.14,'orange',.016,axis='side')
    for side in (-1,1):
        socket=extrusion('edge_strip_socket_'+str(side),[(.435,.52),(.615,.52),(.615,1.01),(.435,1.01)],0,.035,'screen',.012,axis='side')
        strip=extrusion('orange_edge_strip_'+str(side),[(.47,.56),(.58,.56),(.58,.97),(.47,.97)],.025,.079,'orange',.022,axis='side')
        for ob in (socket,strip):
            for v in ob.data.vertices:v.co.x=side*(v.co.x+panel_plane(-v.co.y,v.co.z)+.022)

    # Left-side blueprint: closed rectangular rings, four aligned windows and a scroll spindle.
    # glTF positive X is character-left when facing +Z.
    def graphic_ring(name, outer, inner):
        n=len(outer); verts=[(panel_plane(d,h)+.076,h,d) for d,h in outer]+[(panel_plane(d,h)+.076,h,d) for d,h in inner]
        faces=[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
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
        mesh('scroll_rail',[(panel_plane(dd,h)+.076,h,dd) for dd,h in [(d-.011,.73),(d-.011,1.57),(d+.011,1.57),(d+.011,.73)]],[(0,1,2,3)],'cream')
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
