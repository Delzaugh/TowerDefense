"""Read-only source diagnosis of the shield and its supporting chin surfaces."""
import bpy,json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'copilot_security_v01.blend'))
ob=bpy.data.objects['security_model'];me=ob.data
trees={}
for name in ['security_shield','central_chin_armor','projecting_swept_jaw']:
 group=ob.vertex_groups[name].index
 ids={v.index for v in me.vertices if any(g.group==group for g in v.groups)}
 polys=[p for p in me.polygons if all(v in ids for v in p.vertices)]
 trees[name]=BVHTree.FromPolygons([v.co.copy() for v in me.vertices],[list(p.vertices) for p in polys])
 print(name, 'bounds', [[round(fn(me.vertices[i].co[a] for i in ids),5) for a in range(3)] for fn in [min,max]])
for z in [.1,.25,.40,.43,.45,.47,.49,.51,.53]:
 for x in [0,.08,.12]:
  hits={}
  for name,tree in trees.items():
   hit,*_=tree.ray_cast(Vector((x,-3,z)),Vector((0,1,0)))
   if hit:hits[name]=round(hit.y,5)
  print(x,z,hits)
