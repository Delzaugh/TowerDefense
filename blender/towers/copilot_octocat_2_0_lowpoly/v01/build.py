"""Pinned UV-corrected Octocat 2.0 r8, reduced by region; shared pipeline owns export."""
import bpy, bmesh, json, os, hashlib, math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
FOLDER=Path(__file__).resolve().parent
OUT=Path(os.environ.get('ASSET_BUILD_DIR',str(FOLDER)));OUT.mkdir(parents=True,exist_ok=True)
INPUT=FOLDER/'references/octocat_2_0_uv_corrected_r8.blend'
EXPECTED='c0c000b5b12d0380bdaeb54904fb92b2428912519e10ab09263e70c110eec8cb'
if hashlib.sha256(INPUT.read_bytes()).hexdigest()!=EXPECTED:raise RuntimeError('Pinned sculpt changed')
bpy.ops.wm.open_mainfile(filepath=str(INPUT))
root=bpy.data.objects['root'];head=bpy.data.objects['head_and_ears'];body=bpy.data.objects['body_five_tentacles']
def bvh(obj):return BVHTree.FromPolygons([v.co for v in obj.data.vertices],[list(p.vertices) for p in obj.data.polygons])
def count(obj):return sum(len(p.vertices)-2 for p in obj.data.polygons)
def active(obj):
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
def reduce(obj,target,symmetry=False):
    active(obj);mod=obj.modifiers.new('Region silhouette reduction','DECIMATE');mod.ratio=min(1,target/count(obj));mod.use_collapse_triangulate=True
    mod.use_symmetry=symmetry;mod.symmetry_axis='X';bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in obj.data.polygons:p.use_smooth=True
oldhead=bvh(head)
reduce(head,1430,True);reduce(body,1200)
newhead=bvh(head);newbody=bvh(body)
# Reapply the projection after reduction instead of interpolating across the
# painted-face/fur seam. Back-facing and rear-half polygons use one fur texel.
projection=head['face_uv_projection'];uv=head.data.uv_layers.active
for polygon in head.data.polygons:
    front=polygon.center.y<projection['split_y'] and polygon.normal.y<0
    for li in polygon.loop_indices:
        p=head.data.vertices[head.data.loops[li].vertex_index].co
        uv.data[li].uv=(p.x*projection['u_scale']+projection['u_offset'],p.z*projection['v_scale']+projection['v_offset']) if front else projection['fur_uv']
def clearance_shift(vertices,faces,tree,normal,clearance=.001):
    # A fitted coarse triangle can cut a skin ridge between seated vertices.
    # Measure its interior and edge midpoints, then lift the complete patch.
    lift=0
    for face in faces:
        for k in range(1,len(face)-1):
            a,b,c=[Vector(vertices[j]) for j in (face[0],face[k],face[k+1])]
            for p in [(a+b+c)/3,(a+b)/2,(b+c)/2,(c+a)/2,a,b,c]:
                hit=tree.ray_cast(p+normal*.08,-normal,.16)
                if hit[0] is not None:lift=max(lift,(hit[0]-p).dot(normal)+clearance)
    return normal*max(0,lift)
budgets={
 'nose':48,'smile_open':72,'smile_tongue':24,
 'eye_white_':100,'eye_iris_':70,'eye_glint_small_':8,'eye_glint_':12,
 'inner_ear_':40,'whisker_':32
}
face_names=[]
for obj in list(root.children):
    if obj.type!='MESH' or obj in (head,body) or obj.name=='suction_cup_rows':continue
    budget=next((n for prefix,n in budgets.items() if obj.name.startswith(prefix)),None)
    if budget is None:raise RuntimeError('Missing region budget '+obj.name)
    reduce(obj,budget)
    # Preserve each fitted surface's original relief after simplifying the skull.
    for v in obj.data.vertices:
        if obj.name.startswith('whisker_'):continue
        old=oldhead.ray_cast(Vector((v.co.x,-4,v.co.z)),Vector((0,1,0)))
        new=newhead.ray_cast(Vector((v.co.x,-4,v.co.z)),Vector((0,1,0)))
        if old[0] is not None and new[0] is not None:v.co.y+=new[0].y-old[0].y
        else:
            old=oldhead.find_nearest(v.co);new=newhead.find_nearest(v.co)
            relief=max(.001,(v.co-old[0]).dot(old[1]));v.co=new[0]+new[1]*relief
    face_names.append(obj.name)
# Keep the reduced mouth/tongue patches wholly outside the faceted cheek.
for name in ['smile_open','smile_tongue']:
    obj=bpy.data.objects[name]
    shift=clearance_shift([v.co for v in obj.data.vertices],[list(p.vertices) for p in obj.data.polygons],newhead,Vector((0,-1,0)),.0015)
    for v in obj.data.vertices:v.co+=shift
# Replace each tiny multi-ring cup by one octagonal rim and one inset centre.
cups=bpy.data.objects['suction_cup_rows'];material=cups.data.materials[0]
bm=bmesh.new();bm.from_mesh(cups.data);seen=set();components=[]
for seed in bm.verts:
    if seed in seen:continue
    comp=[];stack=[seed];seen.add(seed)
    while stack:
        v=stack.pop();comp.append(v)
        for e in v.link_edges:
            other=e.other_vert(v)
            if other not in seen:seen.add(other);stack.append(other)
    components.append(comp)
if len(components)!=25:raise RuntimeError('Expected exactly 25 source cups')
vv=[];ff=[]
for comp in components:
    outer=[v for v in comp if any(e.is_boundary for e in v.link_edges)]
    centre=sum((v.co for v in outer),Vector())/len(outer)
    polys=set(f for v in comp for f in v.link_faces)
    normal=sum((f.normal*f.calc_area() for f in polys),Vector()).normalized()
    # Use original outward skin normal to disambiguate the shallow annulus.
    hit=newbody.find_nearest(centre)
    if normal.dot(hit[1])<0:normal=-normal
    side=(outer[0].co-centre);side=(side-normal*side.dot(normal)).normalized()
    along=normal.cross(side).normalized();radius=max((v.co-centre).length for v in outer)
    start=len(vv)
    for ratio,lift in [(1,.0006),(.70,.0038)]:
        for j in range(8):
            a=math.tau*j/8;p=centre+(side*math.cos(a)+along*math.sin(a))*radius*ratio
            # Ray-project every ring sample to the simplified skin, preserving seats.
            skin=newbody.ray_cast(p+normal*.04,-normal,.12)
            if skin[0] is None:skin=newbody.find_nearest(p)
            vv.append(tuple(skin[0]+skin[1]*lift))
    skin=newbody.find_nearest(centre);vv.append(tuple(skin[0]+skin[1]*.0008))
    for j in range(8):
        k=(j+1)%8;ff.extend([(start+j,start+k,start+8+k,start+8+j),(start+8+j,start+8+k,start+16)])
    shift=clearance_shift(vv,ff[-16:],newbody,normal,.0015)
    for j in range(start,len(vv)):vv[j]=tuple(Vector(vv[j])+shift)
bm.free()
data=bpy.data.meshes.new('Octagonal suction cups');data.from_pydata(vv,[],ff);data.update();cups.data=data;data.materials.append(material)
uv=data.uv_layers.new(name='PaletteUV')
for item in uv.data:item.uv=(18/40,.5)
for p in data.polygons:p.use_smooth=True
cups['cup_topology']='8-sided rim with shallow inset centre; 24 triangles each'
# Retain the three existing foot contact patches after collapse.
feet=[(-.32,-.34),(.32,-.34),(0,.55)]
# Positions are uniformly scaled in the pinned sculpt; use retained path tips.
guides=bpy.data.collections['Anatomy construction paths - not exported']
foot_centres=[]
for name in ['leg_left','leg_right','leg_rear']:
    points=[Vector(p.co[:3]) for p in bpy.data.objects[name+'_path'].data.splines[0].points]
    foot_centres.append(points[-12])
def region(p):return min(range(3),key=lambda i:(p.x-foot_centres[i].x)**2+(p.y-foot_centres[i].y)**2)
mins=[min(v.co.z for v in body.data.vertices if v.co.z<.15 and region(v.co)==i) for i in range(3)]
for obj in [body,cups]:
    for v in obj.data.vertices:
        if v.co.z<.20:
            t=max(0,min(1,(v.co.z-.08)/.12));v.co.z-=mins[region(v.co)]*(1-t*t*(3-2*t))
root['production_status']='Octocat 2.0 low poly; static model, animation pending'
root['lowpoly_target_triangles']=4000;root['derived_from_revision']=8
objects=[o for o in root.children if o.type=='MESH']
total=sum(count(o) for o in objects)
if total>4000:raise RuntimeError('Triangle budget exceeded: '+str(total))
parts={}
for obj in [head,body]:
    bm=bmesh.new();bm.from_mesh(obj.data)
    parts[obj.name]={'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),'degenerate_faces':sum(f.calc_area()<1e-12 for f in bm.faces)}
    if any(parts[obj.name].values()):raise RuntimeError('Invalid reduced shell: '+str(parts))
    bm.free()
stats={'triangles':total,'mesh_triangles':{o.name:count(o) for o in objects},'cup_count':25,'cup_triangles':count(cups),'parts':parts,'contacts':{n:min(v.co.z for v in body.data.vertices if v.co.z<.15 and region(v.co)==i) for i,n in enumerate(['left','right','rear'])},'input_sha256':EXPECTED,'anatomy':{'tentacles':5,'arms':2,'supports':3,'tails':0}}
# Consolidate the semantic palette into one mesh while keeping named part groups
# for editing. The head's painted face map remains a separate material/mesh.
palette_objects=[o for o in objects if o!=head]
for obj in palette_objects:
    group=obj.vertex_groups.new(name='part_'+obj.name);group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
bpy.ops.object.select_all(action='DESELECT')
for obj in palette_objects:obj.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.object.join();body.name='octocat_features'
stats['runtime_meshes']=2;stats['source_parts']='Named part_* vertex groups retain the 19 palette components'
(OUT/'authoring_stats.json').write_text(json.dumps(stats,indent=2))
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ.get('ASSET_SOURCE_NAME','copilot_octocat_2_0_lowpoly_v01.blend')))
print(json.dumps(stats))
