"""Read-only source topology evidence; it does not establish visual acceptance."""
import bpy,bmesh,json,hashlib
from pathlib import Path
p=Path(__file__).resolve().parent.parent
source=p/'copilot_developer_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
obj=bpy.data.objects['developer_model'];mesh=obj.data;mesh.calc_loop_triangles()
bm=bmesh.new();bm.from_mesh(mesh)
groups={g.index:g.name for g in obj.vertex_groups}
membership={v.index:groups[v.groups[0].group] for v in mesh.vertices if v.groups}
parts={name:0 for name in groups.values()}
degenerate={}
for tri in mesh.loop_triangles:
    names={membership.get(v,'ungrouped') for v in tri.vertices}
    key=next(iter(names)) if len(names)==1 else 'shared_boundary'
    parts[key]=parts.get(key,0)+1
    if tri.area<1e-10:degenerate[key]=degenerate.get(key,0)+1
report={'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'triangles':len(mesh.loop_triangles),'vertices':len(mesh.vertices),
        'boundaryEdges':sum(e.is_boundary for e in bm.edges),
        'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),
        'looseVertices':sum(not v.link_edges for v in bm.verts),
        'zeroAreaTriangles':sum(t.area<1e-10 for t in mesh.loop_triangles),
        'parts':parts,'degenerateByPart':degenerate,
        'limits':'Closed-solid checks do not detect all intersections or establish reference fidelity.'}
bm.free()
(p/'validation/geometry_review.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
