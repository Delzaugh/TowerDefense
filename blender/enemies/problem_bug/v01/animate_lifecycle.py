"""Full-size lifecycle poses; the shared presenter owns breach/erase coverage."""
import bpy, math


def author(manifest):
    rig=bpy.data.objects['bug_rig']; root=bpy.data.objects['root']
    rig.animation_data_create(); rig.animation_data.action=None
    for track in list(rig.animation_data.nla_tracks):
        if track.name in ('spawn','resolve'):
            actions=[strip.action for strip in track.strips]
            rig.animation_data.nla_tracks.remove(track)
            for action in actions:
                action.use_fake_user=False
                if action.users==0: bpy.data.actions.remove(action)
    for name in ('spawn','resolve'):
        action=bpy.data.actions.new(name); rig.animation_data.action=action
        for frame in range(31):
            t=frame/30
            for bone in rig.pose.bones:
                bone.rotation_mode='XYZ'; bone.location=(0,0,0)
                bone.rotation_euler=(0,0,0); bone.scale=(1,1,1)
            head=rig.pose.bones['head']
            head.rotation_euler.x=(.07 if name=='spawn' else -.065)*math.sin(math.pi*t)
            for side in ('l','r'):
                rig.pose.bones['antenna_'+side].rotation_euler.x=.09*math.sin(math.pi*t)*(1 if side=='l' else -.7)
            if name=='spawn':
                # Brief lateral registration slip during the body glitch reveal.
                envelope=math.sin(math.pi*min(1,t/.55))**2 if t<.55 else 0
                rig.pose.bones['body'].location.x=.032*math.sin(t*math.tau*3)*envelope
            for bone in rig.pose.bones:
                for prop in ('location','rotation_euler','scale'):
                    bone.keyframe_insert(data_path=prop,frame=frame,group=bone.name)
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:key.interpolation='LINEAR'
        action.use_fake_user=True
        track=rig.animation_data.nla_tracks.new();track.name=name
        track.strips.new(name,0,action);track.mute=True
    rig.animation_data.action=None
    for track in rig.animation_data.nla_tracks:track.mute=True
    bpy.context.scene.frame_set(1)
    for bone in rig.pose.bones:
        bone.location=(0,0,0);bone.rotation_euler=(0,0,0);bone.scale=(1,1,1)
    root['lifecycle_effect']=manifest['presentation']['lifecycle']
    bpy.context.view_layer.update()


if __name__=='__main__':
    import json
    from pathlib import Path
    folder=Path(__file__).resolve().parent
    manifest=json.loads((folder/'asset.json').read_text(encoding='utf-8-sig'))
    source=folder/'problem_bug_v01.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source));author(manifest)
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(source))
