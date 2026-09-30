"""Full-size Glitch breach poses for Dead Code's grounded ready state."""
import bpy
import math


def author(manifest):
    rig = bpy.data.objects['dead_code_rig']
    obj = bpy.data.objects['dead_code']
    root = bpy.data.objects['root']
    bone = rig.pose.bones['marker']
    rest_inverse = rig.data.bones['marker'].matrix_local.inverted()
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

    for name in ('spawn', 'resolve'):
        action = bpy.data.actions.new(name)
        rig.animation_data.action = action
        for frame in range(31):
            t = frame / 30
            envelope = math.sin(math.pi * t)
            bone.rotation_mode = 'XYZ'
            bone.location = (0, 0, 0)
            bone.rotation_euler = (0, 0, 0)
            bone.scale = (1, 1, 1)
            if name == 'spawn':
                jitter = (math.sin(6 * math.pi * t) * envelope * envelope
                          if t < 0.7 else 0.0)
                bone.location.x = 0.018 * jitter
                bone.rotation_euler.z = 0.04 * envelope
            else:
                bone.rotation_euler.z = -0.075 * envelope
                bone.rotation_euler.x = 0.035 * envelope
            # Keep the plinth planted during the small rigid gestures.
            bpy.context.view_layer.update()
            deform = bone.matrix @ rest_inverse
            min_z = min((deform @ v.co).z for v in obj.data.vertices)
            bone.location.y = -min_z
            for prop in ('location', 'rotation_euler', 'scale'):
                bone.keyframe_insert(data_path=prop, frame=frame, group='marker')
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
    bpy.context.scene.frame_set(0)
    bone.location = (0, 0, 0)
    bone.rotation_euler = (0, 0, 0)
    bone.scale = (1, 1, 1)
    root['lifecycle_effect'] = manifest['presentation']['lifecycle']
    bpy.context.view_layer.update()


if __name__ == '__main__':
    import json
    from pathlib import Path
    folder = Path(__file__).resolve().parent
    manifest = json.loads((folder / 'asset.json').read_text(encoding='utf-8-sig'))
    source = folder / 'problem_dead_code_v01.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source))
    author(manifest)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(source))
