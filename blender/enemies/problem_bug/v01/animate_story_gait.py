"""Bake compact two-link IK to the existing Bug bones. Never rebuild art."""
import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
HERE=Path(__file__).resolve().parent
source=HERE/'problem_bug_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
rig=bpy.data.objects['bug_rig'];obj=bpy.data.objects['bug_body'];scene=bpy.context.scene
rig.animation_data.action=None
for track in rig.animation_data.nla_tracks:track.mute=True
for bone in rig.pose.bones:bone.matrix_basis.identity();bone.rotation_mode='XYZ'
scene.frame_set(0);bpy.context.view_layer.update()
feet={};rest={}
for side in ('l','r'):
 for i in range(1,4):
  u=f'leg_{side}{i}_upper';l=f'leg_{side}{i}_lower'
  group=obj.vertex_groups[l]
  ids=[v.index for v in obj.data.vertices if any(g.group==group.index and g.weight>.9 for g in v.groups)]
  minz=min(obj.data.vertices[i].co.z for i in ids)
  feet[l]=[i for i in ids if obj.data.vertices[i].co.z<minz+.08]
  rest[l]={'upper':u,'hip':rig.data.bones[u].head_local.copy(),'knee':rig.data.bones[l].head_local.copy(),'foot':rig.data.bones[l].tail_local.copy(),'centroidY':sum(obj.data.vertices[j].co.y for j in feet[l])/len(feet[l]),'L1':rig.data.bones[u].length,'L2':rig.data.bones[l].length,'phase':0 if (i-1+(side=='r'))%2==0 else .5}

def solve(l,target):
 r=rest[l];u=r['upper'];body=rig.pose.bones['body'];parent=body.matrix@body.bone.matrix_local.inverted()
 hip=parent@r['hip'];oldknee=parent@r['knee'];oldfoot=parent@r['foot']
 axis=(target-hip).normalized();distance=(target-hip).length
 # Keep intended reach inside the source linkage length; never stretch skin.
 d=min(r['L1']+r['L2']-.0005,max(abs(r['L1']-r['L2'])+.0005,distance))
 target=hip+axis*d
 a=(r['L1']**2-r['L2']**2+d*d)/(2*d)
 height=math.sqrt(max(0,r['L1']**2-a*a))
 pole=oldknee-hip;pole-=axis*pole.dot(axis)
 if pole.length<1e-5:pole=Vector((1,0,0))-axis*axis.x
 knee=hip+axis*a+pole.normalized()*height
 for name,head,end in ((u,hip,knee),(l,knee,target)):
  rb=rig.data.bones[name]
  direction=(end-head).normalized();rest_direction=(rb.tail_local-rb.head_local).normalized()
  rotation=rest_direction.rotation_difference(direction)@rb.matrix_local.to_quaternion()
  rig.pose.bones[name].matrix=Matrix.LocRotScale(head,rotation,Vector((1,1,1)))
  bpy.context.view_layer.update()
 return distance-d

def targets(t,stride):
 values={}
 for l,r in rest.items():
  phase=(t+r['phase'])%1;sweep=stride/2
  if phase<.5:
   offset=sweep*(phase*2-.5);lift=0
  else:
   s=(phase-.5)*2
   # Hermite recovery preserves stance velocity on both sides of contact.
   offset=(2*s**3-3*s**2+1)*sweep/2+(s**3-2*s*s+s)*sweep+(-2*s**3+3*s*s)*(-sweep/2)+(s**3-s*s)*sweep
   lift=.15*math.sin(math.pi*s)**2
  values[l]=r['foot']+Vector((-.17 if r['foot'].x>0 else .17,offset,lift))
 return values

audit={}
for name,frames,stride in [('story_haul',32,.70),('story_creep',44,.65)]:
 for track in list(rig.animation_data.nla_tracks):
  if track.name==name:rig.animation_data.nla_tracks.remove(track)
 old=bpy.data.actions.get(name)
 if old:bpy.data.actions.remove(old)
 action=bpy.data.actions.new(name);rig.animation_data.action=action;positions={l:[] for l in feet};maximum_clip=0
 for frame in range(frames+1):
  scene.frame_set(frame+1)
  for bone in rig.pose.bones:bone.matrix_basis.identity();bone.rotation_mode='XYZ'
  t=frame/frames;body=rig.pose.bones['body'];body.location.y=.012+.006*(1-math.cos(math.tau*2*t))
  # Manufactured torso remains rigid; head and antennae supply intent.
  head=rig.pose.bones['head'];head.rotation_mode='XYZ';head.rotation_euler.x=.06 if name=='story_haul' else -.04
  for n,sign in [('antenna_l',1),('antenna_r',-.7)]:
   b=rig.pose.bones[n];b.rotation_mode='XYZ';b.rotation_euler.x=(-.10 if name=='story_haul' else .02)+.045*math.sin(math.tau*t)*sign
  bpy.context.view_layer.update();desired=targets(t,stride)
  wantedY={l:target.y+rest[l]['centroidY']-rest[l]['foot'].y for l,target in desired.items()}
  for l,target in desired.items():maximum_clip=max(maximum_clip,solve(l,target))
  # Bake sole corrections into the pose; the presenter only plays data.
  for iteration in range(7):
   bpy.context.view_layer.update();ev=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
   errors={}
   for l,ids in feet.items():
    floor=min((ev.matrix_world@mesh.vertices[i].co).z for i in ids)
    phase=(t+rest[l]['phase'])%1;lift=0 if phase<.5 else .15*math.sin(math.pi*(phase-.5)*2)**2
    centroid=sum((ev.matrix_world@mesh.vertices[i].co).y for i in ids)/len(ids)
    errors[l]=(lift-floor,wantedY[l]-centroid)
   ev.to_mesh_clear()
   for l,(errorZ,errorY) in errors.items():desired[l].z+=errorZ;desired[l].y+=errorY;maximum_clip=max(maximum_clip,solve(l,desired[l]))
  bpy.context.view_layer.update();ev=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
  for l,ids in feet.items():
   coords=[ev.matrix_world@mesh.vertices[i].co for i in ids]
   positions[l].append({'forward':sum(-v.y for v in coords)/len(coords),'height':min(v.z for v in coords)})
  ev.to_mesh_clear()
  for bone in rig.pose.bones:
   for prop in ('location','rotation_euler','scale'):bone.keyframe_insert(data_path=prop,frame=frame+1,group=bone.name)
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for curve in bag.fcurves:
     for key in curve.keyframe_points:key.interpolation='LINEAR'
 action.use_fake_user=True;track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,0,action);track.mute=True;rig.animation_data.action=None
 audit[name]={'frames':frames,'duration':frames/24,'nominalDistancePerCycle':stride,'maximumUnreachableTarget':maximum_clip,'feet':{l:{'forwardExcursion':max(v['forward'] for v in p)-min(v['forward'] for v in p),'minSoleHeight':min(v['height'] for v in p),'maxSoleHeight':max(v['height'] for v in p)} for l,p in positions.items()},'poses':positions}
for bone in rig.pose.bones:bone.matrix_basis.identity();bone.rotation_mode='XYZ'
scene.frame_set(0);bpy.context.view_layer.update();bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(source))
m=json.loads((HERE/'asset.json').read_text(encoding='utf-8-sig'))
for name,frames,stride in [('story_haul',32,.70),('story_creep',44,.65)]:
 m['clips']=[c for c in m['clips'] if c['name']!=name]+[{'name':name,'fps':24,'playback':'loop','duration':frames/24,'meaning':f'Baked two-link alternating-tripod gait with planted stance and lifted Hermite recovery. Nominal {stride}m visual travel/cycle; stationary root.'}]
(HERE/'asset.json').write_text(json.dumps(m,indent=2)+'\n',encoding='utf-8')
(HERE/'validation/cinematic/gait_ik_source_audit.json').write_text(json.dumps(audit,indent=2)+'\n')
print('BAKED_GAIT_AUDIT',json.dumps({n:{k:v for k,v in a.items() if k!='poses'} for n,a in audit.items()}))
