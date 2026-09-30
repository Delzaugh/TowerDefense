"""Read-only diagnosis of the delivered Blender source; never saves the scene."""
import bpy,json
from pathlib import Path
folder=Path(__file__).resolve().parent.parent
bpy.ops.wm.open_mainfile(filepath=str(folder/'copilot_developer_v01.blend'))
obj=bpy.data.objects['developer_model'];mesh=obj.data;mesh.calc_loop_triangles()
names={g.index:g.name for g in obj.vertex_groups};totals={}
def category(name):
    if 'rounded_casing' in name:return 'core_and_display'
    if 'integrated_helmet' in name:return 'orange_shell_and_fins'
    if any(s in name for s in ['goggle','lens','bridge']):return 'goggles_and_lenses'
    if any(s in name for s in ['temple','housing','badge','brace']):return 'temples_and_symbols'
    if 'vent' in name:return 'rear_panel_and_vents'
    return 'chin_eyes_radiators'
for tri in mesh.loop_triangles:
    groups=[g.group for g in mesh.vertices[tri.vertices[0]].groups]
    key=category(names[groups[0]]) if groups else 'ungrouped'
    totals[key]=totals.get(key,0)+1
report={'triangles':len(mesh.loop_triangles),'allocation':totals,'method':'Source loop triangles grouped by named component vertex groups; no source changes.'}
(folder/'validation'/'shape_allocation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
