"""Read-only convex-part clearance sampling of the authoritative Blender source."""
import bpy, json, sys, math
import numpy as np
from pathlib import Path
folder=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(folder/'problem_lag_spike_v01.blend'))
obj=bpy.data.objects['lag_spike'];rig=bpy.data.objects['lag_spike_rig']
parts=json.loads(obj['part_ranges'])
for p in parts:
    p['end']=p['start']+p['count']
    p['polygons']=[tuple(v-p['start'] for v in f.vertices) for f in obj.data.polygons if p['start']<=f.vertices[0]<p['end']]
def unique(v):
    v=np.asarray(v);mag=np.linalg.norm(v,axis=1);v=v[mag>1e-7]/mag[mag>1e-7,None]
    return np.unique(np.round(np.concatenate([v,-v]),5),axis=0)
def shape(v,p):
    edges=[];normals=[]
    for poly in p['polygons']:
        a,b,c=[v[j] for j in poly[:3]];normals.append(np.cross(b-a,c-a))
        for i,j in zip(poly,poly[1:]+poly[:1]):edges.append(v[j]-v[i])
    return unique(normals),unique(edges)
def penetration(a,b,pa,pb):
    overlap=np.minimum(a.max(0),b.max(0))-np.maximum(a.min(0),b.min(0))
    if min(overlap)<1e-5:return 0
    na,ea=shape(a,pa);nb,eb=shape(b,pb)
    axes=unique(np.concatenate([na,nb,np.cross(ea[:,None,:],eb[None,:,:]).reshape(-1,3)]))
    x=a@axes.T;y=b@axes.T
    overlaps=np.minimum(x.max(0),y.max(0))-np.maximum(x.min(0),y.min(0))
    return max(0,float(overlaps.min()))
spikes=[i for i,p in enumerate(parts) if p['bone'].startswith('glitch_')]
character=[i for i in range(len(parts)) if i not in spikes]
shells=[i for i,p in enumerate(parts) if p['name'] in ('upper_arm','forearm','hand')]
obstacles=[i for i,p in enumerate(parts) if p['name'] in ('torso','pelvis','cube_head','neck')]
pairs=[(a,b) for a in spikes for b in character]+[(a,b) for ix,a in enumerate(spikes) for b in spikes[ix+1:]]
pairs += [(a,b) for a in shells for b in obstacles]
pairs += [(a,b) for ix,a in enumerate(shells) for b in shells[ix+1:] if parts[a]['bone']!=parts[b]['bone']]
findings={};samples=0;minimum_spike_plane_gap=999;minimum_active_spike_gap=999
for clip in [None,'idle','move','hit','resolve']:
    rig.animation_data.action=None
    for track in rig.animation_data.nla_tracks:track.mute=track.name!=clip
    end={'idle':49,'move':33,'hit':13,'resolve':25}.get(clip,1)
    frames=np.linspace(1,end,(end-1)*4+1) if clip else [1]
    for frame in frames:
        bpy.context.scene.frame_set(int(frame),subframe=float(frame)%1)
        bpy.context.view_layer.update();ev=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
        allv=np.array([v.co[:] for v in mesh.vertices]);ev.to_mesh_clear()
        vv=[allv[p['start']:p['end']] for p in parts]
        gap=min(vv[i][:,1].min() for i in spikes)-max(vv[i][:,1].max() for i in character)
        minimum_spike_plane_gap=min(minimum_spike_plane_gap,float(gap))
        if clip!='resolve':minimum_active_spike_gap=min(minimum_active_spike_gap,float(gap))
        for a,b in pairs:
            depth=penetration(vv[a],vv[b],parts[a],parts[b])
            if depth>.0005:
                key=f"{parts[a]['bone']}:{parts[a]['name']} / {parts[b]['bone']}:{parts[b]['name']}"
                if depth>findings.get(key,{}).get('depth',0):findings[key]={'depth':depth,'clip':clip or 'rest','frame':float(frame)}
        samples+=1
report={'samples':samples,'subframesPerFrame':4,'minimumSpikeRearPlaneGap':minimum_spike_plane_gap,'minimumActiveSpikeRearPlaneGap':minimum_active_spike_gap,'unexpectedIntersections':findings,'scope':'All spike/character and spike/spike pairs; arm shells against torso, pelvis, head, neck and other arm shells. Axles intentionally seat inside neighboring shells; same-bone wrist/hand seating excluded. Convex SAT with 0.5 mm reporting tolerance.'}
(folder/'validation'/'clearance.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
