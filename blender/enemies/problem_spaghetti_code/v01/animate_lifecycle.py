"""Full-size Spaghetti Code arrival/exit poses; the shared presenter owns visibility."""
import bpy
import math


def author(manifest):
    rig = bpy.data.objects['spaghetti_rig']
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

    bone = rig.pose.bones['knot']
    bone.rotation_mode = 'XYZ'

    def reset():
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
            if name == 'spawn':
                # Small rigid jitter reads as a registration error without
                # changing the accepted strand clearances or badge mounting.
                envelope = math.sin(math.pi * min(1, t / .6)) ** 2 if t < .6 else 0
                bone.location.x = .024 * math.sin(t * math.tau * 3) * envelope
                bone.rotation_euler.z = .045 * envelope
            else:
                # The erase sweep cuts the full-size knot; the badge stays forward.
                bone.rotation_euler.z = -.065 * pulse
            for prop in ('location', 'rotation_euler', 'scale'):
                bone.keyframe_insert(data_path=prop, frame=frame, group='knot')
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
    source = folder / 'problem_spaghetti_code_v01.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source))
    author(manifest)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(source))
