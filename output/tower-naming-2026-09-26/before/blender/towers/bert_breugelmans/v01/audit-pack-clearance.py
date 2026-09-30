"""Read-only intersection check of the head/hair against all five pack tiers."""
import bpy,json
from pathlib import Path
from mathutils.bvhtree import BVHTree
base=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
manifest=json.loads((base/'asset.json').read_text(encoding='utf-8-sig'))
rig=bpy.data.objects['bert_rig'];pack=bpy.data.objects['cohesion_pack']
role_ids=pack['palette_roles']['roles']
tier_ids={role_ids[n] for n in ('trust_green','conflict_blue','commitment_yellow','accountability_gray','results_orange')}
pack_faces=[tuple(p.vertices) for p in pack.data.polygons if round(pack.data.attributes['_palette_role'].data[p.loop_start].value) in tier_ids]
heads=[]
for obj in (bpy.data.objects['bert_skin'],bpy.data.objects['bert_hair']):
    group=obj.vertex_groups['head'].index
    ids={v.index for v in obj.data.vertices if any(g.group==group and g.weight>.99 for g in v.groups)}
    heads.append((obj,[tuple(p.vertices) for p in obj.data.polygons if all(v in ids for v in p.vertices)],ids))
results=[]
for spec in manifest['clips']:
    action=bpy.data.actions[spec['name']];rig.animation_data.action=action
    overlaps=0;nearest=100;count=0
    for frame in range(int(action.frame_range[0]),int(action.frame_range[1])+1):
        bpy.context.scene.frame_set(frame);dg=bpy.context.evaluated_depsgraph_get()
        pe=pack.evaluated_get(dg);pm=pe.to_mesh()
        pb=BVHTree.FromPolygons([pe.matrix_world@v.co for v in pm.vertices],pack_faces)
        for obj,faces,ids in heads:
            he=obj.evaluated_get(dg);hm=he.to_mesh();points=[he.matrix_world@v.co for v in hm.vertices]
            hb=BVHTree.FromPolygons(points,faces)
            overlaps+=len(pb.overlap(hb))
            nearest=min(nearest,min(pb.find_nearest(points[i])[3] for i in ids))
            he.to_mesh_clear()
        pe.to_mesh_clear();count+=1
    results.append({'clip':spec['name'],'frames':count,'triangleIntersections':overlaps,'minimumSampledHeadVertexDistanceMetres':nearest,'passed':overlaps==0})
report={'revision':manifest['revision'],'sourceHash':manifest['delivery']['sourceHash'],'runtimeHash':manifest['delivery']['sha256'],'clips':results,'passed':all(r['passed'] for r in results)}
(base/'validation/pack-clearance.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report));assert report['passed'],report
