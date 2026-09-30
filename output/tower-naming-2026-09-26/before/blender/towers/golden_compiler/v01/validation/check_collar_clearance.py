"""Verify vertical head/neckline clearance across every authored clip frame."""
import bpy, json
from pathlib import Path

folder=Path(__file__).resolve().parent
obj=bpy.data.objects['golden_compiler'];rig=bpy.data.objects['compiler_rig']
parts=json.loads(obj['part_ranges'])
indices=lambda names: [i for p in parts if p['name'] in names for i in range(p['start'],p['start']+p['count'])]
head=indices({'head'});collar=indices({'stand_collar','lapel','continuous_open_coat'})
result={}
for name in ('idle','work'):
    action=bpy.data.actions[name];rig.animation_data.action=action
    if action.slots:rig.animation_data.action_slot=action.slots[0]
    minimum=100
    for frame in range(int(action.frame_range[0]),int(action.frame_range[1])+1):
        bpy.context.scene.frame_set(frame)
        evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
        gap=min(mesh.vertices[i].co.z for i in head)-max(mesh.vertices[i].co.z for i in collar)
        minimum=min(minimum,gap);evaluated.to_mesh_clear()
    result[name]={'minimumVerticalClearanceMetres':minimum}
    assert minimum>.015,(name,minimum)
(folder/'collar_clearance.json').write_text(json.dumps(result,indent=2)+'\n')
print('COLLAR_CLEARANCE',json.dumps(result))
