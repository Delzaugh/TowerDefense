import bpy,bmesh,json,hashlib
from pathlib import Path
base=Path(__file__).parent
def other_pack_faces(o):
    role=o.data.attributes[o['palette_roles']['attribute']];teal=o['palette_roles']['roles']['teal']
    return sorted((round(role.data[p.loop_start].value),tuple(sorted(tuple(round(c,7) for c in o.data.vertices[i].co) for i in p.vertices)))
                  for p in o.data.polygons if round(role.data[p.loop_start].value)!=teal)
bpy.ops.wm.open_mainfile(filepath=str(base/'revisions/r26_before_work_and_straps/bert_breugelmans_v01.blend'))
baseline=other_pack_faces(bpy.data.objects['cohesion_pack'])
bpy.ops.wm.open_mainfile(filepath=str(base/'bert_breugelmans_v01.blend'))
o=bpy.data.objects['cohesion_pack'];attr=o.data.attributes[o['palette_roles']['attribute']];teal=o['palette_roles']['roles']['teal']
faces=[p for p in o.data.polygons if round(attr.data[p.loop_start].value)==teal]
bm=bmesh.new();ids={i for p in faces for i in p.vertices};mapping={i:bm.verts.new(o.data.vertices[i].co) for i in ids}
for p in faces:bm.faces.new([mapping[i] for i in p.vertices])
unseen=set(bm.verts);components=0
while unseen:
    components+=1;queue=[unseen.pop()]
    while queue:
        for e in queue.pop().link_edges:
            for v in e.verts:
                if v in unseen:unseen.remove(v);queue.append(v)
nonmanifold=sum(not e.is_manifold for e in bm.edges);zero=sum(f.calc_area()<1e-10 for f in bm.faces)
same=baseline==other_pack_faces(o)
result={'sourceHash':hashlib.sha256((base/'bert_breugelmans_v01.blend').read_bytes()).hexdigest(),
        'strapComponents':components,'nonmanifoldEdges':nonmanifold,'zeroAreaFaces':zero,
        'otherPackFacesAndColorsUnchanged':same,'passed':components==2 and nonmanifold==0 and zero==0 and same}
bm.free();(base/'validation/strap-topology.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result));assert result['passed']
