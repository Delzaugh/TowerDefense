import bpy,json,math
from pathlib import Path
root=Path.cwd();folder=root/'blender/enemies/problem_bug/v01'
bpy.ops.wm.open_mainfile(filepath=str(folder/'problem_bug_v01.blend'))
rig=bpy.data.objects['bug_rig'];mesh=bpy.data.objects['bug_body'];scene=bpy.context.scene
for track in rig.animation_data.nla_tracks:track.mute=True
feet={}
for g in mesh.vertex_groups:
 if g.name.endswith('_lower'):
  ids=[v.index for v in mesh.data.vertices if any(x.group==g.index and x.weight>.9 for x in v.groups)]
  zmin=min(mesh.data.vertices[i].co.z for i in ids)
  feet[g.name]=[i for i in ids if mesh.data.vertices[i].co.z<zmin+.06]
result={}
for name in ['move','story_haul']:
 action=bpy.data.actions[name];rig.animation_data.action=action;start,end=action.frame_range;positions={n:[] for n in feet}
 for f in range(int(start),int(end)+1):
  scene.frame_set(f);bpy.context.view_layer.update();ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());data=ev.to_mesh()
  for n,ids in feet.items():
   coords=[ev.matrix_world@data.vertices[i].co for i in ids]
   positions[n].append([sum(v.x for v in coords)/len(coords),sum(-v.y for v in coords)/len(coords),sum(v.z for v in coords)/len(coords)])
  ev.to_mesh_clear()
 ranges={n:{'forward_excursion':max(p[1] for p in ps)-min(p[1] for p in ps),'horizontal_excursion':math.hypot(max(p[0] for p in ps)-min(p[0] for p in ps),max(p[1] for p in ps)-min(p[1] for p in ps)),'floor_min':min(p[2] for p in ps),'floor_max':max(p[2] for p in ps)} for n,ps in positions.items()}
 result[name]={'frames':[start,end],'feet':ranges,'positions':positions}
print('GAIT_DISTANCE_AUDIT '+json.dumps({n:{'frames':v['frames'],'feet':v['feet']} for n,v in result.items()}))
(folder/'validation/cinematic/gait_distance_audit.json').write_text(json.dumps(result,indent=2))
