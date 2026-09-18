"""Read-only audit of the canonical Blender hand surfaces."""
import bpy,bmesh,json
from pathlib import Path
base=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
obj=bpy.data.objects['bert_skin'];result={}
for side in ('l','r'):
    groups={g.index for g in obj.vertex_groups if g.name in ('hand_'+side,'fingers_'+side,'digits_'+side,'thumb_'+side)}
    ids={v.index for v in obj.data.vertices if any(g.group in groups and g.weight>0 for g in v.groups)}
    selected_faces=[p for p in obj.data.polygons if all(i in ids for i in p.vertices)]
    bm=bmesh.new();mapping={i:bm.verts.new(obj.data.vertices[i].co) for i in ids}
    for p in selected_faces:bm.faces.new([mapping[i] for i in p.vertices])
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
    bad_edges=sum(not e.is_manifold for e in bm.edges);tiny_faces=sum(f.calc_area()<1e-10 for f in bm.faces)
    unseen=set(bm.verts);components=0
    while unseen:
        components+=1;queue=[unseen.pop()]
        while queue:
            for e in queue.pop().link_edges:
                for v in e.verts:
                    if v in unseen:unseen.remove(v);queue.append(v)
    result[side]={'vertices':len(bm.verts),'faces':len(bm.faces),'components':components,'nonmanifoldEdges':bad_edges,'zeroAreaFaces':tiny_faces,'volume':abs(bm.calc_volume()),'passed':components==1 and bad_edges==0 and tiny_faces==0}
    bm.free()
manifest=json.loads((base/'asset.json').read_text(encoding='utf-8-sig'))
report={'revision':manifest['revision'],'sourceHash':manifest['delivery']['sourceHash'],'hands':result,'passed':all(r['passed'] for r in result.values())}
(base/'validation/hand-topology.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report));assert report['passed'],report
