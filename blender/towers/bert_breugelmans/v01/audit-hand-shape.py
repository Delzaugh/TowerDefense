"""Closed connected hand surfaces, face quality and self-intersections."""
import bpy,bmesh,json,hashlib
from pathlib import Path
from mathutils.bvhtree import BVHTree
base=Path(__file__).parent;bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
obj=bpy.data.objects['bert_skin'];rig=bpy.data.objects['bert_rig'];results=[]
for side in ('l','r'):
    groups={g.index for g in obj.vertex_groups if g.name.endswith('_'+side) and g.name.startswith(('hand_','fingers_','digits_','thumb_'))}
    ids={v.index for v in obj.data.vertices if any(w.group in groups and w.weight>0 for w in v.groups)}
    faces=[tuple(p.vertices) for p in obj.data.polygons if all(i in ids for i in p.vertices)]
    adjacency={i:set() for i in ids};edges={}
    for face in faces:
        for a,b in zip(face,face[1:]+face[:1]):
            adjacency[a].add(b);adjacency[b].add(a);key=tuple(sorted((a,b)));edges[key]=edges.get(key,0)+1
    components=0;remaining=set(ids)
    while remaining:
        stack=[remaining.pop()];components+=1
        while stack:
            for i in adjacency[stack.pop()]&remaining:remaining.remove(i);stack.append(i)
    tree=BVHTree.FromPolygons([v.co for v in obj.data.vertices],faces)
    intersections=[(a,b) for a,b in tree.overlap(tree) if a<b and not set(faces[a])&set(faces[b])]
    area_min=min(p.area for p in obj.data.polygons if all(i in ids for i in p.vertices))
    results.append({'side':side,'vertices':len(ids),'polygons':len(faces),'components':components,'nonmanifoldEdges':sum(n!=2 for n in edges.values()),'minimumFaceArea':area_min,'nonAdjacentSelfIntersections':intersections})
animated=[]
for clip in ('idle','work','move','celebrate_team'):
    action=bpy.data.actions[clip];rig.animation_data.action=action;start,end=map(int,action.frame_range);hits=[]
    for frame in range(start,end+1):
        bpy.context.scene.frame_set(frame);dg=bpy.context.evaluated_depsgraph_get();evaluated=obj.evaluated_get(dg);mesh=evaluated.to_mesh()
        for side in ('l','r'):
            groups={g.index for g in obj.vertex_groups if g.name.endswith('_'+side) and g.name.startswith(('hand_','fingers_','digits_','thumb_'))}
            ids={v.index for v in obj.data.vertices if any(w.group in groups and w.weight>0 for w in v.groups)}
            faces=[tuple(p.vertices) for p in obj.data.polygons if all(i in ids for i in p.vertices)]
            tree=BVHTree.FromPolygons([v.co for v in mesh.vertices],faces)
            overlaps=[(a,b) for a,b in tree.overlap(tree) if a<b and not set(faces[a])&set(faces[b])]
            if overlaps:hits.append({'frame':frame,'side':side,'facePairs':overlaps})
        evaluated.to_mesh_clear()
    animated.append({'clip':clip,'frames':end-start+1,'selfIntersections':hits})
report={'sourceHash':hashlib.sha256((base/'bert_breugelmans_v01.blend').read_bytes()).hexdigest(),'hands':results,'animated':animated,
    'passed':all(r['components']==1 and r['nonmanifoldEdges']==0 and r['minimumFaceArea']>1e-9 and not r['nonAdjacentSelfIntersections'] for r in results) and all(not r['selfIntersections'] for r in animated)}
(base/'validation/hand-shape-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));assert report['passed'],report
