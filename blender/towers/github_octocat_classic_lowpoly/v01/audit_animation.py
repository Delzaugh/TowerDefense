import bpy,json,math
from pathlib import Path
from mathutils import Vector
folder=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(folder/'github_octocat_classic_lowpoly_v01.blend'))
rig=bpy.data.objects['octocat_rig'];body=bpy.data.objects['body_five_tentacles'];scene=bpy.context.scene
root=bpy.data.objects['root'];restroot=root.matrix_world.copy();errors=[]
contacts={}
for sign,label in [(-1,'left'),(1,'right')]:
    for rear in [False,True]:
        ids=[v.index for v in body.data.vertices if v.co.z<.003 and v.co.x*sign>0 and (v.co.y>.05 if rear else v.co.y<-.20)]
        assert ids
        contacts[('rear_' if rear else 'front_')+label]=ids
result={'bones':len(rig.data.bones),'clips':{},'errors':errors}
for name,frames in [('idle',60),('move',32),('wave',60),('celebrate',48)]:
    rig.animation_data.action=bpy.data.actions[name]
    minz=1e9;max_drift=0;heights=[];start=None;end=None
    for f in range(frames+1):
        scene.frame_set(f+1);bpy.context.view_layer.update();ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
        coords=[ev.matrix_world@v.co for v in mesh.vertices];minz=min(minz,min(v.z for v in coords))
        motion=rig.pose.bones['motion'].location.y
        for label,ids in contacts.items():
            for i in ids:
                foot=rig.pose.bones['foot_'+label].location
                expected=body.data.vertices[i].co+Vector((foot.x,-foot.z,motion+foot.y));max_drift=max(max_drift,(coords[i]-expected).length)
        heights.append(min(v.z for v in coords))
        if f==0:start=[v.copy() for v in coords]
        if f==frames:end=[v.copy() for v in coords]
        if any(abs(root.matrix_world[i][j]-restroot[i][j])>1e-7 for i in range(4) for j in range(4)):errors.append(name+' root motion')
        ev.to_mesh_clear()
    delta=max((a-b).length for a,b in zip(start,end))
    result['clips'][name]={'minimum_body_z':minz,'maximum_foot_drift_relative_to_hop':max_drift,'endpoint_body_delta':delta,'maximum_floor_clearance':max(heights)}
    if minz<-.002 or max_drift>.002 or delta>.002:errors.append(name+' contact or endpoint failure')
    rig.animation_data.action=None
result['passed']=not errors
(folder/'validation'/'animation_source_audit.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
assert not errors
