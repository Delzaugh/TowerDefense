"""Systems Architect: rounded pod, curved blueprint panel and no top platform."""
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
root['design'] = 'Systems Architect / Application Architecture'

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
def mesh(name, verts, faces, role, bevel=0,face_roles=None):
    me=bpy.data.meshes.new(name); me.from_pydata([xyz(v) for v in verts],[],faces); me.update()
    ob=bpy.data.objects.new(name,me); scene.collection.objects.link(ob); ob.parent=root
    ob.data.materials.append(eye_mat if role=='cyan' else mat)
    if bevel:
        bpy.context.view_layer.objects.active=ob; ob.select_set(True)
        mod=ob.modifiers.new('manufactured edge','BEVEL'); mod.width=bevel; mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name); ob.select_set(False)
    bm=bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces)); bm.to_mesh(ob.data); bm.free()
    uv=ob.data.uv_layers.new(name='PaletteUV')
    for poly in ob.data.polygons:
        index=list(COLORS).index(face_roles[poly.index] if face_roles else role)
        for li in poly.loop_indices:uv.data[li].uv=((index*8+4)/W,.5)
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

# An actual rounded volume: every latitude changes both width and depth.
# No vertical prismatic middle section and no independent flat face plate.
SECTIONS=[(0,.36),(.10,.51),(.30,.71),(.59,.86),(.94,.97),(1.29,1.0),
          (1.64,.975),(1.94,.89),(2.20,.74),(2.40,.55),(2.56,.31),(2.64,.075)]
def radius(h):
    for (a,ra),(b,rb) in zip(SECTIONS,SECTIONS[1:]):
        if a<=h<=b:return ra+(rb-ra)*(h-a)/(b-a)
    return SECTIONS[0 if h<0 else -1][1]
def shell(theta,h,offset=0):
    r=radius(h);shift=-.035+.055*(h/2.64)
    return ((1.38*r+offset)*math.sin(theta),h,shift+(1.40*r+offset)*math.cos(theta))
def front_depth(x,h):
    r=radius(h)
    return -.035+.055*(h/2.64)+1.40*r*math.sqrt(max(.004,1-(x/(1.38*r))**2))

n=24;verts=[]
for h,r in SECTIONS:verts += [shell(i*math.tau/n,h) for i in range(n)]
faces=[tuple(reversed(range(n))),tuple(range(len(verts)-n,len(verts)))];roles=['teal','cream']
for k in range(len(SECTIONS)-1):
    faces += [(k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i) for i in range(n)]
    roles += [('cream' if SECTIONS[k][0]>=2.20 else 'teal')]*n
# Crown is a material region on the same closed shell; no intersecting cap.
mesh('rounded_architect_pod',verts,faces,'teal',face_roles=roles)

# The screen and bezel share a bowed surface in both axes.
N=32;FACE_H=1.27
outer=[(1.045*math.cos(i*math.tau/N),FACE_H+.885*math.sin(i*math.tau/N)) for i in range(N)]
inner=[(x*.91,FACE_H+(h-FACE_H)*.90) for x,h in outer]
verts=[]
for points,delta in [(outer,.015),(outer,.060),(inner,.077),(inner,.038)]:
    verts += [(x,h,front_depth(x,h)+delta) for x,h in points]
faces=[]
for k,l in [(0,1),(1,2),(2,3),(3,0)]:faces += [(k*N+i,k*N+(i+1)%N,l*N+(i+1)%N,l*N+i) for i in range(N)]
mesh('curved_cream_face_ring',verts,faces,'cream')
verts=[];faces=[]
for scale in (1,.80,.60,.40,.20):
    for x,h in inner:
        xx=x*scale;hh=FACE_H+(h-FACE_H)*scale
        verts.append((xx,hh,front_depth(xx,hh)+.045))
verts.append((0,FACE_H,front_depth(0,FACE_H)+.045))
for k in range(4):faces += [(k*N+i,k*N+(i+1)%N,(k+1)*N+(i+1)%N,(k+1)*N+i) for i in range(N)]
faces += [(4*N+i,4*N+(i+1)%N,5*N) for i in range(N)]
screen=mesh('convex_curved_display',verts,faces,'screen')
for p in screen.data.polygons:p.use_smooth=True

# Parameterised shoulder graphics are tessellated and seated on the pod.
# Their primary surface changes normal in both directions, unlike the old desk.
def patch(name,outline,offset,role,framed=False):
    # outline: theta,height; fan rings permit a real convex centre.
    dense=[]
    for a,b in zip(outline,outline[1:]+outline[:1]):
        steps=max(1,math.ceil(math.dist(a,b)/.075))
        dense += [(a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps) for j in range(steps)]
    outline=dense
    ct=(min(t for t,h in outline)+max(t for t,h in outline))/2
    ch=(min(h for t,h in outline)+max(h for t,h in outline))/2
    count=len(outline);verts=[];faces=[]
    scales=(1,.89,.70,.50,.30,.10) if framed else (1,.75,.50,.25)
    for scale in scales:
        verts += [shell(ct+(t-ct)*scale,ch+(h-ch)*scale,offset) for t,h in outline]
    verts.append(shell(ct,ch,offset))
    roles=[]
    for k in range(len(scales)-1):
        faces += [(k*count+i,k*count+(i+1)%count,(k+1)*count+(i+1)%count,(k+1)*count+i) for i in range(count)]
        roles += [('cream' if k==0 else 'screen') if framed else role]*count
    last=(len(scales)-1)*count
    faces += [(last+i,last+(i+1)%count,len(scales)*count) for i in range(count)]
    roles += [('screen' if framed else role)]*count
    if framed:
        start=len(verts);verts += [shell(t,h,-.020) for t,h in outline]
        faces += [(i,(i+1)%count,start+(i+1)%count,start+i) for i in range(count)]
        roles += ['cream']*count
    return mesh(name,verts,faces,role,face_roles=roles)

def rounded_rect(t,h,w,ht,c=.035):
    return [(t-w/2+c,h-ht/2),(t+w/2-c,h-ht/2),(t+w/2,h-ht/2+c),
            (t+w/2,h+ht/2-c),(t+w/2-c,h+ht/2),(t-w/2+c,h+ht/2),
            (t-w/2,h+ht/2-c),(t-w/2,h-ht/2+c)]
panel=rounded_rect(1.37,1.37,.97,1.20,.12)
patch('curved_blueprint_panel',panel,.061,'screen',framed=True)

# A real paper roll on the opposite side, with body-conforming saddle.
patch('roll_curved_saddle',rounded_rect(-1.57,1.08,.90,.45,.07),.03,'teal')
SCROLL_X=-1.36;SCROLL_H=1.08
def roll_piece(name,d0,d1,r,role):
    outline=[(SCROLL_X+r*math.cos(i*math.tau/16),SCROLL_H+r*math.sin(i*math.tau/16)) for i in range(16)]
    return extrusion(name,outline,d0,d1,role,min(.010,(d1-d0)*.30))
roll_piece('rolled_blueprint_paper',-.48,.48,.21,'cream')

# Keep the eyes in the blockout to judge the face as a curved volume.
for cx in (-.34,.34):
    outline=[];r=.081;half=.16;h=1.27
    for k in range(9):
        a=math.pi*k/8;outline.append((cx+r*math.cos(a),h+half+r*math.sin(a)))
    for k in range(9):
        a=math.pi+math.pi*k/8;outline.append((cx+r*math.cos(a),h-half+r*math.sin(a)))
    eye=extrusion('cyan_eye_'+str(cx),outline,.062,.080,'cyan',.004)
    for v in eye.data.vertices:v.co.y-=front_depth(v.co.x,v.co.z)

if DETAIL:
    # Broad routing and nodes preserve architect meaning on the curved shoulder.
    def stroke(name,points,width,offset,role):
        # Subdivided mitered strip, avoiding straight chords through the body.
        pts=[]
        for a,b in zip(points,points[1:]):
            steps=max(1,math.ceil(math.dist(a,b)/.045))
            pts += [(a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps) for j in range(steps)]
        pts.append(points[-1]);verts=[]
        for i,(t,h) in enumerate(pts):
            prev=Vector(pts[max(0,i-1)]);nxt=Vector(pts[min(len(pts)-1,i+1)])
            tangent=(nxt-prev).normalized();normal=Vector((-tangent.y,tangent.x))
            verts += [shell(t+normal.x*width*s,h+normal.y*width*s,offset) for s in (-.5,.5)]
        return mesh(name,verts,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(pts)-1)],role)
    stroke('diagram_main_route',[(1.37,1.68),(1.37,1.36)],.040,.076,'cyan')
    stroke('diagram_service_branch',[(1.37,1.38),(1.10,1.13)],.040,.076,'cyan')
    stroke('diagram_data_branch',[(1.37,1.38),(1.62,1.13)],.040,.076,'cyan')
    patch('application_window_housing',rounded_rect(1.37,1.70,.34,.28,.045),.081,'orange')
    patch('application_window_display',rounded_rect(1.37,1.70,.27,.19,.025),.094,'screen')
    stroke('application_window_header',[(1.265,1.752),(1.475,1.752)],.029,.103,'cyan')
    patch('application_window_content',rounded_rect(1.37,1.66,.18,.05,.012),.105,'cream')
    patch('service_module',rounded_rect(1.10,1.10,.22,.25,.035),.083,'cream')
    patch('service_component_inset',rounded_rect(1.11,1.10,.12,.135,.015),.097,'teal')
    # A single cylinder silhouette with dark curved divisions stays readable.
    outline=[(1.62+.112*math.cos(i*math.pi/10),1.185+.040*math.sin(i*math.pi/10)) for i in range(11)]
    outline += [(1.62+.112*math.cos(math.pi+i*math.pi/10),1.010+.040*math.sin(math.pi+i*math.pi/10)) for i in range(11)]
    patch('database_symbol',outline,.090,'cream')
    for j,hh in enumerate((1.177,1.080)):
        pts=[(1.62+.103*math.cos(i*math.pi/12),hh-.031*math.sin(i*math.pi/12)) for i in range(13)]
        stroke('database_division_'+str(j),pts,.017,.108,'screen')
    for i,d in enumerate((-.37,.29)):roll_piece('orange_roll_retainer_'+str(i),d,d+.085,.225,'orange')
    for end in (-.492,.492):
        roll_piece('roll_teal_end_core',end-.009,end+.009,.16,'teal')
        verts=[];steps=36
        for i in range(steps+1):
            t=i/steps;a=t*math.pi*3.5;r=.135*(1-t)+.014
            for rr in (r-.010,r+.010):verts.append((SCROLL_X+rr*math.cos(a),SCROLL_H+rr*math.sin(a),end+(.014 if end>0 else -.014)))
        faces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(steps)]
        if end<0:faces=[tuple(reversed(f)) for f in faces]
        mesh('paper_spiral',verts,faces,'cream')

for group,name in (([p for p in parts if p.get('palette_role')!='cyan'],'pavilion_body'),([p for p in parts if p.get('palette_role')=='cyan'],'pavilion_eyes')):
    if not group:continue
    bpy.ops.object.select_all(action='DESELECT')
    for p in group:p.select_set(True)
    bpy.context.view_layer.objects.active=group[0]
    bpy.ops.object.join();bpy.context.object.name=name
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bpy.ops.object.select_all(action='DESELECT')
for name,p in [('anchor_ui',(0,3.02,0)),('anchor_action',(1.3,1.37,.4)),('anchor_target',(0,1.30,0))]:
    a=bpy.data.objects.new(name,None);scene.collection.objects.link(a);a.parent=root;a.location=xyz(p)
scene.render.fps=30;scene.frame_set(0)
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ.get('ASSET_SOURCE_NAME','copilot_architect_v01.blend')))
