"""Adopt the user's rendered study without altering its mesh or palette.

One-time source adoption. Future refinement uses the canonical editable .blend
and ordinary guarded export, not the superseded eight-pod procedural recipe.
"""
import hashlib
import json
import math
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
REFERENCE = HERE / 'references/six_shooter_study/linter_six_shooter_concept.blend'
EXPECTED_REFERENCE = 'acd510f7ecf0d4cef8d4789de9a1001496e326ef175faf7a5041f168243d1c98'


def mesh_signature(obj):
    mesh = obj.data
    data = {
        'vertices': [list(v.co) for v in mesh.vertices],
        'faces': [list(p.vertices) for p in mesh.polygons],
        'material_indices': [p.material_index for p in mesh.polygons],
        'smooth': [p.use_smooth for p in mesh.polygons],
        'uv': [list(p.uv) for p in mesh.uv_layers.active.data],
        'groups': [(g.name, [(v.index, w.weight) for v in mesh.vertices
                            for w in v.groups if w.group == g.index])
                   for g in obj.vertex_groups],
    }
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()


assert hashlib.sha256(REFERENCE.read_bytes()).hexdigest() == EXPECTED_REFERENCE
bpy.ops.wm.open_mainfile(filepath=str(REFERENCE))
obj = bpy.data.objects['linter_agent_model']
signature = mesh_signature(obj)
mesh = obj.data
mesh.calc_loop_triangles()
ports = []
for i in range(6):
    group = obj.vertex_groups[f'lime_rule_socket_{i}']
    points = [v.co for v in mesh.vertices
              if any(g.group == group.index for g in v.groups)]
    center = [sum(p[j] for p in points) / len(points) for j in range(3)]
    angle = math.degrees(math.atan2(center[0], -center[1])) % 360
    assert abs(angle - (30 + 60 * i)) < 0.00001
    ports.append({'id': f'S{i + 1}', 'azimuthDegrees': angle,
                  'sectorDegrees': [i * 60, (i + 1) * 60],
                  'blenderCenter': center})
assert len([g for g in obj.vertex_groups if g.name.startswith('lime_rule_socket_')]) == 6
assert len(mesh.loop_triangles) == 2364
assert len(mesh.vertices) == 1252
assert not bpy.data.actions
assert all(image.packed_file for image in bpy.data.images)

root = bpy.data.objects['root']
root['design'] = 'Exact six-shooter study used in user-supplied specification sheets, adopted 2026-09-24'
root['reference_sha256'] = EXPECTED_REFERENCE
root['shooter_count'] = 6
root['shooter_centerline_degrees'] = [30, 90, 150, 210, 270, 330]
root['shooter_sector_degrees'] = 60
root['animation_status'] = 'model review; animation pending user authorization'

assert mesh_signature(obj) == signature
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(HERE / 'copilot_linter_v01.blend'))
bpy.ops.wm.open_mainfile(filepath=str(HERE / 'copilot_linter_v01.blend'))
assert mesh_signature(bpy.data.objects['linter_agent_model']) == signature
report = {
    'reference': str(REFERENCE.relative_to(HERE)),
    'referenceHash': EXPECTED_REFERENCE,
    'geometryAndUvSignature': signature,
    'exactStudyMeshPreserved': True,
    'meshTriangles': 2364,
    'meshVertices': 1252,
    'ports': ports,
    'notes': [
        'Preserves actual sheet geometry, including lowered, smaller forward pair for face clearance.',
        'Six identical units is a conceptual sheet label; rendered front units measure 0.40 x 0.38 versus 0.48 x 0.45 for the others. Visual geometry takes precedence.',
        'Root descriptive metadata is the only change from the preserved study source.',
        'Sector metadata describes visual axes only; no simulation behavior is authored.'
    ],
}
(HERE / 'validation/source_adoption.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
