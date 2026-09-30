import bpy,bmesh,json,hashlib
from pathlib import Path
folder=Path(__file__).resolve().parents[1]
source=folder/'copilot_octocat_2_0_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
root=bpy.data.objects['root'];parts={}
for name in ['head_and_ears','body_five_tentacles']:
    obj=bpy.data.objects[name];bm=bmesh.new();bm.from_mesh(obj.data)
    nonmanifold=sum(not e.is_manifold for e in bm.edges)
    tiny=sum(f.calc_area()<1e-12 for f in bm.faces)
    seen=set();components=0
    for v in bm.verts:
        if v in seen:continue
        components+=1;stack=[v];seen.add(v)
        while stack:
            p=stack.pop()
            for e in p.link_edges:
                q=e.other_vert(p)
                if q not in seen:seen.add(q);stack.append(q)
    parts[name]={'nonmanifold_edges':nonmanifold,'degenerate_faces':tiny,'components':components,'vertices':len(bm.verts)}
    bm.free()
    assert nonmanifold==0 and tiny==0 and components==1,parts[name]
body=bpy.data.objects['body_five_tentacles'];contacts={}
for name in ['leg_left','leg_right','leg_rear']:
    group=body.vertex_groups[name]
    vertices=[v for v in body.data.vertices if any(g.group==group.index for g in v.groups)]
    contacts[name]=min(v.co.z for v in vertices)
    assert abs(contacts[name])<.002
paths=[o for o in bpy.data.objects if o.type=='CURVE' and o.get('anatomy_role')]
assert len(paths)==5 and len(root['anatomy_inventory'])==5
assert root['supporting_legs']==3 and root['tails']==0
assert all(name!='tail_rear' for name in root['anatomy_inventory'])
assert dict(bpy.data.objects['suction_cup_rows']['row_counts'])=={name:5 for name in root['anatomy_inventory']}
images=[i for i in bpy.data.images if i.users and i.type=='IMAGE']
assert len(images)==2 and all(i.packed_file for i in images)
report={'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),'parts':parts,'contacts':contacts,'appendages':list(root['anatomy_inventory']),'packed_images':[{'name':i.name,'size':list(i.size)} for i in images],'passed':True}
(folder/'validation/source_audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
