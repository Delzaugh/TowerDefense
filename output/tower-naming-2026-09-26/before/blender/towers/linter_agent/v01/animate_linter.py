"""Rig and animate the user-approved Linter r12 without changing rest art.

One body bone, six rigid radial shooter bones, two display indicator bones.
Simulation position stays on root; clips contain presentation pose only.
"""
import bpy, json, math, hashlib
from pathlib import Path
from mathutils import Vector, Matrix

HERE=Path(__file__).resolve().parent
SOURCE=HERE/'linter_agent_v01.blend'
BASE=HERE/'revisions/r12_model_approved_before_animation/linter_agent_v01.blend'
AUDIT=HERE/'validation/animation_source.json'
BASE_HASH='2eccbf7bc62b0be512362881c318c171a6f777567761cf2e2cc8674c987ea99c'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
allowed={BASE_HASH}
if AUDIT.exists():allowed.add(json.loads(AUDIT.read_text())['sourceHash'])
assert sha(SOURCE) in allowed, 'Source changed outside the animation pass.'
assert sha(BASE)==BASE_HASH
bpy.ops.wm.open_mainfile(filepath=str(BASE))
scene=bpy.context.scene;scene.render.fps=24
root=bpy.data.objects['root'];model=bpy.data.objects['linter_agent_model']

def art_signature():
    mesh=model.data
    values={'vertices':[list(v.co) for v in mesh.vertices],
            'polygons':[list(p.vertices) for p in mesh.polygons],
            'materials':[p.material_index for p in mesh.polygons],
            'smooth':[p.use_smooth for p in mesh.polygons],
            'uv':[list(l.uv) for l in mesh.uv_layers.active.data]}
    return hashlib.sha256(json.dumps(values,sort_keys=True).encode()).hexdigest()

baseline_signature=art_signature()
baseline_anchors={n:list(bpy.data.objects[n].matrix_world.translation) for n in ('anchor_ui','anchor_action','anchor_target')}
def indices(prefixes):
    groups={g.index for g in model.vertex_groups if any(g.name==p for p in prefixes)}
    return [v.index for v in model.data.vertices if any(g.group in groups for g in v.groups)]
pod_vertices={i:indices([f'lime_rule_socket_{i}',f'socket_inner_recess_{i}',f'rule_port_{i}']) for i in range(6)}
indicator_vertices={i:indices([f'recessed_face_indicator_{i}']) for i in range(2)}
assert all(pod_vertices.values()) and all(indicator_vertices.values())

armature=bpy.data.armatures.new('linter_armature')
rig=bpy.data.objects.new('linter_rig',armature);scene.collection.objects.link(rig);rig.parent=root
model.parent=rig
bpy.context.view_layer.objects.active=rig;rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
def bone(name,head,parent=None):
    b=armature.edit_bones.new(name);b.head=head;b.tail=Vector(head)+Vector((0,.18,0))
    if parent:b.parent=armature.edit_bones[parent]
    return b
bone('body',(0,0,.50))
for i in range(6):
    ids=pod_vertices[i];center=sum((model.data.vertices[v].co for v in ids),Vector())/len(ids)
    bone('shooter_'+str(i+1),center,'body')
for i in range(2):
    ids=indicator_vertices[i];center=sum((model.data.vertices[v].co for v in ids),Vector())/len(ids)
    bone('indicator_'+str(i+1),center,'body')
bpy.ops.object.mode_set(mode='OBJECT')
used=set()
for i,ids in pod_vertices.items():
    model.vertex_groups.new(name='shooter_'+str(i+1)).add(ids,1,'REPLACE');used.update(ids)
for i,ids in indicator_vertices.items():
    model.vertex_groups.new(name='indicator_'+str(i+1)).add(ids,1,'REPLACE');used.update(ids)
model.vertex_groups.new(name='body').add([v.index for v in model.data.vertices if v.index not in used],1,'REPLACE')
modifier=model.modifiers.new('Rigid component rig','ARMATURE');modifier.object=rig
modifier.use_deform_preserve_volume=False

def parent_to_bone(obj,name):
    world=obj.matrix_world.copy()
    obj.parent=rig;obj.parent_type='BONE';obj.parent_bone=name
    bpy.context.view_layer.update();obj.matrix_world=world;bpy.context.view_layer.update()
    assert max(abs(a-b) for a,b in zip(obj.matrix_world.translation,world.translation))<1e-6
for name in baseline_anchors:parent_to_bone(bpy.data.objects[name],'body')
shooters=[]
for i in range(6):
    ids=indices([f'rule_port_{i}'])
    n=Vector((math.sin(math.radians(30+60*i)),-math.cos(math.radians(30+60*i)),0))
    front=max(model.data.vertices[v].co.dot(n) for v in ids)
    z=sum(model.data.vertices[v].co.z for v in ids)/len(ids)
    p=n*(front+.003);p.z=z
    anchor=bpy.data.objects.new('anchor_shooter_'+chr(97+i),None);scene.collection.objects.link(anchor)
    anchor.location=p;anchor.empty_display_size=.06;bpy.context.view_layer.update()
    parent_to_bone(anchor,'shooter_'+str(i+1))
    shooters.append({'anchor':anchor.name,'azimuthDegrees':30+60*i,'sectorDegrees':60})

def smooth(t):
    t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)
def blink(t,center,width):
    q=abs(t-center)/width
    return 1-smooth(q) if q<1 else 0
def recoil(seconds,start):
    q=seconds-start
    if q<0 or q>=.22:return 0
    if q<.045:return smooth(q/.045)
    return 1-smooth((q-.045)/.175)
READY=.15
frames={'idle':48,'work':48,'move':48,'place':30,'hit':12,'resolve':30}
def pose(name,t):
    for b in rig.pose.bones:
        b.rotation_mode='XYZ';b.location=(0,0,0);b.rotation_euler=(0,0,0);b.scale=(1,1,1)
    body=rig.pose.bones['body'];body.location.z=READY
    if name=='idle':
        body.location.z+=.014*math.sin(math.tau*t)
        body.rotation_euler.y=math.radians(.4)*math.sin(math.tau*t)
        height=1-.90*blink(t,.73,.075)
        for i in (1,2):rig.pose.bones['indicator_'+str(i)].scale.z=height
    elif name=='work':
        for i in range(6):
            az=math.radians(30+60*i);pulse=recoil(t*2,i/3+.08)
            b=rig.pose.bones['shooter_'+str(i+1)]
            b.location=(-.055*math.sin(az)*pulse,.055*math.cos(az)*pulse,0)
            body.rotation_euler.x+=math.radians(.42)*math.cos(az)*pulse
            body.rotation_euler.y+=math.radians(.42)*math.sin(az)*pulse
            body.location.z+=.003*pulse
        rig.pose.bones['indicator_1'].scale.z=1-.22*math.sin(3*math.pi*t)**2
        rig.pose.bones['indicator_2'].scale.z=1-.22*math.sin(3*math.pi*t)**2
    elif name=='move':
        body.location.z+=.020*math.sin(math.tau*t)
        body.rotation_euler.x=math.radians(3.2)*math.sin(math.pi*t)**2
        body.rotation_euler.y=math.radians(.85)*math.sin(math.tau*t)
        body.rotation_euler.z=math.radians(1.5)*math.sin(math.tau*t)
    elif name=='hit':
        response=blink(t,.24,.24) if t<.24 else 1-smooth((t-.24)/.76)
        body.location.z+=.040*response
        body.rotation_euler.x=-math.radians(4.5)*response
        body.rotation_euler.y=math.radians(2.0)*response
        for i in (1,2):rig.pose.bones['indicator_'+str(i)].scale.z=1-.65*response
    elif name in ('place','resolve'):
        p=1-t if name=='place' else t
        height=1-.94*smooth(p/.55)
        for i in (1,2):rig.pose.bones['indicator_'+str(i)].scale.z=height

rig.animation_data_create()
for name,count in frames.items():
    action=bpy.data.actions.new(name);rig.animation_data.action=action
    for frame in range(count+1):
        pose(name,frame/count)
        for b in rig.pose.bones:
            for prop in ('location','rotation_euler','scale'):b.keyframe_insert(data_path=prop,frame=frame+1,group=b.name)
    action.use_fake_user=True
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:key.interpolation='LINEAR'
    track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,0,action);track.mute=True
    rig.animation_data.action=None

manifest=json.loads((HERE/'asset.json').read_text())
root['resolve_effect']=manifest['presentation']['resolve']
root['animation_status']='baseline animations authored; runtime review pending'
rig['motion_design']='Grounded authored rest; 0.15 m ready hover; stationary-root glide; six sequential inward rigid recoils; reverse digital lifecycle'
minimum={}
for name in frames:
    bounds=[]
    for sample in range(97):
        pose(name,sample/96);bpy.context.view_layer.update()
        dg=bpy.context.evaluated_depsgraph_get();evaluated=model.evaluated_get(dg)
        mesh=evaluated.to_mesh()
        bounds.append(min((evaluated.matrix_world@v.co).z for v in mesh.vertices))
        evaluated.to_mesh_clear()
    minimum[name]=min(bounds)
    assert minimum[name]>.055,(name,minimum[name])
for b in rig.pose.bones:b.matrix_basis.identity()
scene.frame_set(0);bpy.context.view_layer.update()
assert art_signature()==baseline_signature,'Accepted geometry/UVs changed'
for name,p in baseline_anchors.items():assert (bpy.data.objects[name].matrix_world.translation-Vector(p)).length<1e-6
for obj in [root,*root.children_recursive]:
    if obj.animation_data:
        obj.animation_data.action=None
        for track in obj.animation_data.nla_tracks:track.mute=True
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
report={'sourceHash':sha(SOURCE),'acceptedModelHash':BASE_HASH,'restArtSignature':baseline_signature,
        'restArtPreserved':True,'bones':len(armature.bones),'readyHoverMetres':READY,
        'sampledMinimumClearance':minimum,'shooters':shooters,
        'clips':{name:{'fps':24,'duration':count/24,'samples':count+1} for name,count in frames.items()},
        'minimumRootEmbedDuringRecoil':.035,'maxInwardRecoil':.055}
AUDIT.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
