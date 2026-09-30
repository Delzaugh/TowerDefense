"""Animate the accepted Security r15 source without rebuilding its geometry."""
import bpy,os,json,math,hashlib
from pathlib import Path
from mathutils import Vector,Matrix,Euler

HERE=Path(__file__).resolve().parent
m=json.loads(Path(os.environ.get('ASSET_MANIFEST',HERE/'asset.json')).read_text())
BASE=HERE/'revisions/r15_approved_model_before_animation/copilot_security_v01.blend'
assert hashlib.sha256(BASE.read_bytes()).hexdigest()==m['animationHandoff']['sourceHash']
bpy.ops.wm.open_mainfile(filepath=str(BASE))
scene=bpy.context.scene;scene.render.fps=24
root=bpy.data.objects['root'];obj=bpy.data.objects['security_model'];me=obj.data

def art_signature():
 values={'vertices':[list(v.co) for v in me.vertices],'faces':[list(p.vertices) for p in me.polygons],
         'materials':[p.material_index for p in me.polygons],'smooth':[p.use_smooth for p in me.polygons],
         'sharp':[e.use_edge_sharp for e in me.edges],'uv':[list(l.uv) for l in me.uv_layers.active.data],
         'normals':[list(n.vector) for n in me.corner_normals]}
 return hashlib.sha256(json.dumps(values,sort_keys=True).encode()).hexdigest()
signature=art_signature()
anchors={n:bpy.data.objects[n].matrix_world.copy() for n in m['contract']['anchors']}
parts={}
for group in obj.vertex_groups:
 ids=[v.index for v in me.vertices if any(g.group==group.index for g in v.groups)]
 if group.name.startswith('display_eye'):
  center=sum((me.vertices[i].co for i in ids),Vector())/len(ids)
  parts['display_l' if center.x<0 else 'display_r']=(ids,center)
scanner_groups={g.index for g in obj.vertex_groups if (g.name.startswith('scanner_') or g.name=='faceted_scanner_housing') and g.name!='scanner_fitted_saddle'}
ids=[v.index for v in me.vertices if any(g.group in scanner_groups for g in v.groups)]
housing=obj.vertex_groups['faceted_scanner_housing'].index
housing_ids=[v.index for v in me.vertices if any(g.group==housing for g in v.groups)]
center=sum((me.vertices[i].co for i in housing_ids),Vector())/len(housing_ids)
parts['scanner']=(ids,center)
assert len(parts)==3 and all(ids for ids,_ in parts.values())

arm=bpy.data.armatures.new('security_skeleton');rig=bpy.data.objects.new('security_rig',arm)
scene.collection.objects.link(rig);rig.parent=root
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
pivot=Vector((0,0,1.15))
body=arm.edit_bones.new('body');body.head=pivot;body.tail=pivot+Vector((0,.2,0))
for name,(_,center) in parts.items():
 bone=arm.edit_bones.new(name);bone.head=center;bone.tail=center+Vector((0,.15,0));bone.parent=body
bpy.ops.object.mode_set(mode='OBJECT')
used=set()
for name,(ids,_) in parts.items():obj.vertex_groups.new(name=name).add(ids,1,'REPLACE');used.update(ids)
obj.vertex_groups.new(name='body').add([v.index for v in me.vertices if v.index not in used],1,'REPLACE')
obj.parent=rig
modifier=obj.modifiers.new('Rigid shell scanner and independent display','ARMATURE');modifier.object=rig
modifier.use_deform_preserve_volume=False
bpy.context.view_layer.update()
for name,bone in [('anchor_action','scanner'),('anchor_target','body')]:
 anchor=bpy.data.objects[name];world=anchor.matrix_world.copy()
 anchor.parent=rig;anchor.parent_type='BONE';anchor.parent_bone=bone
 bpy.context.view_layer.update();anchor.matrix_world=world;bpy.context.view_layer.update()
rest={b.name:b.matrix_local.copy() for b in arm.bones}
for pb in rig.pose.bones:pb.rotation_mode='QUATERNION'

def smooth(t):
 t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)
def pulse(t,start,peak,end):
 if t<start or t>end:return 0.
 return smooth((t-start)/(peak-start)) if t<peak else 1-smooth((t-peak)/(end-peak))
def around(center,rotation):
 return Matrix.Translation(center)@Euler(rotation,'XYZ').to_matrix().to_4x4()@Matrix.Translation(-center)
READY=.16
frames={'idle':60,'work':48,'move':48,'place':30,'hit':14,'resolve':30}

def pose(name,t):
 wave=math.sin(math.tau*t);envelope=(1-math.cos(math.tau*t))/2
 lift=READY;pitch=roll=yaw=back=scan_yaw=scan_pitch=0.;eye_height=1.
 if name=='idle':
  lift+=.014*wave;roll=.006*wave
  eye_height-=.88*pulse(t,.65,.71,.78)
 elif name=='work':
  yaw=.065*wave;pitch=.025*envelope
  scan_yaw=.115*wave;scan_pitch=.045*math.sin(2*math.tau*t)
  eye_height-=.20*envelope
 elif name=='move':
  lift+=.022*wave;pitch=.085*envelope;roll=.018*wave
  yaw=.016*wave;eye_height-=.10*envelope
 elif name=='hit':
  recoil=pulse(t,0,.20,1);settle=pulse(t,.48,.67,1)
  pitch=-.115*recoil+.022*settle;roll=.042*recoil;back=.045*recoil;lift+=.028*recoil
  eye_height-=.72*recoil;scan_pitch=-.018*recoil
 elif name in ('place','resolve'):
  progress=1-t if name=='place' else t
  eye_height=1-.92*smooth(progress/.55)
 deformation=Matrix.Translation((0,back,lift))@around(pivot,(pitch,roll,yaw))
 rig.pose.bones['body'].matrix=deformation@rest['body']
 bpy.context.view_layer.update()
 for bone_name,(_,center) in parts.items():
  if bone_name=='scanner':local=around(center,(scan_pitch,0,scan_yaw))
  else:
   # Blink clears the curved display while leaving the accepted rest unchanged.
   local=Matrix.Translation((0,-.014*(1-eye_height),0))@Matrix.Translation(center)@Matrix.Diagonal((1,1,eye_height,1))@Matrix.Translation(-center)
  rig.pose.bones[bone_name].matrix=deformation@local@rest[bone_name]

rig.animation_data_create()
for name,length in frames.items():
 action=bpy.data.actions.new(name);rig.animation_data.action=action
 for f in range(length+1):
  pose(name,f/length)
  for pb in rig.pose.bones:
   for prop in ('location','rotation_quaternion','scale'):pb.keyframe_insert(data_path=prop,frame=f,group=pb.name)
 action.use_fake_user=True
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for curve in bag.fcurves:
     for key in curve.keyframe_points:key.interpolation='LINEAR'
 track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,0,action);track.mute=True
 rig.animation_data.action=None

minimum={}
for name in frames:
 heights=[]
 for sample in range(97):
  pose(name,sample/96);bpy.context.view_layer.update()
  evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());skin=evaluated.to_mesh()
  heights.append(min((evaluated.matrix_world@v.co).z for v in skin.vertices));evaluated.to_mesh_clear()
 minimum[name]=min(heights)
 assert minimum[name]>.06,(name,minimum[name])
for pb in rig.pose.bones:pb.matrix_basis=Matrix.Identity(4)
scene.frame_set(0);scene.frame_end=60;bpy.context.view_layer.update()
assert art_signature()==signature,'Accepted rest art, normals or UVs changed'
for name,world in anchors.items():assert (bpy.data.objects[name].matrix_world.translation-world.translation).length<1e-6,(name,bpy.data.objects[name].matrix_world.translation,world.translation)
root['resolve_effect']=m['presentation']['resolve']
root['animation_status']='six baseline clips; fixed model acceptance r15'
rig['motion_design']='Rigid body and scanner; independent display eyes; .16 m ready hover; stationary simulation root'
for ob in [root,*root.children_recursive]:
 if ob.animation_data:
  ob.animation_data.action=None
  for track in ob.animation_data.nla_tracks:track.mute=True
output=Path(os.environ.get('ASSET_BUILD_DIR',str(HERE)));output.mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(output/os.environ.get('ASSET_SOURCE_NAME','copilot_security_v01.blend')))
report={'acceptedModelSourceHash':m['animationHandoff']['sourceHash'],'restArtSignature':signature,'restArtPreserved':True,'bones':4,'readyHoverMetres':READY,'sampledMinimumClearance':minimum,'clips':{name:{'duration':length/24,'fps':24} for name,length in frames.items()}}
(output/'animation_source.json').write_text(json.dumps(report,indent=2)+'\n')
print('SECURITY_ANIMATION',json.dumps(report))
