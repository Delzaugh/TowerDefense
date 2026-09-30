"""Unhurried in-place walking, baked to Bert's existing deform skeleton.

Heel and toe pivots travel at a constant stance speed. The swing joins their
ankle trajectories with matched velocities, while the pelvis settles over
each supporting leg. World travel remains a presentation/simulation concern.
"""
import math, importlib.util
from pathlib import Path
import bpy
from mathutils import Vector, Quaternion
spec=importlib.util.spec_from_file_location('bert_walk_helpers',Path(__file__).with_name('celebrate.py'))
helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
LENGTH=36
STANCE=22/36
STRIDE=.38

def shoulder_angle(p):
    # A gentle return from the rear, a longer forward arc, then an unhurried
    # reversal. Matching quiet endpoints retain a continuous periodic curve.
    return helper.curve(p%1,[(0,.10),(.11,.075),(.28,-.075),(.50,-.24),
        (.62,-.20),(.81,0),(1,.10)])

def arm_pose(rig,side,s,p):
    a,e,w=[rig.data.bones[n+'_'+side].head_local.copy() for n in ('upper','fore','hand')]
    scale=.97 if side=='l' else 1.03
    upper_angle=scale*shoulder_angle(p)
    # Elbow follows the shoulder by about two frames, and stays softly bent.
    # Straightening the walking baseline releases the old forward-held arms.
    fore_angle=scale*shoulder_angle(p-.055)-.20
    upper_direction=Quaternion((1,0,0),upper_angle)@Vector((s*.15,0,-.34)).normalized()
    fore_direction=Quaternion((1,0,0),fore_angle)@Vector((s*.020,0,-.33)).normalized()
    q1=(e-a).rotation_difference(upper_direction)
    q2=(w-e).rotation_difference(fore_direction)
    rig.pose.bones['upper_'+side].rotation_quaternion=q1
    rig.pose.bones['fore_'+side].rotation_quaternion=q1.inverted()@q2
    # Let relaxed hands continue the forearm with a short, small follow-through.
    # Palms stay toward the thighs; no separate metronomic wrist waggle.
    finger_angle=scale*shoulder_angle(p-.08)-.22
    direction=Quaternion((1,0,0),finger_angle)@Vector((-s*.025,0,-1))
    hand=helper.hand_orientation(direction,(-s,0,.04))
    q0=Quaternion((1,0,0),2.58)@Quaternion((0,0,1),-s*math.pi/2)
    rig.pose.bones['hand_'+side].rotation_quaternion=q2.inverted()@hand@q0.inverted()
    for name,axis,angle in [('fingers',(1,0,0),-.14),('digits',(1,0,0),-.20),('thumb',(0,1,0),-s*.10)]:
        rig.pose.bones[name+'_'+side].rotation_quaternion=Quaternion(q0@Vector(axis),angle)

def pitch(p):
    return helper.curve(p,[(0,-.14),(4/36,0),(15/36,0),(STANCE,.34),(26/36,.18),(31/36,-.09),(1,-.14)])

def shoe_points(rig,side):
    points=[]
    for obj in bpy.context.scene.objects:
        if obj.type!='MESH' or not any(m.type=='ARMATURE' and m.object==rig for m in obj.modifiers):continue
        group=obj.vertex_groups.get('foot_'+side)
        if not group:continue
        points += [v.co.copy() for v in obj.data.vertices if abs(v.co.z)<1e-5
                   and any(w.group==group.index and w.weight>.99 for w in v.groups)]
    if not points:raise ValueError('No sole contact vertices: '+side)
    return points

def stance_ankle(ankle,points,p):
    angle=pitch(p);q=Quaternion((1,0,0),angle)
    # Both rear heel corners share Y. The slightly asymmetric rounded toe uses
    # the furthest sole vertex, preventing toe penetration during push-off.
    contact_y=(max if angle<0 else min)(v.y for v in points)
    pivot=Vector((ankle.x,contact_y,0))
    return pivot+q@(ankle-pivot)+Vector((0,-STRIDE/2+STRIDE*p/STANCE,0))

def foot_pose(ankle,points,p):
    q=Quaternion((1,0,0),pitch(p))
    if p<=STANCE:return stance_ankle(ankle,points,p),q
    duration=1-STANCE;u=(p-STANCE)/duration
    start=stance_ankle(ankle,points,STANCE);end=stance_ankle(ankle,points,0)
    # Pitch has zero tangent at both contacts, so ankle velocity equals the
    # ground's backward velocity. Cubic Hermite avoids the old stop/start feet.
    velocity=Vector((0,STRIDE/STANCE,0))*duration
    target=(2*u**3-3*u*u+1)*start+(u**3-2*u*u+u)*velocity
    target+=(-2*u**3+3*u*u)*end+(u**3-u*u)*velocity
    target.z+=.055*math.sin(math.pi*u)**2
    return target,q

def pose(rig,f,soles):
    helper.reset(rig);t=(f/LENGTH)%1;phase=math.tau*t
    offset=Vector((-.022*math.sin(phase),0,-.017-.008*math.cos(2*phase)))
    pelvis=Quaternion((0,0,1),.025*math.cos(phase))@Quaternion((0,1,0),-.012*math.sin(phase))
    rig.pose.bones['pelvis'].location=offset
    rig.pose.bones['pelvis'].rotation_quaternion=pelvis
    h=rig.data.bones['pelvis'].head_local
    for side,s in [('l',-1),('r',1)]:
        p=(t+(0 if side=='l' else .5))%1
        ankle=rig.data.bones['foot_'+side].head_local.copy()
        target,q=foot_pose(ankle,soles[side],p)
        parent_target=h+pelvis.inverted()@(target-h-offset)
        q2=helper.solve_chain(rig,('thigh_'+side,'shin_'+side,'foot_'+side),parent_target,pelvis.inverted()@Vector((0,-1,0)))
        rig.pose.bones['foot_'+side].rotation_quaternion=q2.inverted()@pelvis.inverted()@q
        arm_pose(rig,side,s,p)
    rig.pose.bones['body'].rotation_quaternion=(Quaternion((0,0,1),-.040*math.cos(phase-.10))
        @Quaternion((1,0,0),.023+.005*math.sin(2*phase-.25))
        @Quaternion((0,1,0),.006*math.sin(phase-.15)))
    rig.pose.bones['head'].rotation_quaternion=Quaternion((0,0,1),.012*math.cos(phase-.10))@Quaternion((1,0,0),-.012-.003*math.sin(2*phase-.4))

def author(rig):
    rig.animation_data_create();rig.animation_data.action=None
    for t in list(rig.animation_data.nla_tracks):
        if t.name=='move':rig.animation_data.nla_tracks.remove(t)
    old=bpy.data.actions.get('move')
    if old:bpy.data.actions.remove(old)
    soles={side:shoe_points(rig,side) for side in ('l','r')}
    action=bpy.data.actions.new('move');rig.animation_data.action=action;previous={}
    for f in range(LENGTH+1):
        pose(rig,f,soles)
        for p in rig.pose.bones:
            if p.name in previous and p.rotation_quaternion.dot(previous[p.name])<0:p.rotation_quaternion.negate()
            previous[p.name]=p.rotation_quaternion.copy()
            for prop in ('location','rotation_quaternion','scale'):p.keyframe_insert(data_path=prop,frame=f,group=p.name)
    for l in action.layers:
        for s in l.strips:
            for bag in s.channelbags:
                for fc in bag.fcurves:
                    for k in fc.keyframe_points:k.interpolation='LINEAR'
    action.use_fake_user=True;t=rig.animation_data.nla_tracks.new();t.name='move'
    strip=t.strips.new('move',0,action);strip.name='move';t.mute=True
    rig.animation_data.action=None
    for t in rig.animation_data.nla_tracks:t.mute=True
    helper.reset(rig);bpy.context.scene.frame_set(0)
    for marker in list(bpy.context.scene.timeline_markers):
        if marker.name.startswith('move:'):bpy.context.scene.timeline_markers.remove(marker)
    for name,f in [('left heel',0),('left support',9),('right heel',18),('right support',27),('loop',36)]:bpy.context.scene.timeline_markers.new('move: '+name,frame=f)
    return action
