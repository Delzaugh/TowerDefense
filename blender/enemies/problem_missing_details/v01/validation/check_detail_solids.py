"""Inspect the saved paper shell, fold and embossed glyph as one solid."""
import bpy,bmesh,json,hashlib
from pathlib import Path
obj=bpy.data.objects['missing_details'];mesh=obj.data
part=next(p for p in json.loads(obj['part_ranges']) if p['name']=='note_body')
indices=set(range(part['start'],part['start']+part['count']))
bm=bmesh.new();mapping={i:bm.verts.new(mesh.vertices[i].co) for i in indices}
for face in mesh.polygons:
    if all(i in indices for i in face.vertices):bm.faces.new([mapping[i] for i in face.vertices])
nonmanifold=sum(not e.is_manifold for e in bm.edges)
left=set(bm.verts);components=0
while left:
    components+=1;todo=[left.pop()]
    while todo:
        vert=todo.pop()
        for e in vert.link_edges:
            other=e.other_vert(vert)
            if other in left:left.remove(other);todo.append(other)
ink_id=int(obj['palette_roles']['roles']['ink'])
role=mesh.attributes['_palette_role'];ink=[]
for face in mesh.polygons:
    if round(role.data[face.loop_start].value)==ink_id:
        ink.extend(mesh.vertices[i].co for i in face.vertices)
raised=-min(v.y for v in ink)-.1
result={'sourceHash':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),
        'paperFoldAndGlyphComponents':components,'nonManifoldEdges':nonmanifold,
        'paperSolidVolume':bm.calc_volume(signed=True),'embossHeightMetres':raised,
        'embossAt100mmSeatedPrintMm':raised/1.2187163829803467*100,
        'scope':'Paper shell, recessed eyes, solid fold and question-mark emboss only. Articulated limbs and a whole-figure print/slicer check are outside this solid audit.'}
assert components==1 and nonmanifold==0 and result['paperSolidVolume']>0
assert abs(raised-.012)<1e-5
bm.free()
Path(__file__).with_name('detail-solids-report.json').write_text(json.dumps(result,indent=2))
print('DETAIL_SOLIDS',json.dumps(result))
