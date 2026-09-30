"""Tester motion pass. Called after accepted geometry is built; never exports.

Three bones: a rigid manufactured body and two independent display eyes.
Blender -Y forward, +Z up; all world locomotion remains simulation-owned.
"""
import math
import bpy
from mathutils import Matrix, Vector, Euler


def smooth(t):
    t = min(1., max(0., t))
    return t*t*(3.-2.*t)


def pulse(t, start, peak, end):
    if t < start or t > end:
        return 0.
    return smooth((t-start)/(peak-start)) if t < peak else 1.-smooth((t-peak)/(end-peak))


def author(manifest):
    scene = bpy.context.scene
    obj = bpy.data.objects['tester_model']
    root = bpy.data.objects['root']
    mesh = obj.data
    assert not bpy.data.objects.get('tester_rig'), 'Animation already authored'
    eye_groups = [g for g in obj.vertex_groups if g.name.startswith('curved_display_eye')]
    assert len(eye_groups) == 2
    eyes = {}
    for group in eye_groups:
        ids = [v.index for v in mesh.vertices if any(g.group == group.index and g.weight > .5 for g in v.groups)]
        center = sum((mesh.vertices[i].co for i in ids), Vector())/len(ids)
        eyes['eye_l' if center.x < 0 else 'eye_r'] = (ids, center)
    eye_ids = {i for ids, _ in eyes.values() for i in ids}
    arm = bpy.data.armatures.new('tester_skeleton')
    rig = bpy.data.objects.new('tester_rig', arm)
    scene.collection.objects.link(rig)
    rig.parent = root
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    body = arm.edit_bones.new('body')
    body.head = (0, 0, 1.)
    body.tail = (0, 0, 1.35)
    for name, (_, center) in eyes.items():
        b = arm.edit_bones.new(name)
        b.head = center
        b.tail = center + Vector((0, 0, .15))
        b.parent = body
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.vertex_groups.new(name='body').add([v.index for v in mesh.vertices if v.index not in eye_ids], 1, 'REPLACE')
    for name, (ids, _) in eyes.items():
        obj.vertex_groups.new(name=name).add(ids, 1, 'REPLACE')
    obj.parent = rig
    mod = obj.modifiers.new('Rigid body and display controls', 'ARMATURE')
    mod.object = rig
    # Action and target origins follow the body; UI remains stable at root.
    bpy.context.view_layer.update()
    for name in ('anchor_action', 'anchor_target'):
        anchor = bpy.data.objects[name]
        world = anchor.matrix_world.copy()
        anchor.parent = rig
        anchor.parent_type = 'BONE'
        anchor.parent_bone = 'body'
        anchor.matrix_world = world
    for pb in rig.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    rest = {b.name: b.matrix_local.copy() for b in arm.bones}
    pivot = Vector((0, 0, 1.))
    frames = {'idle': 60, 'work': 40, 'move': 32, 'place': 30, 'hit': 14, 'resolve': 30}
    scene.render.fps = 24
    rig.animation_data_create()

    def reset():
        for pb in rig.pose.bones:
            pb.matrix_basis = Matrix.Identity(4)

    for clip in manifest['clips']:
        name = clip['name']
        length = frames[name]
        action = bpy.data.actions.new(name)
        rig.animation_data.action = action
        for f in range(length+1):
            t = f/length
            w = math.sin(math.tau*t)
            envelope = (1.-math.cos(math.tau*t))*.5
            lift, pitch, yaw, roll, size, back = .14, 0., 0., 0., 1., 0.
            eye_height = 1.
            if name == 'idle':
                lift += .022*w
                roll = .010*w
                eye_height -= .88*pulse(t, .65, .70, .76)
            elif name == 'work':
                lift += .012*math.sin(math.tau*2*t)
                pitch = .055*envelope + .012*math.sin(math.tau*2*t)
                yaw = .12*math.sin(math.tau*t)*envelope
                eye_height -= .25*envelope
            elif name == 'move':
                lift += .026*w
                pitch = .10*envelope
                roll = .025*w
                eye_height -= .12*envelope
            elif name == 'place':
                # Exact reverse of Resolve. Runtime cubes assemble into a
                # stationary, full-size ready pose; the eyes open at completion.
                eye_height = 1.-.90*smooth((1.-t)/.5)
            elif name == 'hit':
                recoil = pulse(t, 0., .22, 1.)
                rebound = pulse(t, .45, .64, 1.)
                pitch = -.16*recoil + .035*rebound
                roll = .065*recoil
                back = .055*recoil
                lift += .022*recoil
                eye_height -= .72*recoil
            elif name == 'resolve':
                # Keep the manufactured body full-size and stable during its
                # cell-aligned runtime breakup. Only the display powers down.
                eye_height = 1.-.90*smooth(t/.5)
            deformation = (Matrix.Translation(pivot) @
                           Euler((pitch, roll, yaw), 'XYZ').to_matrix().to_4x4() @
                           Matrix.Diagonal((size, size, size, 1.)) @
                           Matrix.Translation(-pivot))
            # Exact supporting height per authored frame; interpolation is checked
            # again on the exported skin, including between frames.
            min_z = min((deformation @ v.co).z for v in mesh.vertices)
            deformation = Matrix.Translation((0, back, lift-min_z)) @ deformation
            rig.pose.bones['body'].matrix = deformation @ rest['body']
            bpy.context.view_layer.update()
            for bone_name, (_, center) in eyes.items():
                expression = Matrix.Translation(center) @ Matrix.Diagonal((1., 1., eye_height, 1.)) @ Matrix.Translation(-center)
                rig.pose.bones[bone_name].matrix = deformation @ expression @ rest[bone_name]
            for pb in rig.pose.bones:
                for prop in ('location', 'rotation_quaternion', 'scale'):
                    pb.keyframe_insert(data_path=prop, frame=f, group=pb.name)
        action.use_fake_user = True
        # Frame samples interpolate linearly, including full-loop endpoints.
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:
                            key.interpolation = 'LINEAR'
        track = rig.animation_data.nla_tracks.new()
        track.name = name
        strip = track.strips.new(name, 0, action)
        strip.name = name
        track.mute = True
    rig.animation_data.action = None
    reset()
    scene.frame_set(0)
    scene.frame_end = 60
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    rig['motion_design'] = 'Grounded rest; gentle in-place hover/glide playback; rigid shell; independent display eyes'
    root['resolve_effect'] = manifest['presentation']['resolve']
    print('DEVELOPER_ANIMATIONS', list(frames), '3 bones; accepted rest geometry retained')
