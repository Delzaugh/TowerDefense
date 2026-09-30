"""Independent low-poly derivative of the frozen, approved Classic revision 9."""
import bpy, bmesh, os, json, math, hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
FOLDER=Path(__file__).resolve().parent
SOURCE=FOLDER/'references'/'approved_classic_r9.blend'
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()=='a465db1907240e99c2988bcdbd2ea259417bd78f03fb042fea1a6f777be37e5a'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
root=bpy.data.objects['root']
def active(o):
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
def bvh(o):
    return BVHTree.FromPolygons([v.co.copy() for v in o.data.vertices],[list(p.vertices) for p in o.data.polygons])
def tris(o):return sum(len(p.vertices)-2 for p in o.data.polygons)
def reduce(o,budget):
    active(o);m=o.modifiers.new('Silhouette-aware low-poly reduction','DECIMATE');m.ratio=min(1,budget/tris(o));m.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=m.name)
    for p in o.data.polygons:p.use_smooth=True
head=bpy.data.objects['head_and_ears'];body=bpy.data.objects['body_five_tentacles']
oldhead=bvh(head)
reduce(head,1000);reduce(body,1200)
newhead=bvh(head);newbody=bvh(body)
def face_y(tree,x,z):
    hit=tree.ray_cast(Vector((x,-4,z)),Vector((0,1,0)))
    return hit[0].y if hit[0] is not None else None
# Reduce face details, then follow the reduced skull so none sink through it.
for o in list(root.children):
    if o.type!='MESH' or o in [head,body] or o.name=='suction_cup_rows':continue
    target=64 if o.name.startswith('eye_') else 48 if o.name=='nose' else 24 if o.name.startswith('whisker_') else 80
    reduce(o,target)
    if o.name.startswith('eye_') or o.name in ['smile','nose']:
        for v in o.data.vertices:
            old=face_y(oldhead,v.co.x,v.co.z);new=face_y(newhead,v.co.x,v.co.z)
            if old is not None and new is not None:v.co.y+=new-old
            # Independent coarse eye triangulations need enough separation
            # to keep white triangles from piercing the iris between vertices.
            if o.name.startswith('eye_iris_'):v.co.y-=.010
# Replace each dense suction cup with a deliberately constructed 6-sided cup.
# Preserve every cup's position and row rather than decimating small disconnected islands.
old=bpy.data.objects['suction_cup_rows'];bm=bmesh.new();bm.from_mesh(old.data)
seen=set();components=[]
for v in bm.verts:
    if v in seen:continue
    stack=[v];seen.add(v);comp=[]
    while stack:
        p=stack.pop();comp.append(p)
        for e in p.link_edges:
            q=e.other_vert(p)
            if q not in seen:seen.add(q);stack.append(q)
    components.append(comp)
vv=[];ff=[];sides=6
for comp in components:
    boundary=[v for v in comp if any(e.is_boundary for e in v.link_edges)]
    assert len(boundary)==16
    center=sum((v.co for v in boundary),Vector())/len(boundary)
    normal=sum((f.normal*f.calc_area() for f in {f for v in comp for f in v.link_faces}),Vector()).normalized()
    nearest=newbody.find_nearest(center)
    seat,n=nearest[0],nearest[1]
    if n.dot(normal)<0:n=-n
    side=(boundary[0].co-center).normalized();side=(side-n*side.dot(n)).normalized();up=n.cross(side).normalized()
    radius=sum((v.co-center).length for v in boundary)/len(boundary)
    base=len(vv)
    for r,depth in [(1,-.004),(.72,.012)]:
        for j in range(sides):
            a=math.tau*j/sides;vv.append(tuple(seat+n*depth+(side*math.cos(a)+up*math.sin(a))*radius*r))
    vv.append(tuple(seat+n*.002))
    for j in range(sides):
        k=(j+1)%sides
        ff.append((base+j,base+k,base+sides+k,base+sides+j));ff.append((base+sides+j,base+sides+k,base+sides*2))
bm.free()
data=bpy.data.meshes.new('lowpoly_suction_cups');data.from_pydata(vv,[],ff);data.update()
data.materials.append(old.data.materials[0]);uv=data.uv_layers.new(name='PaletteUV')
for item in uv.data:item.uv=(18/32,.5)
for p in data.polygons:p.use_smooth=True
old.data=data
# Keep the painted face, with half the source texture resolution.
for img in bpy.data.images:
    if img.type=='IMAGE' and img.users and img.size[0]>512:
        img.scale(512,512);img.name='octocat_classic_lowpoly_face_512';img.pack()
# Preserve zero-height contacts after reduction.
for v in body.data.vertices:
    if v.co.z<.002:v.co.z=0
root['production_status']='Low-poly Classic derived from approved r9. Static; nine accessory anchors retained.'
root['source_variant']='github_octocat_classic/v01/revision9'
objects=[o for o in root.children if o.type=='MESH']
stats={'triangles':sum(tris(o) for o in objects),'meshes':len(objects),'parts':{o.name:tris(o) for o in objects},'suction_cups':len(components),'total_appendages':5,'supporting_legs':4,'tails':1,'source_revision':9}
assert stats['triangles']<=3500 and len(components)==45
OUT=Path(os.environ.get('ASSET_BUILD_DIR',str(FOLDER)));OUT.mkdir(parents=True,exist_ok=True)
# Match Copilot's verified rest height with baked geometry and attachment scale.
target_height=1.8002899885177612
source_height=max(v.co.z for o in objects for v in o.data.vertices)
unit_scale=target_height/source_height
for o in objects:
    for v in o.data.vertices:v.co*=unit_scale
for o in root.children:
    if o.type=='EMPTY':o.location*=unit_scale
for o in bpy.data.objects:
    if o.type=='CURVE' and o.get('anatomy_role'):
        for spline in o.data.splines:
            for p in spline.points:
                p.co.x*=unit_scale;p.co.y*=unit_scale;p.co.z*=unit_scale
stats.update(height=target_height,scale_from_approved=unit_scale,bones=11,clips=['idle','move','wave','celebrate'])
(OUT/'authoring_stats.json').write_text(json.dumps(stats,indent=2))
import runpy
runpy.run_path(str(FOLDER/'animate.py'),init_globals={'UNIT_SCALE':unit_scale})
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ.get('ASSET_SOURCE_NAME','github_octocat_classic_lowpoly_v01.blend')))
print(json.dumps(stats))
