"""Measure geometry and port azimuths in the isolated Blender study."""
import json
import math
from pathlib import Path
import bpy

HERE=Path(__file__).resolve().parent
obj=bpy.data.objects['linter_agent_model']
mesh=obj.data
mesh.calc_loop_triangles()
ports=[]
for i in range(6):
    group=obj.vertex_groups[f'lime_rule_socket_{i}']
    points=[v.co for v in mesh.vertices if any(g.group==group.index for g in v.groups)]
    x=sum(p.x for p in points)/len(points)
    y=sum(p.y for p in points)/len(points)
    z=sum(p.z for p in points)/len(points)
    az=(math.degrees(math.atan2(x,-y))+360)%360
    ports.append({'id':f'S{i+1}','azimuth_degrees':round(az,6),'vertex_count':len(points),'center':[round(x,6),round(y,6),round(z,6)]})
angles=sorted(p['azimuth_degrees'] for p in ports)
pitches=[round((angles[(i+1)%6]-angles[i])%360,6) for i in range(6)]
assert len(ports)==6 and all(abs(p-60)<1e-4 for p in pitches)
assert len([g for g in obj.vertex_groups if g.name.startswith('lime_rule_socket_')])==6
assert mesh.uv_layers.active is not None
images=[{'name':im.name,'width':im.size[0],'height':im.size[1]} for im in bpy.data.images if 'palette' in im.name]
report={
    'kind':'isolated conceptual Blender study; not the current runtime GLB',
    'mesh_vertices':len(mesh.vertices),
    'mesh_triangles':len(mesh.loop_triangles),
    'material_slots':len(mesh.materials),
    'images':images,
    'uv_layers':[u.name for u in mesh.uv_layers],
    'ports':ports,
    'azimuths_clockwise_from_front':angles,
    'adjacent_pitches_degrees':pitches,
    'sector_width_degrees':60,
    'total_nominal_horizontal_sector_degrees':sum(pitches),
}
(HERE/'concept-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
