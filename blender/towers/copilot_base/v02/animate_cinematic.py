"""Add cinematic acting to authoritative sources without touching rest art or old clips.
Run in isolated Blender: --python this_script -- <manifest>.
"""
import bpy, json, math, sys, hashlib
from pathlib import Path

PROJECT=Path(__file__).resolve().parents[4]
manifest_path=PROJECT/sys.argv[sys.argv.index('--')+1]
m=json.loads(manifest_path.read_text(encoding='utf-8-sig'))
source=PROJECT/m['source']['path']; folder=manifest_path.parent
bpy.ops.wm.open_mainfile(filepath=str(source))
kind=m['id']; rig=bpy.data.objects[{'copilot_base':'copilot_rig','copilot_octocat_classic_lowpoly':'octocat_rig','problem_bug':'bug_rig'}[kind]]
rig.animation_data_create(); rig.animation_data.action=None
scene=bpy.context.scene;scene.render.fps=24
def smooth(t):
    t=max(0,min(1,t)); return t*t*(3-2*t)
def pulse(t,a,b,c):
    return smooth((t-a)/(b-a)) if t<b else 1-smooth((t-b)/(c-b))
def pose(name,t):
    for b in rig.pose.bones:b.matrix_basis.identity();b.rotation_mode='XYZ'
    wave=math.sin(math.tau*t); double=math.sin(math.tau*2*t)
    bones=rig.pose.bones
    if kind=='copilot_base':
        body=bones['body'];body.location.y=.18; eyes=1
        if name=='story_talk':
            # Two phrases: an open question, then a bright emphatic nod.
            a=pulse(t,.03,.20,.37);b=pulse(t,.48,.64,.83)
            body.location.y+=.025*(1-math.cos(math.tau*t))
            body.rotation_euler=(.10*a-.13*b,.10*wave,-.055*a+.075*b)
            eyes=1+.10*a-.20*b-.88*pulse(t,.88,.91,.95)
        elif name=='story_listen':
            body.location.y+=.012*(1-math.cos(math.tau*t))
            body.rotation_euler=(-.035*wave,.055*wave,.05*(1-math.cos(math.tau*t))*.5)
            eyes=1-.94*pulse(t,.60,.64,.69)
        elif name=='story_alarm':
            recoil=pulse(t,.05,.30,.90);wide=pulse(t,.02,.22,.82)
            body.location.y+=.13*recoil
            body.rotation_euler=(-.23*recoil,.07*recoil,-.065*recoil)
            eyes=1+.28*wide-.70*pulse(t,.04,.10,.16)
        elif name=='story_determined':
            settle=pulse(t,.04,.22,.46);nod=pulse(t,.32,.51,.72);hold=smooth((t-.55)/.30)
            body.location.y-=.045*settle
            body.rotation_euler=(.07*settle+.16*nod+.035*hold,0,-.035*settle)
            eyes=1-.24*hold-.18*nod
        for n in ('eye_l','eye_r'):bones[n].scale=(1,eyes,1)
    elif kind=='copilot_octocat_classic_lowpoly':
        torso=bones['torso'];head=bones['head'];base=bones['tail_base'];tip=bones['tail_tip'];eyes=1
        if name=='story_talk':
            a=pulse(t,.04,.18,.37);b=pulse(t,.47,.63,.84)
            torso.location.y=.012*(1-math.cos(math.tau*t))
            head.rotation_euler=(.095*a-.07*b,.09*wave,-.09*a+.075*b)
            base.rotation_euler.z=.13*wave;tip.rotation_euler.z=.19*double
            eyes=1-.94*pulse(t,.88,.92,.96)
        elif name=='story_startle':
            recoil=pulse(t,.03,.29,.94)
            torso.location.y=-.045*recoil
            head.rotation_euler=(-.20*recoil,.07*recoil,-.12*recoil)
            base.rotation_euler.z=-.24*recoil;tip.rotation_euler.z=.42*recoil
            eyes=1-.90*pulse(t,.035,.09,.15)
        elif name=='story_struggle':
            # Airborne resistance; presentation supplies the carried world pose.
            head.rotation_euler=(.10*double,.16*wave,.11*wave)
            torso.rotation_euler.z=.025*wave
            base.rotation_euler.z=.24*wave;tip.rotation_euler.z=-.34*wave
            eyes=1-.55*pulse(t,.40,.48,.57)
            for n in [n for n in bones.keys() if n.startswith('foot_')]:
                sign=1 if n.endswith('left') else -1;phase=t*math.tau+(0 if 'front' in n else math.pi)
                bones[n].location=(sign*.035*math.sin(phase),.06+.07*(1+math.sin(phase)),.07*math.cos(phase))
        elif name=='story_reach':
            reach=smooth(t/.65);breath=pulse(t,.12,.34,.62)
            head.rotation_euler=(.10*reach,-.20*reach,-.15*reach)
            base.rotation_euler.z=-.27*reach;tip.rotation_euler.z=-.36*reach+.12*breath
            torso.location.y=.008*reach
            eyes=1-.22*reach
        for n in ('eye_left','eye_right'):bones[n].scale=(1,eyes,1)
    else:
        body=bones['body'];head=bones['head']
        if name=='story_lurk':
            low=.025*(1-math.cos(math.tau*t))*.5
            body.location.y=-low;head.rotation_euler.x=-.11*(1-math.cos(math.tau*t))*.5
            head.rotation_euler.y=.085*wave
            for n in ('antenna_l','antenna_r'):bones[n].rotation_euler.x=.14*wave*(1 if n.endswith('l') else -.65)
        elif name=='story_grab':
            wind=pulse(t,.04,.20,.42);strike=pulse(t,.27,.48,.88);brace=smooth((t-.65)/.25)
            body.location.y=-.025*wind+.05*strike
            body.rotation_euler.x=-.13*wind+.19*strike+.04*brace
            head.rotation_euler.x=-.08*wind+.22*strike+.10*brace
            for n in ('antenna_l','antenna_r'):bones[n].rotation_euler.x=-.25*strike
            for n in [n for n in bones.keys() if n.startswith('leg_')]:
                if '1' in n:bones[n].rotation_euler.x=-.25*strike if n.endswith('_lower') else .16*strike
        elif name=='story_haul':
            body.location.y=.018*(1-math.cos(math.tau*2*t))
            body.rotation_euler=(.055,.032*wave,.018*wave)
            head.rotation_euler.x=.11+.04*double
            for n in ('antenna_l','antenna_r'):bones[n].rotation_euler.x=-.12+.055*wave
            for n in [n for n in bones.keys() if n.startswith('leg_')]:
                # Preserve original tripod logic, slower deliberate loaded stride.
                upper=n.endswith('_upper')
                if upper:
                    try:index=int(n[5]);phase=t*math.tau+(math.pi if (index-1+(n[4]=='r'))%2 else 0)
                    except (ValueError,IndexError):continue
                    bones[n].rotation_euler.y=.17*math.sin(phase)
                    bones[n].rotation_euler.x=.09*max(0,math.sin(phase))
                    lower=n.replace('_upper','_lower')
                    if lower in bones:bones[lower].rotation_euler.x=-.14*max(0,math.sin(phase))

specs={
 'copilot_base':[('story_talk',72,'loop','Curious open emphasis and conversational nods with expressive eyes.'),('story_listen',72,'loop','Attentive gentle tilt and listening blink.'),('story_alarm',36,'once','Eye widening, recoil and recovery at ready hover height.'),('story_determined',48,'once','Settles, nods with purpose and holds focused eyes.')],
 'copilot_octocat_classic_lowpoly':[('story_talk',72,'loop','Planted expressive head and raised-tail conversation.'),('story_startle',36,'once','Crouching recoil, blink and surprised head/tail recovery.'),('story_struggle',48,'loop','Airborne leg resistance with head/tail counter-motion; scene owns carrying height.'),('story_reach',48,'once','Farewell reach through raised tail and turned head; holds terminal pose.')],
 'problem_bug':[('story_lurk',60,'loop','Low anticipation and searching head/antennae.'),('story_grab',36,'once','Wind-up, forward lunge and loaded brace; root remains stationary.'),('story_haul',32,'loop','Deliberate loaded tripod gait, forward head brace and antenna movement.')]
}[kind]
for name,frames,playback,meaning in specs:
    for track in list(rig.animation_data.nla_tracks):
        if track.name==name:rig.animation_data.nla_tracks.remove(track)
    old=bpy.data.actions.get(name)
    if old:bpy.data.actions.remove(old)
    action=bpy.data.actions.new(name);rig.animation_data.action=action
    for f in range(frames+1):
        scene.frame_set(f+1)
        pose(name,f/frames)
        if kind=='problem_bug':
            # The rigid beetle torso carries its six leg chains. Correct the
            # authored pose's lowest support point before keying, never in runtime.
            bpy.context.view_layer.update()
            ev=bpy.data.objects['bug_body'].evaluated_get(bpy.context.evaluated_depsgraph_get())
            evaluated=ev.to_mesh();floor=min((ev.matrix_world@v.co).z for v in evaluated.vertices);ev.to_mesh_clear()
            bones=rig.pose.bones
            bones['body'].location.y-=floor
        for bone in rig.pose.bones:
            for prop in ('location','rotation_euler','scale'):bone.keyframe_insert(data_path=prop,frame=f+1,group=bone.name)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:key.interpolation='LINEAR'
    action.use_fake_user=True
    track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,0,action);track.mute=True
    rig.animation_data.action=None
    m['clips']=[c for c in m['clips'] if c['name']!=name]+[dict(name=name,playback=playback,fps=24,meaning=meaning,duration=frames/24)]
for obj in [bpy.data.objects['root'],*bpy.data.objects['root'].children_recursive]:
    if obj.animation_data:
        obj.animation_data.action=None
        for track in obj.animation_data.nla_tracks:track.mute=True
    if obj.type=='ARMATURE':
        for bone in obj.pose.bones:bone.matrix_basis.identity()
scene.frame_set(0);bpy.context.view_layer.update()
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(source))
m['source']['mode']='manual'
manifest_path.write_text(json.dumps(m,indent=2)+'\n',encoding='utf-8')
(folder/'decisions.md').open('a',encoding='utf-8').write('\n## Cinematic acting — 2026-09-30\n\nUser explicitly requested expressive cinematic animation polish for these existing cast models. The retained `cinematic_model_baseline` source/export milestone is the model handoff. Preserve accepted rest art, materials, rig, anchors and all existing gameplay clips. Author only the added story clips on the existing rig; animation authorization is explicit, artistic acceptance remains pending. Editable Blender source now owns the added actions; ordinary guarded export is required. Placement root and gameplay outcomes remain scene/simulation owned. Clip timings: '+', '.join(n+' '+str(f/24)+'s '+p for n,f,p,_ in specs)+'.\n')
print('CINEMATIC_CLIPS',kind,[(n,f/24) for n,f,_,_ in specs])
