"""Replace only hand surfaces and digit pivots, then bake affected clips."""
import bpy,bmesh,importlib.util,json
from pathlib import Path
from mathutils import Vector
base=Path(__file__).parent
def module(name):
    spec=importlib.util.spec_from_file_location('bert_'+name,base/(name+'.py'))
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
source=base/'bert_breugelmans_v01.blend';bpy.ops.wm.open_mainfile(filepath=str(source))
rig=bpy.data.objects['bert_rig'];skin=bpy.data.objects['bert_skin'];hands=module('hands')
rig.animation_data.action=None
for t in rig.animation_data.nla_tracks:t.mute=True
module('celebrate').reset(rig)
bm=bmesh.new();bm.from_mesh(skin.data);deform=bm.verts.layers.deform.verify();mapping=skin['palette_roles'];role=bm.loops.layers.float[mapping['attribute']]
groups={g.index for g in skin.vertex_groups if g.name.startswith(('hand_','fingers_','digits_','thumb_'))}
old=[v for v in bm.verts if any(i in groups and weight>0 for i,weight in v[deform].items())]
old_set=set(old);faces=[f for f in bm.faces if all(v in old_set for v in f.verts)]
assert all(all(v in old_set for v in f.verts) for v in old for f in v.link_faces)
uvs={uv.name:faces[0].loops[0][bm.loops.layers.uv[uv.name]].uv.copy() for uv in skin.data.uv_layers}
material=faces[0].material_index
bmesh.ops.delete(bm,geom=old,context='VERTS')
pivots={}
for side,s in [('l',-1),('r',1)]:
    wrist=rig.data.bones['hand_'+side].head_local.copy()
    vertices,polygons,weights=hands.geometry(side,s,wrist);new=[bm.verts.new(v) for v in vertices]
    for v,weights in zip(new,weights):
        for name,weight in weights.items():v[deform][skin.vertex_groups[name].index]=weight
    for ids in polygons:
        face=bm.faces.new([new[i] for i in ids]);face.material_index=material;face.smooth=True
        for loop in face.loops:
            loop[role]=int(mapping['roles']['skin'])
            for name,uv in uvs.items():loop[bm.loops.layers.uv[name]].uv=uv
    pivots.update(hands.pivots(side,s,wrist))
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(skin.data);bm.free();skin.data.update()
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
for name,point in pivots.items():rig.data.edit_bones[name].head=point;rig.data.edit_bones[name].tail=Vector(point)+Vector((0,.12,0))
bpy.ops.object.mode_set(mode='OBJECT')
for name in ('celebrate','move','work'):module(name).author(rig)
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(source))
count=0
for o in bpy.data.objects:
    if o.type=='MESH':o.data.calc_loop_triangles();count+=len(o.data.loop_triangles)
print('HAND_REFINEMENT',json.dumps({'triangles':count,'bones':len(rig.data.bones)}));assert count<=4500
