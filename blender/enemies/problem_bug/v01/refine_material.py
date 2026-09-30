"""Inspect, or remove Bug's uniform self-emission without changing its palette."""
import bpy, json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
manifest = json.loads((HERE/'asset.json').read_text())
source = HERE/'problem_bug_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
material = bpy.data.materials['bug_palette']
bsdf = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
report = {
    'material': material.name,
    'roughness': bsdf.inputs['Roughness'].default_value,
    'metallic': bsdf.inputs['Metallic'].default_value,
    'emissionColor': list(bsdf.inputs['Emission Color'].default_value),
    'emissionStrength': bsdf.inputs['Emission Strength'].default_value,
    'emissionLinks': [l.from_node.name for l in bsdf.inputs['Emission Color'].links],
    'images': [{'name': i.name, 'size': list(i.size), 'packed': bool(i.packed_file)} for i in bpy.data.images],
    'actions': [a.name for a in bpy.data.actions]
}
print('MATERIAL_INSPECTION', json.dumps(report))
if '--apply' in sys.argv:
    assert not bsdf.inputs['Emission Color'].links
    assert abs(report['emissionStrength']-.08) < 1e-6
    bsdf.inputs['Emission Strength'].default_value = 0
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(source))
    report['refinedEmissionStrength'] = 0
    (HERE/'validation/material_source.json').write_text(json.dumps(report, indent=2)+'\n')
