"""Check the torso solid in both saved Blender source and delivered GLB."""
import bpy,bmesh,json,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

folder=Path(__file__).resolve().parent.parent
project=folder.parents[3]
manifest=json.loads((folder/'asset.json').read_text(encoding='utf-8-sig'))
source=project/manifest['source']['path'];runtime=project/manifest['runtime']

def inspect(obj):
    group=obj.vertex_groups['body'].index
    ids={v.index for v in obj.data.vertices if any(g.group==group and g.weight>.9999 for g in v.groups)}
    bm=bmesh.new();mapping={i:bm.verts.new(obj.data.vertices[i].co) for i in ids}
    for p in obj.data.polygons:
        if all(i in ids for i in p.vertices):bm.faces.new([mapping[i] for i in p.vertices])
    # GLB splits vertices along hard normals/colors. Weld coincident positions
    # only within this one rigid torso before inspecting geometric connectivity.
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
    nonmanifold=sum(not e.is_manifold for e in bm.edges)
    components=0;remaining=set(bm.verts)
    while remaining:
        components+=1;todo=[remaining.pop()]
        while todo:
            vert=todo.pop()
            for edge in vert.link_edges:
                other=edge.other_vert(vert)
                if other in remaining:remaining.remove(other);todo.append(other)
    bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.verts.index_update();bm.faces.index_update()
    tree=BVHTree.FromBMesh(bm)
    triangles=[{v.index for v in f.verts} for f in bm.faces]
    intersections=[(a,b) for a,b in tree.overlap(tree) if a<b and not triangles[a]&triangles[b]]
    result={'verticesAfterWeld':len(bm.verts),'triangles':len(bm.faces),
            'components':components,'nonManifoldEdges':nonmanifold,
            'zeroAreaTriangles':sum(f.calc_area()<1e-10 for f in bm.faces),
            'signedVolume':bm.calc_volume(signed=True),'nonAdjacentSurfaceIntersections':intersections}
    assert components==1 and nonmanifold==0 and not intersections and result['zeroAreaTriangles']==0,result
    assert result['signedVolume']>0,result
    bm.free()
    return result

obj=bpy.data.objects['bug_body']
source_result=inspect(obj)
# Verify the red groove is a shared-vertex part of the shell, with thickness
# down to the belly rather than an unsupported sheet inside an open slit.
data=obj.data;body=obj.vertex_groups['body'].index
red_id=int(obj['palette_roles']['roles']['red']);role=data.attributes['_palette_role']
data.calc_loop_triangles()
body_faces=[p for p in data.polygons if all(any(g.group==body and g.weight>.9999 for g in data.vertices[i].groups) for i in p.vertices)]
torso_ids={i for p in body_faces for i in p.vertices}
tree=BVHTree.FromPolygons([v.co for v in data.vertices],[tuple(p.vertices) for p in body_faces],all_triangles=False)
samples=[]
for p in body_faces:
    if round(role.data[p.loop_start].value)!=red_id:continue
    center=sum((data.vertices[i].co for i in p.vertices),Vector())/len(p.vertices)
    hit,normal,index,distance=tree.ray_cast(center-Vector((0,0,.00001)),Vector((0,0,-1)))
    assert hit is not None and distance>.02,'Groove floor must have body material beneath it'
    samples.append(distance)
assert len(samples)==10,len(samples)
source_result['redFloorTriangles']=len(samples)
source_result['minimumBackingDepthMetres']=min(samples)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(runtime))
exported=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.vertex_groups.get('body'))
runtime_result=inspect(exported)
result={'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),
        'runtimeHash':hashlib.sha256(runtime.read_bytes()).hexdigest(),
        'source':source_result,'runtime':runtime_result,
        'scope':'Torso including shell, groove walls/floor, rim and belly. Separate articulated head, antennae and legs are outside this watertightness assertion.'}
(folder/'validation/closed-carapace-report.json').write_text(json.dumps(result,indent=2))
print('CLOSED_CARAPACE',json.dumps(result))
