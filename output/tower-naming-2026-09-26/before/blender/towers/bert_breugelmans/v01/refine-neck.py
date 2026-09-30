"""Replace only the narrow neck component with a fitted closed upper chest."""
import bpy,bmesh,importlib.util,json
from pathlib import Path
base=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
rig=bpy.data.objects['bert_rig'];skin=bpy.data.objects['bert_skin']
rig.animation_data.action=None
for track in rig.animation_data.nla_tracks:track.mute=True
for bone in rig.pose.bones:bone.matrix_basis.identity()
shift=rig.data.bones['body'].head_local.z-1.35
bm=bmesh.new();bm.from_mesh(skin.data)
# The neck is a separate closed skin component beneath the face and inside the collar.
remaining=set(bm.verts);candidates=[]
while remaining:
    group={remaining.pop()};pending=list(group)
    while pending:
        for edge in pending.pop().link_edges:
            for v in edge.verts:
                if v in remaining:remaining.remove(v);group.add(v);pending.append(v)
    if len(group) in (20,28,29) and all(abs(v.co.x)<.21 and abs(v.co.y)<.18 and 1.88+shift<v.co.z<2.321+shift for v in group):candidates.append(group)
assert len(candidates)==1,[(len(g),min(v.co.z for v in g),max(v.co.z for v in g)) for g in candidates]
old=candidates[0];sample=next(iter(old)).link_faces[0]
mapping=skin['palette_roles'];role=bm.loops.layers.float[mapping['attribute']];deform=bm.verts.layers.deform.verify()
uvs={uv.name:sample.loops[0][bm.loops.layers.uv[uv.name]].uv.copy() for uv in skin.data.uv_layers};material=sample.material_index
bmesh.ops.delete(bm,geom=list(old),context='VERTS')
spec=importlib.util.spec_from_file_location('bert_neck',base/'neck.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
vertices,faces,weights=module.geometry(shift);new=[bm.verts.new(v) for v in vertices]
for v,weight in zip(new,weights):
    for name,value in weight.items():v[deform][skin.vertex_groups[name].index]=value
for indices in faces:
    face=bm.faces.new([new[i] for i in indices]);face.material_index=material;face.smooth=True
    for loop in face.loops:
        loop[role]=int(mapping['roles']['skin'])
        for name,uv in uvs.items():loop[bm.loops.layers.uv[name]].uv=uv
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(skin.data);bm.free();skin.data.update()
triangles=0
for obj in bpy.data.objects:
    if obj.type=='MESH':obj.data.calc_loop_triangles();triangles+=len(obj.data.loop_triangles)
assert triangles<=4500,triangles
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
print('FITTED_NECK',json.dumps({'triangles':triangles,'neckVertices':len(vertices)}))
