"""Closed chest topology and sampled coverage beneath the entire collar rim."""
import bpy,json,hashlib,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
base=Path(__file__).parent;bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
skin=bpy.data.objects['bert_skin'];rig=bpy.data.objects['bert_rig'];shift=rig.data.bones['body'].head_local.z-1.35
adjacency={v.index:set() for v in skin.data.vertices}
for e in skin.data.edges:
    a,b=e.vertices;adjacency[a].add(b);adjacency[b].add(a)
remaining=set(adjacency);candidates=[]
while remaining:
    component={remaining.pop()};pending=list(component)
    while pending:
        for i in adjacency[pending.pop()]&remaining:remaining.remove(i);component.add(i);pending.append(i)
    if len(component)==29 and all(abs(skin.data.vertices[i].co.x)<.21 and abs(skin.data.vertices[i].co.y)<.18 and 1.88+shift<skin.data.vertices[i].co.z<2.321+shift for i in component):candidates.append(component)
assert len(candidates)==1
ids=candidates[0]
faces=[tuple(p.vertices) for p in skin.data.polygons if all(i in ids for i in p.vertices)]
edges={}
for f in faces:
    for a,b in zip(f,f[1:]+f[:1]):key=tuple(sorted((a,b)));edges[key]=edges.get(key,0)+1
assert len(ids)==29,len(ids)
rim=[Vector((.19*math.cos(math.tau*i/12),.16*math.sin(math.tau*i/12),2.145-.18*max(0,-math.sin(math.tau*i/12))**6+shift)) for i in range(12)]
probes=[a.lerp(b,k/4) for a,b in zip(rim,rim[1:]+rim[:1]) for k in range(4)]
rest=rig.data.bones['body'].matrix_local;results=[]
for clip in ('idle','work','move','celebrate_team'):
    action=bpy.data.actions[clip];rig.animation_data.action=action;failed=[];lowest=0;self_hits=[]
    for frame in range(int(action.frame_range[0]),int(action.frame_range[1])+1):
        bpy.context.scene.frame_set(frame);dg=bpy.context.evaluated_depsgraph_get();obj=skin.evaluated_get(dg);mesh=obj.to_mesh()
        tree=BVHTree.FromPolygons([v.co for v in mesh.vertices],faces)
        hits=[(a,b) for a,b in tree.overlap(tree) if a<b and not set(faces[a])&set(faces[b])]
        if hits:self_hits.append({'frame':frame,'pairs':hits})
        transform=rig.pose.bones['body'].matrix@rest.inverted();inverse=transform.inverted();direction=transform.to_3x3()@Vector((0,0,-1))
        for i,p in enumerate(probes):
            hit,normal,face_index,distance=tree.ray_cast(transform@(p+Vector((0,0,.4))),direction,1)
            if hit is None:failed.append({'frame':frame,'probe':i,'reason':'open'})
            else:
                delta=(inverse@hit).z-p.z;lowest=min(lowest,delta)
                if delta<-.035 or normal.dot(direction)>-.05:failed.append({'frame':frame,'probe':i,'reason':'no upper chest coverage','delta':delta,'normalDot':normal.dot(direction),'face':face_index})
        obj.to_mesh_clear()
    results.append({'clip':clip,'frames':int(action.frame_range[1]-action.frame_range[0])+1,'raysPerFrame':len(probes),'lowestSurfaceBelowRim':lowest,'coverageFailures':failed,'selfIntersections':self_hits})
report={'revision':json.loads((base/'asset.json').read_text())['revision'],'sourceHash':hashlib.sha256((base/'bert_breugelmans_v01.blend').read_bytes()).hexdigest(),'neckVertices':len(ids),'nonmanifoldEdges':sum(v!=2 for v in edges.values()),'clips':results}
report['passed']=report['nonmanifoldEdges']==0 and all(not r['coverageFailures'] and not r['selfIntersections'] for r in results)
(base/'validation/neck-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({**report,'clips':[{**r,'coverageFailures':r['coverageFailures'][:5],'failureCount':len(r['coverageFailures'])} for r in results]}));assert report['passed']
