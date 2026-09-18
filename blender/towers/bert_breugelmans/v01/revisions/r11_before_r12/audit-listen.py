"""Read-only canonical-source audit of listen elbow path and frame continuity."""
import bpy,json,math
from pathlib import Path
base=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
rig=bpy.data.objects['bert_rig'];rig.animation_data.action=bpy.data.actions['listen']
for track in rig.animation_data.nla_tracks:track.mute=True
prev=None;maximum_step=0;max_elbow_above_shoulder=-10;points=[]
for f in range(1,86):
    bpy.context.scene.frame_set(f);bpy.context.view_layer.update()
    poses={n:rig.pose.bones[n].matrix.to_quaternion() for n in ['upper_r','fore_r','hand_r']}
    if prev:
        for n,q in poses.items():maximum_step=max(maximum_step,q.rotation_difference(prev[n]).angle)
    prev=poses
    shoulder=rig.matrix_world@rig.pose.bones['upper_r'].head;elbow=rig.matrix_world@rig.pose.bones['fore_r'].head
    max_elbow_above_shoulder=max(max_elbow_above_shoulder,elbow.z-shoulder.z)
    if f in (1,13,22,43,64,76,85):points.append({'frame':f,'shoulder':list(shoulder),'elbow':list(elbow)})
report={'passed':max_elbow_above_shoulder<0 and maximum_step<.25,'maximumElbowAboveShoulder':max_elbow_above_shoulder,'maximumFrameRotationRadians':maximum_step,'samples':points}
(base/'validation/listen-motion.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));assert report['passed'],report
