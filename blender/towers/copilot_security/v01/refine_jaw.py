"""Replace the moustache-like white applique with the jaw's continuous blue rim.

Build from the immutable animated source so rig, clips and unrelated art survive.
The guarded pipeline supplies the staging destination; never overwrite the input.
"""
import bpy, bmesh, hashlib, json, os
from pathlib import Path

HERE = Path(__file__).resolve().parent
source = HERE / 'revisions/r16_before_jaw_rim_refinement/copilot_security_v01.blend'
assert hashlib.sha256(source.read_bytes()).hexdigest() == '3bbc73490bf7a13f61f73086ccd807d2143b09a8c2f643b8c43c3f660dbf7bde'
bpy.ops.wm.open_mainfile(filepath=str(source))
ob = bpy.data.objects['security_model']
me = ob.data
assert me.shape_keys is None
jaw_group = ob.vertex_groups['projecting_swept_jaw'].index
lip_group = ob.vertex_groups['fitted_jaw_white_lip'].index
ids = lambda group: {v.index for v in me.vertices if any(g.group == group for g in v.groups)}
jaw_ids, lip_ids = ids(jaw_group), ids(lip_group)
assert len(jaw_ids) == 110 and len(lip_ids) == 28
before = {v.index: (tuple(v.co), [(g.group, g.weight) for g in v.groups]) for v in me.vertices}
normals = {(p.index, me.loops[i].vertex_index): tuple(me.corner_normals[i].vector) for p in me.polygons for i in p.loop_indices}
uvs = {layer.name: {(p.index, me.loops[i].vertex_index): tuple(layer.data[i].uv) for p in me.polygons for i in p.loop_indices} for layer in me.uv_layers}

# Raise the V-shaped centre to the shoulder stations at +/- .54 m. The last
# .19 m on each side retains a shallow upward sweep into the cheek attachments.
# Blend only above .523 m so the seated shield, lower chin and ground stay fixed.
changed = []
for v in me.vertices:
    if v.index not in jaw_ids:
        continue
    x, y, z = v.co
    lateral = max(0.0, 1.0 - abs(x) / .54)
    height = min(1.0, max(0.0, (z - .523) / .035))
    height = height * height * (3.0 - 2.0 * height)
    shift = .0850685 * lateral * height
    if shift > 1e-8:
        v.co.z += shift
        changed.append(v.index)

# Keep original indices as temporary mesh attributes through deletion. This
# lets us retain exact authored corner normals and UVs outside the changed jaw.
for name, domain, elements in [('jaw_old_vertex', 'POINT', me.vertices), ('jaw_old_face', 'FACE', me.polygons)]:
    attribute = me.attributes.new(name, 'INT', domain)
    for element in elements:
        attribute.data[element.index].value = element.index
bm = bmesh.new()
bm.from_mesh(me)
old_vertex_layer = bm.verts.layers.int['jaw_old_vertex']
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v[old_vertex_layer] in lip_ids], context='VERTS')
bm.to_mesh(me)
bm.free()
old_vertices = [d.value for d in me.attributes['jaw_old_vertex'].data]
old_faces = [d.value for d in me.attributes['jaw_old_face'].data]
for v in me.vertices:
    original = old_vertices[v.index]
    assert [(g.group, g.weight) for g in v.groups] == before[original][1]
    if original not in jaw_ids:
        assert tuple(v.co) == before[original][0], original
restored_normals = []
for p in me.polygons:
    for loop_index in p.loop_indices:
        original_vertex = old_vertices[me.loops[loop_index].vertex_index]
        key = (old_faces[p.index], original_vertex)
        restored_normals.append((0, 0, 0) if original_vertex in jaw_ids else normals[key])
        for layer in me.uv_layers:
            assert tuple(layer.data[loop_index].uv) == uvs[layer.name][key]
me.normals_split_custom_set(restored_normals)
me.attributes.remove(me.attributes['jaw_old_vertex'])
me.attributes.remove(me.attributes['jaw_old_face'])
# Keep the now-empty non-deforming part group so every animation bone/group
# index retains its previous value. No applique geometry is left in the mesh.
me.update()
me.calc_loop_triangles()
assert len(me.loop_triangles) == 2802
for tri in me.loop_triangles:
    a, b, c = [me.vertices[i].co for i in tri.vertices]
    assert (b-a).cross(c-a).length > 1e-10
bpy.data.objects['root']['jaw_refinement'] = 'Integrated cobalt rim; broad level centre and shallow rising ends; removed white applique, 2026-09-26'
output = Path(os.environ.get('ASSET_BUILD_DIR', str(HERE / 'renders/jaw-refinement-source')))
output.mkdir(parents=True, exist_ok=True)
# Retained-source rebuilds must respect current declared base colours while
# preserving the original independent emission texture.
import importlib.util
palette_spec = importlib.util.spec_from_file_location('shared_palette_refinement', HERE.parents[3] / 'tools/asset-pipeline/refine_shared_palette.py')
palette_module = importlib.util.module_from_spec(palette_spec)
palette_spec.loader.exec_module(palette_module)
palette_manifest = json.loads(Path(os.environ.get('ASSET_MANIFEST', HERE / 'asset.json')).read_text(encoding='utf-8-sig'))
palette_module.apply_manifest_swatches(palette_manifest)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(output / os.environ.get('ASSET_SOURCE_NAME', 'copilot_security_v01.blend')))
report = {'baselineSourceHash': hashlib.sha256(source.read_bytes()).hexdigest(), 'removedLipVertices': len(lip_ids), 'changedJawVertices': changed, 'triangles': len(me.loop_triangles), 'unrelatedPositionsWeightsUVsPreserved': True, 'animationActions': [a.name for a in bpy.data.actions]}
(output / 'jaw_source_refinement.json').write_text(json.dumps(report, indent=2) + '\n')
print('JAW_REFINEMENT', json.dumps(report))
