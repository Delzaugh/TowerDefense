"""Read-only triangle intersection check for the six woven solids."""
import bpy,json,hashlib
from pathlib import Path
from mathutils.bvhtree import BVHTree
from mathutils import Vector
p=Path(__file__).resolve().parents[1]
source=p/'problem_spaghetti_code_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
obj=bpy.data.objects['spaghetti_code'];mesh=obj.data
parts=json.loads(obj['part_ranges']);trees=[]
for part in parts:
    lo=part['start'];hi=lo+part['count']
    vs=[v.co.copy() for v in mesh.vertices[lo:hi]]
    fs=[tuple(i-lo for i in f.vertices) for f in mesh.polygons if all(lo<=i<hi for i in f.vertices)]
    trees.append(BVHTree.FromPolygons(vs,fs,all_triangles=False,epsilon=0.0))
collisions=[]
for i in range(6):
    for j in range(i+1,6):
        overlaps=trees[i].overlap(trees[j])
        if overlaps:collisions.append({'strands':[i,j],'trianglePairs':len(overlaps)})
badge_collisions=[]
for i in range(6,9):
    for j in range(6):
        overlaps=trees[i].overlap(trees[j])
        if overlaps:badge_collisions.append({'part':parts[i]['name'],'strand':j,'trianglePairs':len(overlaps)})
mount_contacts=[i for i in range(6) if trees[9].overlap(trees[i])]
normal=Vector((0,-.954,.30)).normalized()
weave_support=max(v.co.dot(normal) for v in mesh.vertices[:parts[6]['start']])
back_support=min(v.co.dot(normal) for v in mesh.vertices[parts[6]['start']:parts[6]['start']+parts[6]['count']])
result={'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),'strandSurfaceIntersections':collisions,'badgeWeaveIntersections':badge_collisions,'badgePlaneGap':back_support-weave_support,'mountStrandContacts':mount_contacts}
(p/'validation/strand_clearance.json').write_text(json.dumps(result,indent=2))
print('STRAND_CLEARANCE',json.dumps(result))
