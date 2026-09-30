"""Systems Architect: planning console and software architecture diagram."""
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

def octagon(w,d,c):
    return [(-w+c,d),(w-c,d),(w,d-c),(w,-d+c),(w-c,-d),(-w+c,-d),(-w,-d+c),(-w,d-c)]

def body_ring(w,front,back,c):
    return [(-w+c,front),(0,front+.035),(w-c,front),(w-.293*c,front-.293*c),
            (w,front-c),(w+.025,(front+back)/2),(w,back+c),(w-.293*c,back+.293*c),
            (w-c,back),(0,back-.06),(-w+c,back),(-w+.293*c,back+.293*c),
            (-w,back+c),(-w-.025,(front+back)/2),(-w,front-c),(-w+.293*c,front-.293*c)]

def board_point(x,d,e=0):
    return (x,2.20-.29*d+e,d+.29*e)

def board_mesh(name,verts,faces,role):
    return mesh(name,[board_point(x,d,e) for x,e,d in verts],faces,role)

def board_prism(name,outline,e0,e1,role,bevel=.035):
    # Three rings form a thick solid with deliberately chamfered outer edge.
    bevel=min(bevel,(e1-e0)*.4)
    cx=sum(x for x,d in outline)/len(outline);cd=sum(d for x,d in outline)/len(outline)
    n=len(outline);verts=[]
    for ring_e,inset in [(e0,0),(e1-bevel,0),(e1,bevel)]:
        for x,d in outline:
            delta=Vector((x-cx,d-cd)); delta.normalize()
            verts.append((x-delta.x*inset,ring_e,d-delta.y*inset))
    faces=[tuple(reversed(range(n))),tuple(range(n*2,n*3))]
    for k in range(2):faces += [(k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i) for i in range(n)]
    return board_mesh(name,verts,faces,role)

def board_box(name,x,d,w,dep,e0,e1,role,bevel=.025):
    outline=[(u+x,v+d) for u,v in octagon(w/2,dep/2,min(.055,w/5,dep/5))]
    return board_prism(name,outline,e0,e1,role,bevel)

def board_cylinder(name,x,d,r,e0,e1,role):
    outline=[(x+r*math.cos(i*math.tau/16),d+r*math.sin(i*math.tau/16)) for i in range(16)]
    return board_prism(name,outline,e0,e1,role,.018)

# Rounded shoulder sections and a narrow foot give depth without heavy armour.
body_levels=[(0,.63,.42,-.51,.28),(.16,.87,.61,-.70,.36),(.52,1.08,.76,-.91,.43),
             (1.13,1.20,.77,-1.02,.43),(1.69,1.16,.69,-1.01,.37)]
verts=[]
for h,w,f,b,c in body_levels:verts += [(x,h,d) for x,d in body_ring(w,f,b,c)]
verts += [(x,board_point(x,d,-.20)[1],d) for x,d in body_ring(1.06,.66,-1.01,.30)]
n=16;faces=[tuple(reversed(range(n))),tuple(range(len(verts)-n,len(verts)))]
for k in range(5):faces += [(k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i) for i in range(n)]
mesh('rounded_planning_console_body',verts,faces,'teal')

# Narrow, continuous bezel: the screen is the face, not a helmet cavity.
outer=[(-.80,1.83),(.80,1.83),(1.045,1.58),(.96,.69),(.57,.25),(-.57,.25),(-.96,.69),(-1.045,1.58)]
extrusion('fitted_display_housing',[(x*.982,1.035+(h-1.035)*.982) for x,h in outer],.52,.89,'teal',.012)
inner=[(x*.82,1.035+(h-1.035)*.84) for x,h in outer]
def rim_depth(x,h):return .93+.15*math.sin(math.pi*h/2)-.065*x*x
def face_depth(x,h):return .905+.12*math.sin(math.pi*h/2)-.09*x*x
verts=[]
for points,delta in [(outer,-.18),(outer,0),(inner,.04),(inner,-.10)]:
    verts += [(x,h,rim_depth(x,h)+delta) for x,h in points]
n=len(outer);faces=[]
for k,l in [(0,1),(1,2),(2,3),(3,0)]:faces += [(k*n+i,k*n+(i+1)%n,l*n+(i+1)%n,l*n+i) for i in range(n)]
mesh('continuous_cream_face_bezel',verts,faces,'cream')
verts=[]
for scale in (1,.66,.33):
    for x,h in inner:
        xx=x*scale;hh=1.035+(h-1.035)*scale
        verts.append((xx,hh,face_depth(xx,hh)))
verts.append((0,1.035,face_depth(0,1.035)))
faces=[]
for k in range(2):faces += [(k*8+i,k*8+(i+1)%8,(k+1)*8+(i+1)%8,(k+1)*8+i) for i in range(8)]
faces += [(16+i,16+(i+1)%8,24) for i in range(8)]
screen=mesh('friendly_curved_display',verts,faces,'screen')
for p in screen.data.polygons:p.use_smooth=True

# The inclined desk is an actual structural canopy. One coherent cream rim.
out=octagon(1.39,1.20,.22);inside=octagon(1.205,1.035,.19)
verts=[]
for points,e in [(out,-.19),(out,-.055),(inside,.035),(inside,-.145)]:verts += [(x,e,d) for x,d in points]
faces=[]
for k,l in [(0,1),(1,2),(2,3),(3,0)]:faces += [(k*8+i,k*8+(i+1)%8,l*8+(i+1)%8,l*8+i) for i in range(8)]
board_mesh('drafting_desk_cream_frame',verts,faces,'cream')
board_prism('inset_blueprint_work_surface',inside,-.15,.033,'teal',.009)

# Three layered plans have supported roots buried beneath the rear canopy.
for i in range(3):
    board_box('staggered_plan_sheet_'+str(i),0,-.91-.08*i,2.25,.86,-.35-.19*i,-.245-.19*i,'cream',.022)

# Primary diagram node masses are retained in the blockout.
board_box('application_node_seat',0,-.58,.85,.62,.034,.092,'screen',.018)
board_box('application_window_housing',0,-.58,.78,.55,.086,.29,'orange',.045)
board_box('service_module_seat',-.59,.43,.70,.63,.034,.084,'screen',.018)
board_box('service_module',-.59,.43,.63,.56,.075,.255,'cream',.035)
board_cylinder('data_store_seat',.61,.44,.335,.034,.09,'screen')
board_cylinder('data_store',.61,.44,.29,.078,.37,'cream')

# A fitted horizontal blueprint roll; broad saddle gives an explicit seat.
extrusion('blueprint_roll_saddle',[(-.60,.66),(.67,.66),(.67,1.11),(-.60,1.11)],1.06,1.255,'teal',.055,axis='side')
def roll_piece(name,d0,d1,r,role):
    outline=[(1.30+r*math.cos(i*math.tau/16),.89+r*math.sin(i*math.tau/16)) for i in range(16)]
    return extrusion(name,outline,d0,d1,role,min(.012,(d1-d0)*.3))
roll_piece('rolled_blueprint_paper',-.55,.62,.24,'cream')

if True:  # Eye placeholders retain the established two-material contract in blockout.
    for cx in (-.31,.31):
        outline=[];radius=.082;center=1.08;half=.155
        for k in range(9):
            a=math.pi*k/8;outline.append((cx+radius*math.cos(a),center+half+radius*math.sin(a)))
        for k in range(9):
            a=math.pi+math.pi*k/8;outline.append((cx+radius*math.cos(a),center-half+radius*math.sin(a)))
        eye=extrusion('cyan_eye_'+str(cx),outline,.006,.023,'cyan',.004)
        for v in eye.data.vertices:v.co.y-=face_depth(v.co.x,v.co.z)
if DETAIL:
    # Single mitered branch, with all ends physically seated under the nodes.
    route=[(-.065,-.41),(.065,-.41),(.065,.04),(.67,.34),(.61,.46),(0,.155),(-.61,.46),(-.67,.34),(-.065,.04)]
    board_prism('architecture_connection_route',route,.039,.077,'cyan',.002)
    # An application window, not another generic chip: large header and content.
    board_box('application_window_display',0,-.58,.57,.36,.29,.308,'screen',.004)
    board_box('application_window_header',0,-.675,.49,.065,.308,.316,'cyan',.003)
    board_box('application_window_content_a',-.135,-.525,.19,.125,.308,.317,'cream',.004)
    board_box('application_window_content_b',.13,-.525,.19,.125,.308,.317,'cream',.004)
    # UML-like component badge: a package with two visible interface tabs.
    board_box('service_component_badge',-.57,.43,.31,.33,.255,.270,'teal',.004)
    board_box('service_component_port_a',-.735,.35,.105,.075,.270,.284,'cream',.004)
    board_box('service_component_port_b',-.735,.51,.105,.075,.270,.284,'cream',.004)
    # Distinct database stack: two recessed dark belts plus a top inset disk.
    board_cylinder('data_store_separator_a',.61,.44,.294,.153,.183,'teal')
    board_cylinder('data_store_separator_b',.61,.44,.294,.258,.288,'teal')
    board_cylinder('data_store_top_inset',.61,.44,.19,.37,.383,'teal')
    for i,d in enumerate((-.43,.40)):roll_piece('orange_roll_retainer_'+str(i),d,d+.105,.257,'orange')
    # Paper spirals avoid the black bore/nozzle reading of a generic cylinder.
    for end in (-.565,.632):
        roll_piece('roll_teal_end_core',end-.012,end+.012,.177,'teal')
        verts=[];steps=42
        for i in range(steps+1):
            t=i/steps;a=t*math.pi*3.5;r=.15*(1-t)+.017
            for rr in (r-.012,r+.012):
                verts.append((1.30+rr*math.cos(a),.89+rr*math.sin(a),end+(.016 if end>0 else -.016)))
        faces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(steps)]
        if end<0:faces=[tuple(reversed(f)) for f in faces]
        mesh('visible_paper_spiral',verts,faces,'cream')

for group,name in (([p for p in parts if p.get('palette_role')!='cyan'],'pavilion_body'),([p for p in parts if p.get('palette_role')=='cyan'],'pavilion_eyes')):
    if not group:continue
    bpy.ops.object.select_all(action='DESELECT')
    for p in group:p.select_set(True)
    bpy.context.view_layer.objects.active=group[0]
    bpy.ops.object.join();bpy.context.object.name=name
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bpy.ops.object.select_all(action='DESELECT')
for name,p in [('anchor_ui',(0,3.15,0)),('anchor_action',(0,2.35,.02)),('anchor_target',(0,1.30,0))]:
    a=bpy.data.objects.new(name,None);scene.collection.objects.link(a);a.parent=root;a.location=xyz(p)
scene.render.fps=30;scene.frame_set(0)
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ.get('ASSET_SOURCE_NAME','copilot_architect_v01.blend')))

