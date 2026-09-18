"""Verify seated contacts and transition continuity in the authoritative source."""
import bpy, json, hashlib
from pathlib import Path

obj=bpy.data.objects['missing_details']; rig=bpy.data.objects['missing_details_rig']
parts=json.loads(obj['part_ranges']); scene=bpy.context.scene
def pose(clip,frame):
    for track in rig.animation_data.nla_tracks: track.mute=True
    rig.animation_data.action=bpy.data.actions.get(clip) if clip else None
    if clip: rig.animation_data.action_slot=rig.animation_data.action.slots[0]
    else:
        for bone in rig.pose.bones:
            bone.location=(0,0,0); bone.rotation_euler=(0,0,0); bone.scale=(1,1,1)
    scene.frame_set(frame); bpy.context.view_layer.update()
    evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=evaluated.to_mesh(); vertices=[v.co.copy() for v in mesh.vertices]
    evaluated.to_mesh_clear()
    return vertices
def part_min(vertices,name):
    return [min(vertices[i].z for i in range(p['start'],p['start']+p['count']))
            for p in parts if p['name']==name]

rest=pose(None,1); start=pose('sit_down',1); end=pose('sit_down',49)
hold=pose('seated',1); hold_end=pose('seated',25)
rows=[]
for frame in range(1,50):
    vertices=pose('sit_down',frame)
    rows.append({'frame':frame,'minimumZ':min(v.z for v in vertices),
                 'soleZ':part_min(vertices,'foot')})
delta=lambda a,b:max((x-y).length for x,y in zip(a,b))
contacts=[v for v in end if abs(v.z)<.00001]
result={
 'sourceHash':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),
 'restToStartDelta':delta(rest,start),'sitToSeatedDelta':delta(end,hold),
 'seatedLoopDelta':delta(hold,hold_end),
 'minimumTransitionZ':min(r['minimumZ'] for r in rows),
 'maximumSoleGroundError':max(abs(z) for r in rows for z in r['soleZ']),
 'seatedThighUndersides':part_min(end,'thigh'),
 'seatedSoles':part_min(end,'foot'),
 'contactBoundsBlenderXY':[[min(v[k] for v in contacts),max(v[k] for v in contacts)] for k in (0,1)],
 'seatedDimensions':[max(v[k] for v in end)-min(v[k] for v in end) for k in range(3)],
 'scope':'Pose/contact checks only. The animated game mesh is not certified watertight or support-free; printer scale and slicer review remain necessary.',
 'samples':rows,
}
print('SEATED_CONTACTS',json.dumps({k:v for k,v in result.items() if k!='samples'}))
assert result['restToStartDelta']<1e-5
assert result['sitToSeatedDelta']<1e-5
assert result['seatedLoopDelta']<1e-5
assert result['minimumTransitionZ']>-.002
assert result['maximumSoleGroundError']<.002
assert all(abs(z)<.0001 for z in result['seatedThighUndersides'])
Path(__file__).with_name('seated-contact-report.json').write_text(json.dumps(result,indent=2))
print('SEATED_CONTACTS',json.dumps({k:v for k,v in result.items() if k!='samples'}))
