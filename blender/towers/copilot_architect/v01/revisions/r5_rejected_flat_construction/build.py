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

# Primary volume: compact octagonal shell, broad shoulders and tapered underside.
shell=loft('deep_teal_shell',[(0,.73,.60,.20),(.20,1.01,.83,.20),(.65,1.23,.95,.19),(1.66,1.29,.96,.20),(1.93,1.13,.81,.19)],'teal')
for v in shell.data.vertices:
    if v.co.y < 0: v.co.y *= .85
face=[(-1.04,1.98),(1.04,1.98),(.99,1.66),(.50,.33),(-.50,.33),(-.99,1.66)]
extrusion('recessed_trapezoid_display',face,.89,.955,'screen',.035)

# Fitted diagonal cheek armour. The upper and lower plates share a deliberate narrow seam.
cheek=[(.96,1.86),(1.20,1.58),(1.09,.87),(.78,.63),(.49,.53)]
lower=[(.49,.50),(.78,.60),(1.08,.83),(.74,.16),(.48,.12),(.37,.20)]
for side in (-1,1):
    extrusion('upper_cheek_seat_'+str(side),[(side*x,h) for x,h in cheek],.76,.965,'teal',.018)
    extrusion('lower_cheek_seat_'+str(side),[(side*x,h) for x,h in lower],.65,.905,'teal',.018)
    extrusion('upper_cheek_'+str(side),[(side*x,h) for x,h in cheek],.92,1.13,'cream',.025)
    extrusion('lower_cheek_'+str(side),[(side*x,h) for x,h in lower],.86,1.08,'cream',.023)
extrusion('chin_bridge',[(-.48,.39),(.48,.39),(.36,.06),(-.36,.06)],.91,1.12,'cream',.025)

# Broad stepped crown. Crown lower ring includes front eave drops, one coherent solid.
base=[(-1.27,1.12),(-1.04,1.12),(1.04,1.12),(1.27,1.12),(1.43,.96),(1.43,-.96),(1.27,-1.12),(-1.27,-1.12),(-1.43,-.96),(-1.43,.96)]
heights=[1.72,1.94,1.94,1.72,1.77,1.94,1.94,1.94,1.94,1.77]
verts=[(x,h,d) for (x,d),h in zip(base,heights)]
verts += [(x*1.23/1.43,2.24,d*.93/1.12) for x,d in base]
verts += [(0,1.94,0)]
n=len(base)
faces=[tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
faces += [(20,(i+1)%n,i) for i in range(n)]
mesh('projecting_pavilion_eave',verts,faces,'cream')
loft('middle_crown',[(2.24,1.13,.83,.10),(2.475,.99,.70,.08)],'cream')
loft('upper_crown',[(2.475,.82,.59,.07),(2.68,.71,.49,.06)],'cream')

# Flush fitted side modules, silhouette present before detailing.
panel=[(.68,1.69),(.49,1.87),(-.64,1.87),(-.88,1.64),(-.88,.62),(-.50,.25),(.44,.25),(.69,.53)]
for side in (-1,1):
    extrusion('side_module_'+str(side),panel,side*1.17,side*1.31,'teal',.065,axis='side')

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
        extrusion('cyan_eye_'+str(cx),outline,.956,.976,'cyan')
    extrusion('orange_chin_tab',[(-.14,.27),(.14,.27),(.19,0),(-.19,0)],1.10,1.18,'orange',.018)
    # Upper latch follows the sloping cap, without extending into the face.
    extrusion('crown_latch',[(.49,2.67),(.52,2.70),(.65,2.70),(.85,2.43),(.72,2.43),(.70,2.47),(.59,2.48)],-.14,.14,'orange',.01,axis='side')
    for side in (-1,1):
        extrusion('edge_strip_socket_'+str(side),[(.48,.48),(.64,.48),(.64,.95),(.48,.95)],side*1.26,side*1.32,'screen',.025,axis='side')
        extrusion('orange_edge_strip_'+str(side),[(.515,.52),(.61,.52),(.61,.91),(.515,.91)],side*1.315,side*1.35,'orange',.019,axis='side')

    # Left-side blueprint: closed rectangular rings, four aligned windows and a scroll spindle.
    # glTF positive X is character-left when facing +Z.
    def graphic_ring(name, outer, inner):
        n=len(outer); verts=[(1.314,h,d) for d,h in outer]+[(1.314,h,d) for d,h in inner]
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
        mesh('scroll_rail',[(1.314,.73,d-.011),(1.314,1.57,d-.011),(1.314,1.57,d+.011),(1.314,.73,d+.011)],[(0,1,2,3)],'cream')
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
