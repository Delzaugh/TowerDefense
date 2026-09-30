"""Mona's eight clips on the inherited Classic rig, with unchanged rest art."""
import bpy, math, json
from pathlib import Path

root = bpy.data.objects['root']
rig = bpy.data.objects['octocat_rig']
scene = bpy.context.scene
scene.render.fps = 24
SCALE = .5851744927
rig.animation_data_create()
for bone in rig.pose.bones:
    bone.rotation_mode = 'XYZ'

# Retain the actual Classic actions, rather than approximating their choreography.
retained = {name: bpy.data.actions[name] for name in ['idle', 'move', 'wave', 'celebrate']}
for name, action in retained.items():
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 0, action)
    track.mute = True

def smooth(a, b, t):
    q = max(0, min(1, (t-a)/(b-a)))
    return q*q*(3-2*q)

def pulse(t, center, width):
    q = max(0, 1-abs(t-center)/width)
    return q*q*(3-2*q)

def pose(name, t):
    for bone in rig.pose.bones:
        bone.matrix_basis.identity()
    torso = rig.pose.bones['torso']
    head = rig.pose.bones['head']
    base = rig.pose.bones['tail_base']
    tip = rig.pose.bones['tail_tip']
    env = math.sin(math.pi*t)**2
    blink = 1
    if name == 'work':
        # Planted supporting legs; the raised tail makes deliberate operating taps.
        torso.location.y = .016*env
        head.rotation_euler.x = env*(-.04+.035*math.sin(4*math.pi*t))
        base.rotation_euler.z = env*(.12+.10*math.sin(4*math.pi*t))
        tip.rotation_euler.z = env*(.28+.12*math.sin(6*math.pi*t))
        blink = 1-.65*pulse(t, .72, .08)
    elif name == 'hit':
        impact = pulse(t, .25, .25)
        rebound = pulse(t, .70, .20)
        torso.location.y = -.06*impact+.02*rebound
        head.rotation_euler.x = .10*impact-.04*rebound
        head.rotation_euler.z = .07*impact
        base.rotation_euler.z = -.18*impact
        tip.rotation_euler.z = -.25*impact
        blink = 1-.90*impact
    else:
        # Pose choreography reverses exactly; shared presentation owns coverage.
        q = t if name == 'resolve' else 1-t
        blink = 1-.94*smooth(.1, .6, q)
        head.rotation_euler.x = .03*math.sin(math.pi*q)**2
    for name in ['eye_left', 'eye_right']:
        rig.pose.bones[name].scale = (1, blink, 1)
    for bone in rig.pose.bones:
        bone.location *= SCALE

for name, frames in [('work', 48), ('hit', 18), ('place', 30), ('resolve', 30)]:
    action = bpy.data.actions.new(name)
    rig.animation_data.action = action
    for frame in range(frames+1):
        pose(name, frame/frames)
        for bone in rig.pose.bones:
            for prop in ['location', 'rotation_euler', 'scale']:
                bone.keyframe_insert(data_path=prop, frame=frame+1, group=bone.name)
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 0, action)
    track.mute = True
    rig.animation_data.action = None

for bone in rig.pose.bones:
    bone.matrix_basis.identity()
rig.animation_data.action = None
for track in rig.animation_data.nla_tracks:
    track.mute = True
scene.frame_start = 0
scene.frame_end = 60
scene.frame_set(0)
manifest = json.loads((Path(__file__).resolve().parent/'asset.json').read_text(encoding='utf-8'))
root['resolve_effect'] = manifest['presentation']['resolve']
root['production_status'] = 'Animated Mona on unchanged Classic rest art: idle, work, move, place, hit, resolve, wave, celebrate.'
bpy.context.view_layer.update()
