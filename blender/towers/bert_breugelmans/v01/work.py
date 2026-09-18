"""A calm five-second explanation: offer an idea, include the team, settle."""
import math, importlib.util
from pathlib import Path
import bpy
from mathutils import Vector,Quaternion
spec=importlib.util.spec_from_file_location('bert_motion_helpers',Path(__file__).with_name('celebrate.py'))
helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
curve=helper.curve
LENGTH=120

def pose(rig,f):
    helper.reset(rig)
    if f<=0 or f>=LENGTH:return
    yaw=curve(f,[(0,0),(18,-.012),(37,-.024),(61,.015),(83,.021),(102,.006),(120,0)])
    lean=curve(f,[(0,0),(17,.008),(36,.017),(54,.011),(73,.016),(97,.004),(120,0)])
    rig.pose.bones['body'].rotation_quaternion=Quaternion((0,0,1),yaw)@Quaternion((1,0,0),lean)
    look=curve(f,[(0,0),(20,-.032),(35,-.048),(58,.018),(78,.042),(95,.012),(120,0)])
    nod=curve(f,[(0,0),(18,-.012),(36,.020),(45,.003),(62,-.009),(78,.025),(89,.006),(120,0)])
    rig.pose.bones['head'].rotation_quaternion=Quaternion((0,0,1),look)@Quaternion((1,0,0),nod)
    for side,s in [('r',1),('l',-1)]:
        if side=='r':
            lift=curve(f,[(0,0),(5,0),(22,.72),(35,1),(48,.91),(65,.88),(83,.55),(108,0),(120,0)])
            spread=curve(f,[(0,.44),(23,.45),(39,.55),(55,.49),(74,.51),(96,.47),(120,.44)])
            z=curve(f,[(0,1.72),(23,1.75),(37,1.83),(49,1.79),(67,1.80),(86,1.72),(120,1.72)])
            depth=curve(f,[(0,-.43),(26,-.46),(39,-.48),(56,-.44),(72,-.46),(120,-.43)])
            turn=curve(f,[(0,0),(9,0),(28,.92),(40,1),(69,.86),(92,.38),(111,0),(120,0)])
        else:
            lift=curve(f,[(0,0),(20,0),(40,.43),(59,.90),(72,1),(88,.83),(114,0),(120,0)])
            spread=curve(f,[(0,.45),(40,.44),(61,.50),(77,.56),(91,.50),(120,.45)])
            z=curve(f,[(0,1.69),(40,1.72),(60,1.76),(76,1.79),(94,1.72),(120,1.69)])
            depth=curve(f,[(0,-.41),(38,-.42),(63,-.47),(77,-.48),(96,-.43),(120,-.41)])
            turn=curve(f,[(0,0),(23,0),(48,.64),(64,1),(83,.90),(100,.36),(117,0),(120,0)])
        a,e,w=[rig.data.bones[n+'_'+side].head_local.copy() for n in ('upper','fore','hand')]
        z+=rig.data.bones['body'].head_local.z-1.35
        target=w.lerp(Vector((s*spread,depth,z)),lift)
        rest_axis=(w-a).normalized();rest_pole=((e-a)-rest_axis*(e-a).dot(rest_axis)).normalized()
        pole=rest_pole.lerp(Vector((s*.28,.04,-1)).normalized(),lift)
        q2=helper.solve_chain(rig,('upper_'+side,'fore_'+side,'hand_'+side),target,pole)
        q0=Quaternion((1,0,0),2.58)@Quaternion((0,0,1),-s*math.pi/2)
        # Both palm normals point toward the body's centreline. Fingers point
        # forward with a small downward slope; this is a palm roll, not an
        # outward wrist deviation disguised by the finger direction.
        offered=helper.hand_orientation((-s*.10,-1,-.40),(-s*.48,-.30,.83))
        rig.pose.bones['hand_'+side].rotation_quaternion=q2.inverted()@q0.slerp(offered,turn)@q0.inverted()
        # Soft open fingers accompany the forearm; no rigid paddle hands.
        for name,axis,angle in [('fingers',(1,0,0),-.13*turn),('digits',(1,0,0),-.18*turn),('thumb',(0,1,0),-s*.17*turn)]:
            rig.pose.bones[name+'_'+side].rotation_quaternion=Quaternion(q0@Vector(axis),angle)

def author(rig):
    rig.animation_data_create();rig.animation_data.action=None
    for t in list(rig.animation_data.nla_tracks):
        if t.name=='work':rig.animation_data.nla_tracks.remove(t)
    old=bpy.data.actions.get('work')
    if old:bpy.data.actions.remove(old)
    action=bpy.data.actions.new('work');rig.animation_data.action=action;previous={}
    for f in range(LENGTH+1):
        pose(rig,f)
        for p in rig.pose.bones:
            if p.name in previous and p.rotation_quaternion.dot(previous[p.name])<0:p.rotation_quaternion.negate()
            previous[p.name]=p.rotation_quaternion.copy()
            for prop in ('location','rotation_quaternion','scale'):p.keyframe_insert(data_path=prop,frame=f,group=p.name)
    for l in action.layers:
        for s in l.strips:
            for bag in s.channelbags:
                for fc in bag.fcurves:
                    for k in fc.keyframe_points:k.interpolation='LINEAR'
    action.use_fake_user=True;t=rig.animation_data.nla_tracks.new();t.name='work'
    strip=t.strips.new('work',0,action);strip.name='work';t.mute=True
    rig.animation_data.action=None
    for t in rig.animation_data.nla_tracks:t.mute=True
    helper.reset(rig);bpy.context.scene.frame_set(0)
    for marker in list(bpy.context.scene.timeline_markers):
        if marker.name.startswith('work:'):bpy.context.scene.timeline_markers.remove(marker)
    for name,f in [('introduce',23),('explain',38),('include',74),('settle',108),('loop',120)]:bpy.context.scene.timeline_markers.new('work: '+name,frame=f)
    bpy.context.scene.frame_end=max(bpy.context.scene.frame_end,LENGTH)
    return action
