"""Blueprint entry/completion poses. Checklist weights remain independent."""
import bpy, math


def author(manifest):
    motion=bpy.data.objects['task_motion'];root=bpy.data.objects['root']
    motion.animation_data_create();motion.animation_data.action=None
    for track in list(motion.animation_data.nla_tracks):
        if track.name in ('spawn','resolve'):
            actions=[strip.action for strip in track.strips]
            motion.animation_data.nla_tracks.remove(track)
            for action in actions:
                action.use_fake_user=False
                if action.users==0:bpy.data.actions.remove(action)
    for name in ('spawn','resolve'):
        action=bpy.data.actions.new(name);motion.animation_data.action=action
        for frame in range(37):
            t=frame/36
            motion.location=(0,0,.18+(.015 if name=='spawn' else .025)*math.sin(math.pi*t))
            motion.rotation_euler=(0,.025*math.sin(math.pi*t)*(1-t),0)
            motion.scale=(1,1,1)
            for prop in ('location','rotation_euler','scale'):motion.keyframe_insert(data_path=prop,frame=frame)
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:key.interpolation='LINEAR'
        action.use_fake_user=True;track=motion.animation_data.nla_tracks.new();track.name=name
        track.strips.new(name,0,action);track.mute=True
    motion.animation_data.action=None
    for track in motion.animation_data.nla_tracks:track.mute=True
    bpy.context.scene.frame_set(0)
    motion.location=(0,0,0);motion.rotation_euler=(0,0,0);motion.scale=(1,1,1)
    root['lifecycle_effect']=manifest['presentation']['lifecycle']
    bpy.context.view_layer.update()


if __name__=='__main__':
    import json
    from pathlib import Path
    folder=Path(__file__).resolve().parent
    manifest=json.loads((folder/'asset.json').read_text(encoding='utf-8-sig'))
    source=folder/'work_coding_task_v01.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source));author(manifest)
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(source))
