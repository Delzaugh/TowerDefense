"""Read the authoritative rig and animation before a focused motion pass."""
import bpy, json, hashlib
from pathlib import Path
base=Path(__file__).parent
source=base/'bert_breugelmans_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
rig=bpy.data.objects['bert_rig']
def curves(a):
    return [f for l in a.layers for s in l.strips for c in s.channelbags for f in c.fcurves]
result={
    'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),
    'bones':[{'name':b.name,'parent':b.parent.name if b.parent else None,'head':list(b.head_local),'rotation':list(b.matrix_local.to_quaternion())} for b in rig.data.bones],
    'actions':[{'name':a.name,'range':list(a.frame_range),'curves':len(curves(a))} for a in bpy.data.actions],
    'tracks':[{'name':t.name,'mute':t.mute,'strips':[{'action':s.action.name,'start':s.frame_start,'end':s.frame_end} for s in t.strips]} for t in rig.animation_data.nla_tracks],
    'objects':[{'name':o.name,'type':o.type,'parent':o.parent.name if o.parent else None} for o in bpy.context.scene.objects],
    'images':[{'name':i.name,'packed':bool(i.packed_file),'size':list(i.size)} for i in bpy.data.images],
}
(base/'validation/animation-source-baseline.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
