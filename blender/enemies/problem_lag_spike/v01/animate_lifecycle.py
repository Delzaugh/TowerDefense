"""Full-size Lag Spike arrival/exit poses; the shared presenter owns visibility."""
import bpy
import math


def author(manifest):
    rig = bpy.data.objects['lag_spike_rig']
    root = bpy.data.objects['root']
    rig.animation_data_create()
    rig.animation_data.action = None
    for track in list(rig.animation_data.nla_tracks):
        if track.name in ('spawn', 'resolve'):
            actions = [strip.action for strip in track.strips]
            rig.animation_data.nla_tracks.remove(track)
            for action in actions:
                action.use_fake_user = False
                if action.users == 0:
                    bpy.data.actions.remove(action)

    def reset():
        for bone in rig.pose.bones:
            bone.rotation_mode = 'XYZ'
            bone.location = (0, 0, 0)
            bone.rotation_euler = (0, 0, 0)
            bone.scale = (1, 1, 1)

    for name in ('spawn', 'resolve'):
        action = bpy.data.actions.new(name)
        rig.animation_data.action = action
        for frame in range(31):
            reset()
            t = frame / 30
            pulse = math.sin(math.pi * t)
            head = rig.pose.bones['head']
            if name == 'spawn':
                # A short registration error settles forward without lateral head lag.
                envelope = math.sin(math.pi * min(1, t / .6)) ** 2 if t < .6 else 0
                rig.pose.bones['body'].location.x = .028 * math.sin(t * math.tau * 3) * envelope
                head.location.y = .055 * envelope
                head.location.z = .020 * envelope
                head.rotation_euler.x = -.035 * pulse
            else:
                head.location.y = .028 * pulse
                head.rotation_euler.x = .045 * pulse
                for i in range(12):
                    echo = rig.pose.bones['glitch_' + str(i)]
                    echo.location.z = -.018 * pulse * (1 if i % 3 else .55)
            for bone in rig.pose.bones:
                for prop in ('location', 'rotation_euler', 'scale'):
                    bone.keyframe_insert(data_path=prop, frame=frame, group=bone.name)
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:
                            key.interpolation = 'LINEAR'
        action.use_fake_user = True
        track = rig.animation_data.nla_tracks.new()
        track.name = name
        track.strips.new(name, 0, action)
        track.mute = True

    rig.animation_data.action = None
    for track in rig.animation_data.nla_tracks:
        track.mute = True
    reset()
    bpy.context.scene.frame_set(1)
    root['lifecycle_effect'] = manifest['presentation']['lifecycle']
    bpy.context.view_layer.update()


if __name__ == '__main__':
    import json
    from pathlib import Path
    folder = Path(__file__).resolve().parent
    manifest = json.loads((folder / 'asset.json').read_text(encoding='utf-8-sig'))
    source = folder / 'problem_lag_spike_v01.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source))
    author(manifest)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(source))
