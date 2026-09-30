"""Read-only saved-source checks; write an evidence JSON, never save the blend."""
from pathlib import Path
import hashlib,json,bpy
here=Path(__file__).resolve().parent
m=json.loads((here.parent/'asset.json').read_text(encoding='utf-8-sig'))
source=here.parent/'copilot_developer_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
rig=bpy.data.objects['developer_rig'];mesh=bpy.data.objects['developer_model']
assert rig.animation_data.action is None
assert len(rig.data.bones)==3
assert set(t.name for t in rig.animation_data.nla_tracks)==set(c['name'] for c in m['clips'])
assert all(t.mute and len(t.strips)==1 and t.strips[0].action.name==t.name for t in rig.animation_data.nla_tracks)
for bone in rig.pose.bones:
    assert bone.location.length<1e-7
    assert abs(bone.rotation_quaternion.angle)<1e-7
    assert all(abs(x-1)<1e-7 for x in bone.scale)
assert len([o for o in bpy.data.objects if o.type=='ARMATURE'])==1
assert all(i.packed_file for i in bpy.data.images if i.type=='IMAGE')
assert bpy.context.scene.render.fps==24
result={'passed':True,'revision':m['revision'],'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),
        'bones':list(rig.pose.bones.keys()),'clips':[t.name for t in rig.animation_data.nla_tracks],
        'checks':'No active action; muted named NLA tracks; one compact rig; rest transforms; packed images; 24 fps.'}
(here/'animation/source_audit.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
