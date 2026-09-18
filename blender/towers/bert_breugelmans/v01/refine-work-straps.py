"""Refine the current packed source without rebuilding unrelated character art."""
import bpy,bmesh,importlib.util,json
from pathlib import Path
base=Path(__file__).parent
def module(name):
    spec=importlib.util.spec_from_file_location('bert_'+name,base/(name+'.py'))
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
pack=bpy.data.objects['cohesion_pack'];mapping=pack['palette_roles'];teal=int(mapping['roles']['teal'])
bm=bmesh.new();bm.from_mesh(pack.data)
role=bm.loops.layers.float[mapping['attribute']]
strap_faces=[f for f in bm.faces if all(round(l[role])==teal for l in f.loops)]
old_vertices={v for f in strap_faces for v in f.verts}
assert len(strap_faces)>0
assert all(f in strap_faces for v in old_vertices for f in v.link_faces),'Shared strap vertices need explicit handling'
uv_values={uv.name:strap_faces[0].loops[0][bm.loops.layers.uv[uv.name]].uv.copy() for uv in pack.data.uv_layers}
mat_index=strap_faces[0].material_index
bmesh.ops.delete(bm,geom=list(old_vertices),context='VERTS')
deform=bm.verts.layers.deform.verify();body=pack.vertex_groups['body'].index
straps=module('straps')
for side in (-1,1):
    vertices,faces=straps.geometry(side);new=[bm.verts.new(v) for v in vertices]
    for v in new:v[deform][body]=1
    for indices in faces:
        f=bm.faces.new([new[i] for i in indices]);f.material_index=mat_index;f.smooth=False
        for loop in f.loops:
            loop[role]=teal
            for name,value in uv_values.items():loop[bm.loops.layers.uv[name]].uv=value
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(pack.data);bm.free();pack.data.update()
rig=bpy.data.objects['bert_rig'];module('celebrate').author(rig);module('work').author(rig)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
count=0
for o in bpy.data.objects:
    if o.type=='MESH':o.data.calc_loop_triangles();count+=len(o.data.loop_triangles)
print('REFINED',json.dumps({'triangles':count,'workFrames':list(bpy.data.actions['work'].frame_range)}))
