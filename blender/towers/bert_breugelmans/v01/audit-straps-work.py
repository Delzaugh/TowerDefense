"""Inspect actual deformed sleeves against both straps across every clip."""
import bpy,json,hashlib,math
from pathlib import Path
from mathutils.bvhtree import BVHTree
from mathutils import Vector
base=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
rig=bpy.data.objects['bert_rig'];pack=bpy.data.objects['cohesion_pack'];cloth=bpy.data.objects['bert_clothing']
teal=int(pack['palette_roles']['roles']['teal']);attr=pack.data.attributes[pack['palette_roles']['attribute']]
straps=[tuple(p.vertices) for p in pack.data.polygons if round(attr.data[p.loop_start].value)==teal]
arm_groups={g.index for g in cloth.vertex_groups if g.name.startswith(('upper_','fore_','hand_'))}
arm_ids={v.index for v in cloth.data.vertices if any(g.group in arm_groups and g.weight>0 for g in v.groups)}
arms=[tuple(p.vertices) for p in cloth.data.polygons if all(i in arm_ids for i in p.vertices)]
soles=[v.index for v in cloth.data.vertices if abs(v.co.z)<1e-6]
results=[]
for clip in ('idle','move','work','celebrate_team'):
    action=bpy.data.actions[clip];rig.animation_data.action=action;hits=[];regions={};max_jump=0;previous={};sole_drift=0;min_elbow=100
    start,end=map(int,action.frame_range)
    for sample in range(start*2,end*2+1):
        f=sample/2;bpy.context.scene.frame_set(int(f),subframe=f%1);bpy.context.view_layer.update()
        dg=bpy.context.evaluated_depsgraph_get();pe=pack.evaluated_get(dg);pm=pe.to_mesh();ce=cloth.evaluated_get(dg);cm=ce.to_mesh()
        pb=BVHTree.FromPolygons([v.co for v in pm.vertices],straps)
        cb=BVHTree.FromPolygons([v.co for v in cm.vertices],arms)
        overlap=pb.overlap(cb)
        if overlap:
            hits.append({'frame':f,'facePairs':len(overlap)})
            for i,j in overlap:regions[i]=regions.get(i,0)+1
        if clip=='work':
            sole_drift=max(sole_drift,max((cm.vertices[i].co-cloth.data.vertices[i].co).length for i in soles))
        pe.to_mesh_clear();ce.to_mesh_clear()
        for p in rig.pose.bones:
            q=p.rotation_quaternion.copy()
            if p.name in previous:max_jump=max(max_jump,math.degrees(q.rotation_difference(previous[p.name]).angle))
            previous[p.name]=q
        for side in ('l','r'):
            min_elbow=min(min_elbow,rig.pose.bones['upper_'+side].head.z-rig.pose.bones['fore_'+side].head.z)
    zones=[]
    for i,count in sorted(regions.items(),key=lambda v:-v[1])[:12]:
        center=sum((pack.data.vertices[j].co for j in straps[i]),Vector())/len(straps[i])
        zones.append({'face':i,'restCenter':list(center),'count':count})
    results.append({'clip':clip,'samples':(end-start)*2+1,'intersectingSamples':len(hits),
        'maxFacePairs':max((h['facePairs'] for h in hits),default=0),'firstHits':hits[:12],'zones':zones,
        'maxHalfFrameRotationDegrees':max_jump,'workSoleDrift':sole_drift,'minimumElbowBelowShoulder':min_elbow})
source_hash=hashlib.sha256((base/'bert_breugelmans_v01.blend').read_bytes()).hexdigest()
report={'sourceHash':source_hash,'clips':results,'passed':all(x['intersectingSamples']==0 and x['maxHalfFrameRotationDegrees']<20 for x in results)}
(base/'validation/straps-work-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report));assert report['passed'],report
