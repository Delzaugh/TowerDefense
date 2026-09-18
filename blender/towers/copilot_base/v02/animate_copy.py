"""One-time animation authoring from the preserved v01 source; v02 .blend is editable authority."""
import bpy, json, math, hashlib
from pathlib import Path
from mathutils import Vector

PROJECT = Path(__file__).resolve().parents[4]
FOLDER = Path(__file__).resolve().parent
ORIGINAL = PROJECT / 'blender/towers/copilot_base/v01'
if (FOLDER/'copilot_base_v02.blend').exists():
    raise RuntimeError('v02 already exists; edit its authoritative Blender source instead of repeating this one-time adaptation')
bpy.ops.wm.open_mainfile(filepath=str(ORIGINAL / 'copilot_base_v01.blend'))
root = bpy.data.objects['root']
body = bpy.data.objects['copilot_body']
eyes = bpy.data.objects['copilot_eyes']

rig_data = bpy.data.armatures.new('copilot_rig')
rig = bpy.data.objects.new('copilot_rig', rig_data)
bpy.context.collection.objects.link(rig)
rig.parent = root
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bone = rig_data.edit_bones.new('body')
bone.head = (0, 0, .9)
bone.tail = (0, 0, 1.25)
for name, x in [('eye_l', -.21557), ('eye_r', .22805)]:
    bone = rig_data.edit_bones.new(name)
    bone.head = (x, -.84, .57222)
    bone.tail = (x, -.84, .72222)
    bone.parent = rig_data.edit_bones['body']
bpy.ops.object.mode_set(mode='OBJECT')

for obj in [body, eyes]:
    obj.parent = rig
    modifier = obj.modifiers.new('Copilot skin', 'ARMATURE')
    modifier.object = rig
body.vertex_groups.new(name='body').add(list(range(len(body.data.vertices))), 1, 'REPLACE')
for name, sign in [('eye_l', -1), ('eye_r', 1)]:
    eyes.vertex_groups.new(name=name).add([v.index for v in eyes.data.vertices if v.co.x * sign > 0], 1, 'REPLACE')

# The action origin follows the mascot. UI stays stable over the placement root.
anchor = bpy.data.objects['anchor_action']
world = anchor.matrix_world.copy()
anchor.parent = rig
anchor.parent_type = 'BONE'
anchor.parent_bone = 'body'
bpy.context.view_layer.update()
anchor.matrix_world = world

scene = bpy.context.scene
scene.render.fps = 24
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
rig.animation_data_create()

def bell(t, center, width):
    return max(0, 1 - abs(t-center)/width)

def pose(clip, t):
    # All poses are visual offsets around a stationary placement root.
    pitch = roll = yaw = 0
    lift = .18
    blink = 1
    if clip == 'idle':
        lift += .028 * math.sin(2*math.pi*t)
        roll = math.radians(1.6) * math.sin(2*math.pi*t)
        yaw = math.radians(2) * math.sin(2*math.pi*t)
        blink = 1 - .91 * bell(t, .70, .045)
    elif clip == 'work':
        pulse = math.sin(math.pi*t)**2
        lift += .045 * math.sin(2*math.pi*t)
        pitch = math.radians(9) * pulse
        yaw = math.radians(4) * math.sin(2*math.pi*t)
        blink = 1 - .32*pulse
    elif clip == 'place':
        # Ease down with a small overshoot, then finish at the shared ready pose.
        keys = [(0,.65),(.48,.12),(.70,.225),(1,.18)]
        for (a,va),(b,vb) in zip(keys,keys[1:]):
            if a <= t <= b:
                q=(t-a)/(b-a);q=q*q*(3-2*q);lift=va+(vb-va)*q;break
        pitch = math.radians(-5)*math.sin(math.pi*t)*(1-t)
        blink = 1-.55*bell(t,.48,.15)
    elif clip == 'hit':
        reaction = math.sin(math.pi*min(t/.32,1)) if t<.32 else -.25*math.sin(math.pi*(t-.32)/.68)
        pitch = math.radians(-11)*reaction
        roll = math.radians(6)*reaction
        lift += .055*math.sin(math.pi*t)**2
        blink = 1-.82*bell(t,.18,.18)
    b=rig.pose.bones['body']
    b.rotation_mode='XYZ'
    # Bone-local Y is Blender Z; bone-local Z is negative Blender Y.
    b.location=(0,lift,0)
    b.rotation_euler=(pitch,yaw,roll)
    for name in ['eye_l','eye_r']:
        rig.pose.bones[name].scale=(1,blink,1)

for clip, frames in [('idle',60),('work',36),('place',30),('hit',18)]:
    action=bpy.data.actions.new(clip)
    rig.animation_data.action=action
    for f in range(frames+1):
        pose(clip,f/frames)
        for b in rig.pose.bones:
            for prop in ['location','rotation_euler','scale']:
                b.keyframe_insert(data_path=prop,frame=f+1,group=b.name)
    track=rig.animation_data.nla_tracks.new()
    track.name=clip
    track.strips.new(clip,0,action)
    track.mute=True
    rig.animation_data.action=None

for b in rig.pose.bones:b.matrix_basis.identity()
scene.frame_start=0
scene.frame_end=60
scene.frame_set(0)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
bpy.context.view_layer.objects.active=body
for sub in ['references','validation','renders','revisions']:(FOLDER/sub).mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'copilot_base_v02.blend'))

m=json.loads((ORIGINAL/'asset.json').read_text())
m.update(version='v02',revision=1,displayName='Copilot animated',milestones=[])
m.pop('delivery',None)
m['source']={'path':'blender/towers/copilot_base/v02/copilot_base_v02.blend','mode':'manual'}
m['runtime']='assets/runtime/towers/copilot_base_v02.glb'
m['decisions']='blender/towers/copilot_base/v02/decisions.md'
m['budgets']['bones']=3
m['clips']=[
 {'name':'idle','playback':'loop','fps':24,'meaning':'2.5-second gentle hover and curious sway with one blink; 0.18 m nominal visual lift.'},
 {'name':'work','playback':'loop','fps':24,'meaning':'1.5-second focused forward nod and attentive eye narrowing while doing sustained work.'},
 {'name':'place','playback':'once','fps':24,'meaning':'1.25-second descending placement settle, ending at the ready hover height.'},
 {'name':'hit','playback':'once','fps':24,'meaning':'0.75-second non-terminal recoil and eye squeeze, recovering to the ready hover pose.'}
]
m['references'].append({'path':'blender/towers/copilot_base/v01/copilot_base_v01.blend','provenance':'Exact source copied for the user-requested animation improvement, 2026-09-12. Original meshes, UVs, palette and rest dimensions retained.'})
(FOLDER/'asset.json').write_text(json.dumps(m,indent=2)+'\n')
catalog_path=PROJECT/'assets/asset_catalog.json'
c=json.loads(catalog_path.read_text())
assert not any(a['id']=='copilot_base' and a['version']=='v02' for a in c['assets']), 'v02 already registered; edit its authoritative source instead'
index=next(i for i,a in enumerate(c['assets']) if a['id']=='copilot_base')
c['assets'].insert(index+1,{'id':'copilot_base','version':'v02','manifest':'blender/towers/copilot_base/v02/asset.json'})
catalog_path.write_text(json.dumps(c,indent=2)+'\n')
