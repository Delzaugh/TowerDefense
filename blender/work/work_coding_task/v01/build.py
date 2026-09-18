"""Coding Task: one palette mesh with three independent checkbox morphs."""
import bpy, bmesh, json, os, math
from pathlib import Path
from mathutils import Vector

out = Path(os.environ['ASSET_BUILD_DIR'])
m = json.loads(Path(os.environ['ASSET_MANIFEST']).read_text(encoding='utf-8-sig'))
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
scene.render.fps = 24
verts, faces, roles = [], [], []
targets = {}

def collect(o, role):
    bpy.context.view_layer.update()
    start = len(verts)
    verts.extend(tuple(o.matrix_world @ v.co) for v in o.data.vertices)
    for p in o.data.polygons:
        faces.append(tuple(start+i for i in p.vertices))
        roles.append(role if role else o.data.materials[p.material_index].name)
    bpy.data.objects.remove(o, do_unlink=True)

def box(center, size, role, bevel=0, angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    o = bpy.context.object; o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod=o.modifiers.new('soft_edges','BEVEL'); mod.width=bevel; mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    o.rotation_euler.y=angle
    collect(o,role)

def stroke(a,b,width,role,y=-.103):
    dx,dz=b[0]-a[0],b[1]-a[1]
    box(((a[0]+b[0])/2,y,(a[1]+b[1])/2),(width,.012,math.hypot(dx,dz)),role,.003,math.atan2(dx,dz))

def prism(profile, front, back, role, bevel=0):
    if bevel:
        n=len(profile)
        points=[(x,y,z) for y in (front,back) for x,z in profile]
        polygons=[tuple(range(n)),tuple(reversed(range(n,2*n)))]
        polygons.extend((i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n))
        mesh=bpy.data.meshes.new('cut_card'); mesh.from_pydata(points,[],polygons); mesh.update()
        bm=bmesh.new(); bm.from_mesh(mesh); bmesh.ops.recalc_face_normals(bm,faces=bm.faces); bm.to_mesh(mesh); bm.free()
        o=bpy.data.objects.new('cut_card',mesh); scene.collection.objects.link(o)
        bpy.context.view_layer.objects.active=o; o.select_set(True)
        mod=o.modifiers.new('soft_edges','BEVEL'); mod.width=bevel; mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
        collect(o,role)
        return
    start=len(verts); n=len(profile)
    for y in (front,back): verts.extend((x,y,z) for x,z in profile)
    faces.extend([tuple(start+i for i in range(n)),tuple(start+n+i for i in reversed(range(n)))]); roles.extend([role]*2)
    for i in range(n):
        faces.append((start+i,start+(i+1)%n,start+n+(i+1)%n,start+n+i)); roles.append(role)

root=bpy.data.objects.new('root',None); scene.collection.objects.link(root)
root['asset']='work_coding_task_v01'
# One closed shell: the blue fold and cream paper share vertices and edges.
# The color boundary is a coplanar partition, not an overlapping triangle.
profile=[(-.48,0),(.48,0),(.48,1.195),(.235,1.44),(-.48,1.44),(.235,1.195)]
points=[(x,y,z) for y in (-.08,.08) for x,z in profile]
shell_faces=[(0,1,2,5,3,4),(3,5,2),(10,9,11,8,7,6),(8,11,9)]
shell_roles=['paper','fold','paper','fold']
for i,role in enumerate(['paper','paper','fold_light','paper','paper']):
    j=(i+1)%5; shell_faces.append((i,j,j+6,i+6)); shell_roles.append(role)
shell=bpy.data.meshes.new('continuous_fold_shell'); shell.from_pydata(points,[],shell_faces); shell.update()
for name in ['paper','fold','fold_light']:
    shell.materials.append(bpy.data.materials.new(name))
for p,role in zip(shell.polygons,shell_roles): p.material_index=['paper','fold','fold_light'].index(role)
bm=bmesh.new(); bm.from_mesh(shell); bmesh.ops.recalc_face_normals(bm,faces=bm.faces); bm.to_mesh(shell); bm.free()
o=bpy.data.objects.new('continuous_fold_shell',shell); scene.collection.objects.link(o)
bpy.context.view_layer.objects.active=o; o.select_set(True)
mod=o.modifiers.new('continuous_soft_perimeter','BEVEL'); mod.width=.014; mod.segments=2
mod.limit_method='ANGLE'; mod.angle_limit=.5
bpy.ops.object.modifier_apply(modifier=mod.name)
# Authoring guard: the paper/fold shell must remain a closed manifold.
bm=bmesh.new(); bm.from_mesh(o.data); assert all(e.is_manifold for e in bm.edges); bm.free()
collect(o,None)
box((-.115,-.087,1.245),(.55,.035,.205),'badge',.018)
# Compact block lettering avoids external fonts and stays readable at small size.
glyphs={'T':['111','010','010','010','010'],'A':['010','101','111','101','101'],
        'S':['111','100','111','001','111'],'K':['101','110','100','110','101']}
unit=.022
for letter,ch in enumerate('TASK'):
    for row,line in enumerate(glyphs[ch]):
        for col,on in enumerate(line):
            if on=='1':
                x=-.274+letter*.085+col*unit; z=1.290-row*unit; start=len(verts)
                verts.extend((x+dx,-.110,z+dz) for dx,dz in [(-unit/2,-unit/2),(unit/2,-unit/2),(unit/2,unit/2),(-unit/2,unit/2)])
                faces.append(tuple(start+j for j in range(4))); roles.append('white')
# Single mitered outlines remove the old crossing bars at each chevron elbow.
left=[(-.125,1.085),(-.285,.945),(-.125,.805),(-.081,.855),(-.186,.945),(-.081,1.035)]
prism(left,-.113,-.086,'ink',.004)
prism([(-x,z) for x,z in reversed(left)],-.113,-.086,'ink',.004)
prism([(-.079,.813),(-.017,.793),(.079,1.077),(.017,1.097)],-.113,-.086,'ink',.004)
def rounded_square(h,c):
    return [(-h+c,-h),(h-c,-h),(h,-h+c),(h,h-c),(h-c,h),(-h+c,h),(-h,h-c),(-h,-h+c)]

def checkbox_frame(x,z):
    # Six connected octagonal rings form one closed, softly chamfered frame.
    # Shared corners remove the seams and uneven ends of the old four bars.
    start=len(verts)
    for h,c,y in [(.073,.010,-.081),(.073,.010,-.094),(.070,.009,-.097),
                  (.052,.005,-.097),(.049,.004,-.094),(.049,.004,-.081)]:
        verts.extend((x+dx,y,z+dz) for dx,dz in rounded_square(h,c))
    for ring in range(6):
        next_ring=(ring+1)%6
        for j in range(8):
            faces.append((start+ring*8+j,start+ring*8+(j+1)%8,
                          start+next_ring*8+(j+1)%8,start+next_ring*8+j))
            roles.append('line')
    return range(start,len(verts))

for i,z in enumerate((.63,.445,.26),1):
    x=-.295
    frame_vertices=checkbox_frame(x,z)
    # Checked states replace the gray frame, preventing any exposed gray lip.
    row_target={j:(verts[j][0],verts[j][1]+.05,verts[j][2]) for j in frame_vertices}
    length=(.49,.42,.44)[i-1]
    box((-.13+length/2,-.084,z),(length,.018,.055),'line',.005)
    start=len(verts)
    prism([(x+dx,z+dz) for dx,dz in rounded_square(.073,.010)],-.097,-.081,'done',.003)
    tick=[(-.050,-.003),(-.013,-.043),(.051,.030),(.036,.044),(-.014,-.012),(-.035,.012)]
    prism([(x+dx,z+dz) for dx,dz in tick],-.108,-.098,'white',.002)
    row_target.update({j:verts[j] for j in range(start,len(verts))})
    targets['checkbox_'+str(i)]=row_target
    # In the basis pose the checked overlay sits completely inside the opaque sheet.
    for j in range(start,len(verts)):
        x0,y0,z0=verts[j]; verts[j]=(x0,y0+.115,z0)

data=bpy.data.meshes.new('coding_task_mesh'); data.from_pydata(verts,[],faces); data.update()
bm=bmesh.new(); bm.from_mesh(data); bmesh.ops.recalc_face_normals(bm,faces=bm.faces); bm.to_mesh(data); bm.free()
obj=bpy.data.objects.new('coding_task',data); scene.collection.objects.link(obj); obj.parent=root
obj.animation_data_create()  # Let the glTF NLA sampler evaluate this mesh's key tracks.
def linear(h):
    c=[int(h.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c)+(1,)
colors={k:linear(v) for k,v in m['palette']['colors'].items()}; ids={k:i+1 for i,k in enumerate(colors)}
data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
for p,role in zip(data.polygons,roles):
    for li in p.loop_indices:
        data.color_attributes['Color'].data[li].color=colors[role]
        data.attributes['_palette_role'].data[li].value=ids[role]
obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':ids}
mat=bpy.data.materials.new('task_palette'); mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF'); bs.inputs['Roughness'].default_value=.82
attr=mat.node_tree.nodes.new('ShaderNodeVertexColor'); attr.layer_name='Color'
mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color']); data.materials.append(mat)
obj.shape_key_add(name='Basis')
for name,positions in targets.items():
    key=obj.shape_key_add(name=name)
    for j,pos in positions.items(): key.data[j].co=pos
    key.value=0
keys=data.shape_keys; keys.animation_data_create()
action=bpy.data.actions.new('checklist_progress'); keys.animation_data.action=action
for i in range(1,4):
    key=keys.key_blocks['checkbox_'+str(i)]
    for frame,value in [(0,0),(i*8-1,0),(i*8,1),(24,1)]:
        key.value=value; key.keyframe_insert(data_path='value',frame=frame)
# Constant values make the preview a sequence of achieved states, without half ticks.
for layer in action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for point in curve.keyframe_points: point.interpolation='CONSTANT'
action.use_fake_user=True
track=keys.animation_data.nla_tracks.new(); track.name='checklist_progress'
track.strips.new('checklist_progress',0,action); track.mute=True
keys.animation_data.action=None
for key in keys.key_blocks: key.value=0
# A separate transform parent keeps body motion independent of checklist weights.
motion=bpy.data.objects.new('task_motion',None); scene.collection.objects.link(motion)
motion.parent=root; obj.parent=motion; motion.rotation_mode='XYZ'
motion.animation_data_create()
for clip,frames in [('idle',48),('move',48),('resolve',24)]:
    action=bpy.data.actions.new(clip); motion.animation_data.action=action
    for frame in range(frames+1):
        t=frame/frames; phase=math.tau*t
        motion.location=(0,0,0); motion.rotation_euler=(0,0,0); motion.scale=(1,1,1)
        if clip=='idle':
            motion.location.z=.18+.012*math.sin(phase)
            motion.rotation_euler.z=.018*math.sin(phase)
        elif clip=='move':
            # Sustained air gap, slow drift and a slight forward lean; no steps.
            motion.location.z=.18+.025*math.sin(phase)
            motion.rotation_euler.x=-.045
            motion.rotation_euler.y=.018*math.sin(phase)
            motion.rotation_euler.z=.025*math.sin(phase)
        else:
            if t<.25:
                s=1+.09*math.sin(math.pi*t/.5)
            else:
                u=(t-.25)/.75; ease=u*u*(3-2*u); s=1.09*(1-ease)+.015*ease
            motion.scale=(s,s,s)
            motion.location.z=.18+.15*math.sin(math.pi*t)
            motion.rotation_euler.z=.30*math.sin(math.pi*t)
        for prop in ('location','rotation_euler','scale'):
            motion.keyframe_insert(data_path=prop,frame=frame)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for point in curve.keyframe_points: point.interpolation='LINEAR'
    action.use_fake_user=True
    track=motion.animation_data.nla_tracks.new(); track.name=clip
    track.strips.new(clip,0,action); track.mute=True
motion.animation_data.action=None
motion.location=(0,0,0); motion.rotation_euler=(0,0,0); motion.scale=(1,1,1)
for name,pos in [('anchor_ui',(0,0,1.60)),('anchor_target',(0,0,.75))]:
    o=bpy.data.objects.new(name,None); scene.collection.objects.link(o); o.parent=motion; o.location=pos
scene.frame_start=0; scene.frame_end=48; scene.frame_set(0)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active=obj
bpy.context.preferences.filepaths.save_version=0
data.calc_loop_triangles(); assert len(data.loop_triangles)<=m['budgets']['triangles'],len(data.loop_triangles)
bpy.ops.wm.save_as_mainfile(filepath=str(out/os.environ['ASSET_SOURCE_NAME']))
print('CODING_TASK_STATS',len(data.loop_triangles),'triangles; default weights:',[k.value for k in keys.key_blocks])
