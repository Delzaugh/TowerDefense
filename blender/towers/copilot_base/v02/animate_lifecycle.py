"""Refine the authoritative Base v02 source's Place/Resolve pair in place."""
import bpy
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
manifest = json.loads((HERE / 'asset.json').read_text(encoding='utf-8'))
rig = bpy.data.objects['copilot_rig']
root = bpy.data.objects['root']
rig.animation_data_create()
scene = bpy.context.scene
scene.render.fps = 24


def smooth(value):
    value = min(1.0, max(0.0, value))
    return value * value * (3.0 - 2.0 * value)


def bell(value, center, width):
    return max(0.0, 1.0 - abs(value - center) / width)


def remove_clip(name):
    for track in list(rig.animation_data.nla_tracks):
        if track.name == name:
            rig.animation_data.nla_tracks.remove(track)
    action = bpy.data.actions.get(name)
    if action:
        bpy.data.actions.remove(action)


def pose(name, t):
    body = rig.pose.bones['body']
    body.rotation_mode = 'XYZ'
    lift, pitch, yaw, roll, eye_height = .18, 0.0, 0.0, 0.0, 1.0
    if name == 'move':
        # Limb-free Copilot glides in place; simulation supplies travel.
        wave = math.sin(math.tau * t)
        lift += .028 * wave
        pitch = math.radians(4.0) * math.sin(math.pi * t) ** 2
        yaw = math.radians(2.5) * wave
        roll = math.radians(1.5) * wave
        eye_height = 1.0 - .18 * bell(t, .48, .08)
    elif name == 'resolve':
        # Full-size ready pose stays aligned to the presenter's fixed voxel grid.
        eye_height = 1.0 - .92 * smooth(t / .55)
    elif name == 'place':
        # Exact reverse of Resolve. Cubes and visibility live in presentation.
        eye_height = 1.0 - .92 * smooth((1.0 - t) / .55)
    body.location = (0.0, lift, 0.0)
    body.rotation_euler = (pitch, yaw, roll)
    body.scale = (1.0, 1.0, 1.0)
    for bone_name in ('eye_l', 'eye_r'):
        eye = rig.pose.bones[bone_name]
        eye.location = (0.0, 0.0, 0.0)
        eye.rotation_mode = 'XYZ'
        eye.rotation_euler = (0.0, 0.0, 0.0)
        eye.scale = (1.0, eye_height, 1.0)


for name in ('place', 'move', 'resolve'):
    remove_clip(name)

for name, frames in (('move', 48), ('place', 30), ('resolve', 30)):
    action = bpy.data.actions.new(name)
    rig.animation_data.action = action
    for frame in range(frames + 1):
        pose(name, frame / frames)
        for bone in rig.pose.bones:
            for prop in ('location', 'rotation_euler', 'scale'):
                bone.keyframe_insert(data_path=prop, frame=frame + 1, group=bone.name)
    action.use_fake_user = True
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = 'LINEAR'
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 0, action)
    track.mute = True
    rig.animation_data.action = None

root['resolve_effect'] = manifest['presentation']['resolve']
rig['motion_design'] = 'Grounded rest; ready hover .18 m; in-place glide; matched full-size digital Place/Resolve'
for obj in [root, *root.children_recursive]:
    if obj.animation_data:
        obj.animation_data.action = None
        for track in obj.animation_data.nla_tracks:
            track.mute = True
    if obj.type == 'ARMATURE':
        for bone in obj.pose.bones:
            bone.matrix_basis.identity()
scene.frame_set(0)
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(HERE / 'copilot_base_v02.blend'))
print('BASE_LIFECYCLE', [track.name for track in rig.animation_data.nla_tracks])
