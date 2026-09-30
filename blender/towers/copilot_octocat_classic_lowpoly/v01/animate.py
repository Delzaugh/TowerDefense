"""Eleven-bone animation pass; geometry and grounded rest pose are preserved."""
import bpy,math,json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
root=bpy.data.objects['root'];body=bpy.data.objects['body_five_tentacles']
SCALE=globals().get('UNIT_SCALE',1.0)
meshes=[o for o in root.children if o.type=='MESH']
data=bpy.data.armatures.new('octocat_rig');rig=bpy.data.objects.new('octocat_rig',data)
bpy.context.scene.collection.objects.link(rig);rig.parent=root
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
spec=[('motion',(0,0,0),None),('torso',(0,.07,1.10),'motion'),('head',(0,.07,1.24),'torso'),('tail_base',(-.37,.27,1.0),'torso'),('tail_tip',(-.94,.18,1.15),'tail_base')]
for sign,label in [(-1,'left'),(1,'right')]:
    spec.extend([('foot_front_'+label,(sign*.35,-.47,.12),'motion'),('foot_rear_'+label,(sign*.64,.25,.12),'motion')])
spec=[(name,tuple(Vector(pos)*SCALE),parent) for name,pos,parent in spec]
for sign,label in [(-1,'left'),(1,'right')]:
    o=bpy.data.objects['eye_white_'+str(sign)]
    center=(Vector(tuple(min(v.co[i] for v in o.data.vertices) for i in range(3)))+Vector(tuple(max(v.co[i] for v in o.data.vertices) for i in range(3))))*.5
    spec.append(('eye_'+label,tuple(center),'head'))
for name,pos,parent in spec:
    b=data.edit_bones.new(name);b.head=pos;b.tail=Vector(pos)+Vector((0,0,.18*SCALE))
    if parent:b.parent=data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
foot_paths={}
for o in bpy.data.objects:
    if o.type=='CURVE' and str(o.get('anatomy_role','')).startswith('leg_'):
        foot_paths['foot_'+o['anatomy_role'][4:]]=[Vector(p.co[:3])/SCALE for p in o.data.splines[0].points]
def body_weights(p):
    p=p/SCALE
    rise=smooth(.16,1.08,p.z)
    tail=smooth(.32,.65,-p.x)*smooth(.68,.92,p.z)
    tip=smooth(.79,1.24,-p.x)
    foot=min(foot_paths,key=lambda n:min((q-p).length_squared for q in foot_paths[n]))
    ww={n:0 for n in foot_paths}
    ww[foot]=(1-rise)*(1-tail)
    ww.update(torso=rise*(1-tail),tail_base=tail*(1-tip),tail_tip=tail*tip)
    return ww
weights=[body_weights(v.co) for v in body.data.vertices]
tree=BVHTree.FromPolygons([v.co for v in body.data.vertices],[list(p.vertices) for p in body.data.polygons])
def cup_weights(p):
    hit,_,idx,_=tree.find_nearest(p);inds=list(body.data.polygons[idx].vertices)
    a,b,c=[body.data.vertices[i].co for i in inds]
    v0=b-a;v1=c-a;v2=hit-a
    d00=v0.dot(v0);d01=v0.dot(v1);d11=v1.dot(v1);d20=v2.dot(v0);d21=v2.dot(v1)
    den=d00*d11-d01*d01
    if abs(den)<1e-14:return body_weights(hit)
    v=(d11*d20-d01*d21)/den;w=(d00*d21-d01*d20)/den
    bary=[max(0,1-v-w),max(0,v),max(0,w)];total=sum(bary)
    return {n:sum(weights[i].get(n,0)*t/total for i,t in zip(inds,bary)) for n in weights[0]}
for o in meshes:
    o.vertex_groups.clear()
    groups={name:o.vertex_groups.new(name=name) for name,_,_ in spec}
    for v in o.data.vertices:
        if o==body:ww=weights[v.index]
        elif o.name=='suction_cup_rows':ww=cup_weights(v.co)
        elif o.name.startswith('eye_'):ww={'eye_left' if o.name.endswith('-1') else 'eye_right':1}
        else:ww={'head':1}
        for n,w in ww.items():
            if w>1e-7:groups[n].add([v.index],w,'REPLACE')
    o.parent=rig;mod=o.modifiers.new('Octocat skin','ARMATURE');mod.object=rig
# Attach the fitting slots while preserving their authored world-space seats.
bpy.context.view_layer.update()
for o in list(root.children):
    if not o.name.startswith('anchor_') or o.name=='anchor_ui':continue
    bone='head' if o.name in ['anchor_hat','anchor_face','anchor_target'] else 'tail_tip' if o.name=='anchor_hand_left' else 'torso'
    world=o.matrix_world.copy();o.parent=rig;o.parent_type='BONE';o.parent_bone=bone
    bpy.context.view_layer.update();o.matrix_world=world
scene=bpy.context.scene;scene.render.fps=24;rig.animation_data_create()
for b in rig.pose.bones:b.rotation_mode='XYZ'
def bell(t,c,w):return max(0,1-abs(t-c)/w)
def pose(name,t):
    for b in rig.pose.bones:b.matrix_basis.identity()
    env=math.sin(math.pi*t)**2
    torso=rig.pose.bones['torso'];head=rig.pose.bones['head'];base=rig.pose.bones['tail_base'];tip=rig.pose.bones['tail_tip']
    blink=1
    if name=='idle':
        torso.location.y=.025*env
        head.rotation_euler.z=.025*math.sin(2*math.pi*t)
        tip.rotation_euler.z=.065*math.sin(2*math.pi*t)
        blink=1-.94*bell(t,.70,.05)
    elif name=='move':
        # Opposite diagonal pairs: forward recovery while lifted, backward
        # stance travel relative to the stationary placement root.
        torso.location.y=.018*math.sin(2*math.pi*t)**2
        head.rotation_euler.x=.025*math.sin(4*math.pi*t)
        tip.rotation_euler.z=.075*math.sin(2*math.pi*t)
        for n in foot_paths:
            diagonal=n in ['foot_front_left','foot_rear_right']
            phase=(t+(0 if diagonal else .5))%1
            a=math.tau*phase
            dy=.12*math.cos(a);lift=.11*max(0,math.sin(a))**2
            rig.pose.bones[n].location=(0,lift,-dy)
    elif name=='wave':
        torso.location.y=.02*env
        head.rotation_euler.z=-.08*env
        base.rotation_euler.z=.10*env*math.sin(4*math.pi*t)
        tip.rotation_euler.z=.32*env*math.sin(4*math.pi*t+.3)
        blink=1-.94*bell(t,.84,.06)
    elif name=='celebrate':
        # Anticipation, airborne arc, landing compression, then return to rest.
        torso.location.y=-.06*bell(t,.17,.17)-.045*bell(t,.74,.13)
        if .25<t<.70:rig.pose.bones['motion'].location.y=.22*math.sin(math.pi*(t-.25)/.45)
        head.rotation_euler.x=-.07*env
        tip.rotation_euler.z=.25*env
        blink=1-.75*bell(t,.74,.08)
    for n in ['eye_left','eye_right']:rig.pose.bones[n].scale=(1,blink,1)
    for b in rig.pose.bones:b.location*=SCALE
for name,frames in [('idle',60),('move',32),('wave',60),('celebrate',48)]:
    action=bpy.data.actions.new(name);rig.animation_data.action=action
    for f in range(frames+1):
        pose(name,f/frames)
        for b in rig.pose.bones:
            for prop in ['location','rotation_euler','scale']:b.keyframe_insert(data_path=prop,frame=f+1,group=b.name)
    track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,0,action);track.mute=True
    rig.animation_data.action=None
for b in rig.pose.bones:b.matrix_basis.identity()
scene.frame_start=0;scene.frame_end=60;scene.frame_set(0)
root['production_status']='Animated low-poly Classic: idle, move, wave, celebrate. Eleven deform bones; stationary placement root.'
bpy.context.view_layer.update()
