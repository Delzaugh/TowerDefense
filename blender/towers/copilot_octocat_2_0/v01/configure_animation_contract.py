"""Record authorized additive animation interfaces without overriding source hashes."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
frames={'idle':54,'work':42,'move':28,'run':20,'place':26,'hit':10,'resolve':26}
meanings={
 'idle':'Attentive readiness: restrained weight redistribution, investigative head inclination and a distal curl.',
 'work':'Inspect, brace, operate precisely with a raised tentacle, and acknowledge the result; nonverbal maker acting.',
 'move':'Upright in-place two-leg walk with alternating contacts, distinct counter-swinging arms and a carried rear appendage.',
 'run':'Upright in-place two-leg run with alternating push-off/recovery, brief flight phases and distinct arm counter-swing; simulation owns world travel.',
 'place':'Full-size orienting gesture while shared digital cubes assemble into the ready pose.',
 'hit':'Brief surprise and compression; two planted legs catch the weight while the arms react and recover purposefully.',
 'resolve':'Compact acknowledgment and soft eye closure while shared presentation reverses cube assembly.'}
for low in [False,True]:
    asset='copilot_octocat_2_0'+('_lowpoly' if low else '')
    file=ROOT/'blender/towers'/asset/'v01/asset.json'
    m=json.loads(file.read_text(encoding='utf-8'))
    m['source']['mode']='hybrid'
    m['budgets']['bones']=29
    m['clips']=[{'name':n,'playback':'loop' if n in ['idle','work','move','run'] else 'once',
        'fps':24,'duration':count/24,'meaning':meanings[n]} for n,count in frames.items()]
    m['presentation']={'resolve':{'type':'digital_blocks','version':1,'clip':'resolve','assembleClip':'place',
        'cellSize':.13,'maxFragments':3 if low else 32,'edgeColor':'#9FD5D1'}}
    m['animationDesign']={
        'research':'docs/design/Mona_Octocat_Animation_Research.md',
        'authorization':'User: apply these to both 2.0 octocats (2026-09-30).',
        'userCorrection':'User identifies the previous pentaped study as classic Octocat (1.0); Octocat 2.0 walks/runs on two legs and has distinct arms (2026-09-30).',
        'locomotion':{'type':'biped','cycleSeconds':28/24,'virtualSpeedMetresPerSecond':.40,
            'stanceFraction':.62,'limbOrder':['leg_left','leg_right'],'phaseOffsets':[0,.5],
            'arms':['arm_left','arm_right'],'carriedRearAppendage':'leg_rear','minimumRearClearanceMetres':.20,
            'run':{'cycleSeconds':20/24,'virtualSpeedMetresPerSecond':.75,'stanceFraction':.42,'phaseOffsets':[0,.5]}},
        'expressionTargets':['blink_left','blink_right','focus','surprise','concern','delight','gaze_left','gaze_right'],
        'expressionStates':{'attentive':{},'interest':{'gaze_left':.55},'focused':{'focus':.85},
            'surprised':{'surprise':1},'concerned':{'concern':.8},'amused':{'delight':.5},'delighted':{'delight':1}},
        'maxCombinedTriangles':3997 if low else 68564,
        'restModelAcceptance':'pending; explicit animation authorization is recorded separately'}
    research='docs/design/Mona_Octocat_Animation_Research.md'
    m['references']=[r for r in m['references'] if r['path']!=research]
    m['references'].append({'path':research,
        'provenance':'User-corrected Octocat 2.0 direction: upright two-leg walk/run, distinct arms, nonverbal maker acting. Classic pentaped studies are historical evidence, not the 2.0 gait contract.'})
    reference='blender/towers/copilot_octocat_2_0/v01/references/user_octocat_2_0_biped.png'
    if not any(r['path']==reference for r in m['references']):m['references'].append({'path':reference,
        'url':'https://www.tonytimetables.com/mona/','provenance':'User-supplied illustration reference and explicit instruction: 2.0 is more human-like, walks/runs on two legs, and has arms. Two lower legs and distinct upper arm poses govern this correction.'})
    file.write_text(json.dumps(m,indent=2)+'\n',encoding='utf-8')
