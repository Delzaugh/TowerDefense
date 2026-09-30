"""Bert's authored three-clap performance; reusable by source edit and recipe.

All targets are in the torso's rest coordinates. Analytic IK bakes to the
existing deform rig: no runtime solver, root travel, or extra bones.
"""
import math
import bpy
from mathutils import Vector, Quaternion, Matrix

CONTACTS = (28, 40, 54)
LENGTH = 96
CLAP_TILT = .30
CONTACT_GAP = .0253
ARM_FORWARD = .035
ELBOW_OUT = 2.0

def hand_orientation(finger_direction,palm_normal):
    """Map the sculpted hand's +Z fingers and -Y palm to anatomical axes.

    Constructing an orthogonal frame avoids interpreting mirrored wrist Euler
    signs as an inward palm roll. The requested normal is projected onto the
    plane perpendicular to the fingers.
    """
    z=Vector(finger_direction).normalized()
    normal=Vector(palm_normal)
    normal=(normal-z*normal.dot(z)).normalized()
    y=-normal;x=y.cross(z).normalized()
    return Matrix((x,y,z)).transposed().to_quaternion()

def curve(frame, keys):
    """Shape-preserving cubic interpolation, with quiet endpoint tangents."""
    if frame <= keys[0][0]: return keys[0][1]
    if frame >= keys[-1][0]: return keys[-1][1]
    slopes = [(b[1]-a[1])/(b[0]-a[0]) for a,b in zip(keys,keys[1:])]
    tangents = [0.0]
    for a,b in zip(slopes,slopes[1:]):
        tangents.append(0.0 if a*b <= 0 else 2*a*b/(a+b))
    tangents.append(0.0)
    for i,(a,b) in enumerate(zip(keys,keys[1:])):
        if a[0] <= frame <= b[0]:
            dt=b[0]-a[0]; u=(frame-a[0])/dt
            return ((2*u**3-3*u*u+1)*a[1] + (u**3-2*u*u+u)*dt*tangents[i]
                    +(-2*u**3+3*u*u)*b[1]+(u**3-u*u)*dt*tangents[i+1])

def reset(rig):
    for p in rig.pose.bones:
        p.rotation_mode='QUATERNION'
        p.matrix_basis.identity()

def solve_chain(rig, names, target, pole):
    upper,lower,end = names
    a,e,w = [rig.data.bones[n].head_local.copy() for n in names]
    d=target-a; length=d.length; axis=d.normalized()
    l1=(e-a).length; l2=(w-e).length
    if length >= l1+l2-.0001: raise ValueError(('Unreachable target',end,length))
    along=(l1*l1-l2*l2+length*length)/(2*length)
    height=math.sqrt(max(0,l1*l1-along*along))
    pole=(pole-axis*pole.dot(axis)).normalized()
    elbow=a+axis*along+pole*height
    q1=(e-a).rotation_difference(elbow-a)
    q2=(w-e).rotation_difference(target-elbow)
    rig.pose.bones[upper].rotation_quaternion=q1
    rig.pose.bones[lower].rotation_quaternion=q1.inverted()@q2
    return q2

def pose(rig, f):
    reset(rig)
    # Anticipation leads the arms. Support legs compensate the small weight shift.
    weight=curve(f,[(0,0),(8,.3),(23,1),(55,.90),(70,.62),(91,0),(96,0)])
    offset=Vector((.020*weight, -.006*weight, -.014*weight))
    rig.pose.bones['pelvis'].location=offset
    for side in ('l','r'):
        names=('thigh_'+side,'shin_'+side,'foot_'+side)
        a,e,w=[rig.data.bones[n].head_local.copy() for n in names]
        axis=(w-a).normalized(); rest_pole=(e-a)-axis*(e-a).dot(axis)
        q=solve_chain(rig,names,w-offset,rest_pole.normalized())
        rig.pose.bones[names[-1]].rotation_quaternion=q.inverted()

    lean=curve(f,[(0,0),(7,-.010),(22,.024),(39,.018),(55,.022),(70,.005),(94,0)])
    yaw=curve(f,[(0,0),(17,-.023),(34,.016),(56,.025),(79,-.007),(96,0)])
    rig.pose.bones['body'].rotation_quaternion=(Quaternion((0,0,1),yaw)
        @Quaternion((1,0,0),lean)@Quaternion((0,1,0),-.009*weight))
    nod=curve(f,[(0,0),(12,-.018),(24,-.030),(33,.032),(42,.010),
                (54,.022),(62,-.012),(78,.008),(96,0)])
    rig.pose.bones['head'].rotation_quaternion=(Quaternion((1,0,0),nod)
        @Quaternion((0,0,1),-.50*yaw))

    # Different wind-ups and openings; the palms share only the impact beats.
    half_gap=curve(f,[(0,.20),(22,.20),(24,.169),(28,CONTACT_GAP),(29,CONTACT_GAP+.005),
        (34,.180),(36,.166),(40,CONTACT_GAP),(41,CONTACT_GAP+.005),(48,.161),(50,.145),
        (54,CONTACT_GAP),(55,CONTACT_GAP+.005),(63,.184),(72,.19),(96,.19)])
    center=curve(f,[(0,0),(22,.013),(28,.008),(35,.001),(41,.011),
                   (48,.022),(54,.016),(64,.006),(96,0)])
    height=curve(f,[(0,1.82),(22,1.825),(28,1.84),(35,1.85),(41,1.843),
                   (48,1.83),(54,1.828),(64,1.82),(96,1.82)])
    depth=curve(f,[(0,-.435),(22,-.432),(28,-.443),(35,-.433),(41,-.442),
                  (48,-.428),(54,-.439),(64,-.426),(96,-.43)])
    for side,s in [('l',-1),('r',1)]:
        # Left hand leads in; right relaxes slightly later after the last clap.
        lift=curve(f,[(0,0),(3 if side=='l' else 5,0),(12 if side=='l' else 14,.22),
            (21 if side=='l' else 23,1),(64 if side=='l' else 66,1),
            (75 if side=='l' else 78,.70),(89 if side=='l' else 92,0),(96,0)])
        orient=curve(f,[(0,0),(8 if side=='l' else 10,0),(18,.62),(24,1),
            (66,1),(80,.40),(93,0),(96,0)])
        a,e,w=[rig.data.bones[n+'_'+side].head_local.copy() for n in ('upper','fore','hand')]
        opening=half_gap-CONTACT_GAP
        target=Vector((center+s*(CONTACT_GAP+opening*(.88 if side=='l' else 1.12)),
                       depth-ARM_FORWARD+(.006 if side=='l' else -.006),
                       height+rig.data.bones['body'].head_local.z-1.35+(.012 if side=='l' else -.012)))
        wrist=w.lerp(target,lift)
        # Continuous elbow plane from neutral to a low, relaxed applause pose.
        rest_axis=(w-a).normalized(); rest_pole=((e-a)-rest_axis*(e-a).dot(rest_axis)).normalized()
        pole=rest_pole.lerp(Vector((s*ELBOW_OUT,.03,-1)).normalized(),lift)
        q2=solve_chain(rig,('upper_'+side,'fore_'+side,'hand_'+side),wrist,pole)
        q0=Quaternion((1,0,0),2.58)@Quaternion((0,0,1),-s*math.pi/2)
        # A little forward finger tilt and soft cupping, with no mirrored wrist snap.
        qclap=Quaternion((0,1,0),s*CLAP_TILT)@Quaternion((1,0,0),-.14)@Quaternion((0,0,1),-s*math.pi/2)
        delta=q0.slerp(qclap,orient)@q0.inverted()
        rig.pose.bones['hand_'+side].rotation_quaternion=q2.inverted()@delta
        curl=curve(f-1,[(0,0),(10,0),(25,1),(58,1),(74,.45),(93,0),(96,0)])
        for name,axis,angle in [('fingers',(1,0,0),-.18*curl),
                                ('digits',(1,0,0),-.25*curl),
                                ('thumb',(0,1,0),-s*.14*curl)]:
            rig.pose.bones[name+'_'+side].rotation_quaternion=Quaternion(q0@Vector(axis),angle)

def author(rig):
    rig.animation_data_create()
    rig.animation_data.action=None
    for track in list(rig.animation_data.nla_tracks):
        if track.name=='celebrate_team': rig.animation_data.nla_tracks.remove(track)
    old=bpy.data.actions.get('celebrate_team')
    if old: bpy.data.actions.remove(old)
    action=bpy.data.actions.new('celebrate_team')
    rig.animation_data.action=action
    previous={}
    for f in range(LENGTH+1):
        pose(rig,f)
        for p in rig.pose.bones:
            # Equivalent quaternion signs must never make the sampled curve flip.
            if p.name in previous and p.rotation_quaternion.dot(previous[p.name])<0:
                p.rotation_quaternion.negate()
            previous[p.name]=p.rotation_quaternion.copy()
            for prop in ('location','rotation_quaternion','scale'):
                p.keyframe_insert(data_path=prop,frame=f,group=p.name)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for key in fc.keyframe_points: key.interpolation='LINEAR'
    action.use_fake_user=True
    track=rig.animation_data.nla_tracks.new(); track.name='celebrate_team'
    strip=track.strips.new('celebrate_team',0,action); strip.name='celebrate_team'; track.mute=True
    rig.animation_data.action=None
    for track in rig.animation_data.nla_tracks: track.mute=True
    reset(rig); bpy.context.scene.frame_set(0)
    for marker in list(bpy.context.scene.timeline_markers):
        if marker.name.startswith('celebrate:'): bpy.context.scene.timeline_markers.remove(marker)
    for name,frame in [('anticipation',7),('prepare',22),('clap 1',28),('clap 2',40),('clap 3',54),('release',66),('rest',96)]:
        bpy.context.scene.timeline_markers.new('celebrate: '+name,frame=frame)
    return action
