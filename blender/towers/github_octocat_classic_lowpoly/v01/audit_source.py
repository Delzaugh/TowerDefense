"""Read-only source checks complementing the runtime visual inspection."""
import bpy,bmesh,json,sys
from pathlib import Path
project=Path(__file__).resolve().parents[4]
for style in ['classic_lowpoly']:
    folder=project/'blender'/'towers'/('github_octocat_'+style)/'v01'
    bpy.ops.wm.open_mainfile(filepath=str(folder/('github_octocat_'+style+'_v01.blend')))
    result={'style':style,'parts':{},'errors':[]}
    for name in ['head_and_ears','body_five_tentacles']:
        obj=bpy.data.objects[name];bm=bmesh.new();bm.from_mesh(obj.data)
        visited=set();components=[]
        for v in bm.verts:
            if v in visited:continue
            stack=[v];visited.add(v);n=0
            while stack:
                p=stack.pop();n+=1
                for e in p.link_edges:
                    q=e.other_vert(p)
                    if q not in visited:visited.add(q);stack.append(q)
            components.append(n)
        item={'connected_components':len(components),'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),'triangles':sum(len(f.verts)-2 for f in bm.faces),'minimum_z':min(v.co.z for v in bm.verts)}
        result['parts'][name]=item
        if len(components)!=1 or item['nonmanifold_edges']:result['errors'].append(name+' is not a single closed connected shell')
        bm.free()
    body=bpy.data.objects['body_five_tentacles']
    anatomy=list(body['anatomy_inventory']);result['appendages']=anatomy
    guide_names=[o.name for o in bpy.data.objects if o.type=='CURVE' and o.get('anatomy_role')]
    result['guide_count']=len(guide_names)
    if len(anatomy)!=5 or len(guide_names)!=5:result['errors'].append('Expected exactly five named appendages and five construction paths')
    result['contact_by_leg']={}
    for group in body.vertex_groups:
        if not group.name.startswith('foot_'):continue
        vs=[v for v in body.data.vertices if any(g.group==group.index for g in v.groups)]
        result['contact_by_leg'][group.name]=min(v.co.z for v in vs)
    result['sucker_rows']=dict(bpy.data.objects['suction_cup_rows']['row_counts'])
    result['whisker_meshes']=len([o for o in bpy.data.objects if o.name.startswith('whisker_') and o.type=='MESH'])
    result['images']=[{'name':i.name,'size':list(i.size),'packed':bool(i.packed_file)} for i in bpy.data.images if i.type=='IMAGE' and i.users]
    result['passed']=not result['errors']
    (folder/'validation'/'source_audit.json').write_text(json.dumps(result,indent=2))
    print(json.dumps(result))



