"""Read-only evaluated heel/flat/toe support and swing clearance audit."""
import bpy,json,math,hashlib
from pathlib import Path
base=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
m=json.loads((base/'asset.json').read_text(encoding='utf-8-sig'))
rig=bpy.data.objects['bert_rig'];obj=bpy.data.objects['bert_clothing']
rig.animation_data.action=bpy.data.actions['move'];feet={}
for side in ('l','r'):
    g=obj.vertex_groups['foot_'+side].index
    feet[side]=[v.index for v in obj.data.vertices if any(w.group==g and w.weight>.99 for w in v.groups) and abs(v.co.z)<1e-5]
    assert feet[side],side
min_ground=100;max_support_error=0;max_stance_path_error=0;max_lift=0
previous={};max_joint_step=0;contact_counts={'heel':0,'flat':0,'toe':0}
for sample in range(145):
    frame=sample/4
    bpy.context.scene.frame_set(int(frame),subframe=frame%1);dg=bpy.context.evaluated_depsgraph_get();eo=obj.evaluated_get(dg);em=eo.to_mesh()
    for side in ('l','r'):
        phase=(frame/36+(0 if side=='l' else .5))%1
        ps=[eo.matrix_world@em.vertices[i].co for i in feet[side]]
        z=min(p.z for p in ps);min_ground=min(min_ground,z);max_lift=max(max_lift,z)
        if phase<=22/36:
            # Only the contact end grounds when the foot rolls. The entire
            # sole must ground during flat stance; no penetration anywhere.
            pairs=list(zip(ps,feet[side]))
            if phase<4/36:
                end=max(obj.data.vertices[i].co.y for i in feet[side]);kind='heel'
                pairs=[(p,i) for p,i in pairs if abs(obj.data.vertices[i].co.y-end)<1e-6]
            elif phase>15/36:
                end=min(obj.data.vertices[i].co.y for i in feet[side]);kind='toe'
                pairs=[(p,i) for p,i in pairs if abs(obj.data.vertices[i].co.y-end)<1e-6]
            else:kind='flat'
            contact_counts[kind]+=1
            max_support_error=max(max_support_error,max(abs(p.z) for p,i in pairs))
            expected=-.19+.38*phase/(22/36)
            max_stance_path_error=max(max_stance_path_error,max(abs((p.y-obj.data.vertices[i].co.y)-expected) for p,i in pairs))
    eo.to_mesh_clear()
    for p in rig.pose.bones:
        q=p.rotation_quaternion.copy()
        if p.name in previous:max_joint_step=max(max_joint_step,math.degrees(q.rotation_difference(previous[p.name]).angle))
        previous[p.name]=q
report={'revision':m['revision'],'sourceHash':hashlib.sha256((base/'bert_breugelmans_v01.blend').read_bytes()).hexdigest(),'samples':145,'durationSeconds':1.5,'stanceMatchingMetresPerSecond':.38/(22/36)/1.5,'minimumSoleHeight':min_ground,'maximumSupportPlaneError':max_support_error,'maximumStanceContactPathError':max_stance_path_error,'peakSoleClearance':max_lift,'contactSamples':contact_counts,'maxQuarterFrameRotationDegrees':max_joint_step,'passed':min_ground>-.001 and max_support_error<.001 and max_stance_path_error<.001 and max_lift>.04 and max_joint_step<10}
(base/'validation/walk-contact.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));assert report['passed'],report
