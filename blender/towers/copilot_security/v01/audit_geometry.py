import bpy,json,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
source=HERE/'copilot_security_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
report={'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),'meshes':[]}
for ob in bpy.context.scene.objects:
 if ob.type!='MESH':continue
 me=ob.data;me.calc_loop_triangles();used=set();bad=[]
 for i,t in enumerate(me.loop_triangles):
  a,b,c=[me.vertices[v].co for v in t.vertices];used.update(t.vertices)
  if (b-a).cross(c-a).length<1e-10:bad.append(i)
 report['meshes'].append({'name':ob.name,'triangles':len(me.loop_triangles),'degenerateTriangles':bad,'looseVertices':len(me.vertices)-len(used),'namedPartGroups':len(ob.vertex_groups)})
report['passed']=all(not r['degenerateTriangles'] and not r['looseVertices'] for r in report['meshes'])
(HERE/'validation/source_geometry_audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
if not report['passed']:raise RuntimeError('Degenerate or loose geometry found')
