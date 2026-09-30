import bpy, json
from pathlib import Path
HERE = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE / 'copilot_security_v01.blend'))
ob = bpy.data.objects['security_model']
for name in ['projecting_swept_jaw', 'fitted_jaw_white_lip']:
    group = ob.vertex_groups[name].index
    vertices = [v for v in ob.data.vertices if any(g.group == group for g in v.groups)]
    print(name, json.dumps({'vertices': len(vertices), 'positions': [[v.index, *[round(c, 6) for c in v.co]] for v in vertices]}))
print('shape_keys', ob.data.shape_keys)
print('modifiers', [(m.name, m.type) for m in ob.modifiers])
print('groups', [g.name for g in ob.vertex_groups])
