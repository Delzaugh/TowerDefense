"""Sample exterior casing intersections; intentional core/socket contact excluded."""
import bpy,json,hashlib,os
from pathlib import Path
from mathutils.bvhtree import BVHTree
o=bpy.data.objects['missing_details'];rig=bpy.data.objects['missing_details_rig'];scene=bpy.context.scene
parts=json.loads(o['part_ranges']);o.data.calc_loop_triangles()
groups={}
for p in parts:
 ids=set(range(p['start'],p['start']+p['count']))
 groups[(p['name'],p['bone'])]=[tuple(t.vertices) for t in o.data.loop_triangles if all(i in ids for i in t.vertices)]
pairs=[]
for side in ['l','r']:
 for part,bone in [('upper_arm','arm_'),('forearm','forearm_'),('thigh','thigh_'),('shin','shin_')]:
  pairs.append((('note_body','paper'),(part,bone+side)))
 pairs.append((('upper_arm','arm_'+side),('forearm','forearm_'+side)))
 pairs.append((('thigh','thigh_'+side),('shin','shin_'+side)))
failures=[];samples=0
for clip in [None]+list(rig.animation_data.nla_tracks):
 for track in rig.animation_data.nla_tracks:track.mute=True
 rig.animation_data.action=clip.strips[0].action if clip else None
 if clip:rig.animation_data.action_slot=rig.animation_data.action.slots[0]
 else:
  for bone in rig.pose.bones:
   bone.location=(0,0,0);bone.rotation_euler=(0,0,0);bone.scale=(1,1,1)
 end=int(clip.strips[0].frame_end) if clip else 1
 for frame in range(1,end+1):
  scene.frame_set(frame);bpy.context.view_layer.update()
  evaluated=o.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
  vertices=[v.co.copy() for v in mesh.vertices]
  bvhs={key:BVHTree.FromPolygons(vertices,tris,all_triangles=True) for key,tris in groups.items() if tris}
  for a,b in pairs:
   if bvhs[a].overlap(bvhs[b]):failures.append({'clip':clip.name if clip else 'rest','frame':frame,'parts':[a,b]})
  evaluated.to_mesh_clear();samples+=1
out={'sourceHash':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),'sampledFrames':samples,'pairsPerFrame':len(pairs),'surfaceIntersections':failures,'scope':'Exterior paper, arm and leg casings only. Hidden stems and mating pivots intentionally overlap inside sockets.'}
Path(__file__).with_name(os.environ.get('JOINT_REPORT','joint-clearance.json')).write_text(json.dumps(out,indent=2))
print('JOINT_CLEARANCE',json.dumps(out))
