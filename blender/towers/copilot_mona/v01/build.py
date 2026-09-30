"""Mona colour/feature derivative of the user-selected Classic Low Poly source.
Frozen input preserves original four-leg geometry, joins, cups, weights and rig.
The pipeline owns guarded delivery; animate.py supplies the authorized clip pass.
"""
import bpy,bmesh,os,json,math,hashlib,runpy
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
FOLDER=Path(__file__).resolve().parent
BASE=FOLDER/'references/classic_lowpoly_base_r8.blend'
EXPECTED='e433b387cd8bf61fe9d7fbc105bee080d0e086d3cd6c64885fdc144afb5fed29'
assert hashlib.sha256(BASE.read_bytes()).hexdigest()==EXPECTED
bpy.ops.wm.open_mainfile(filepath=str(BASE))
root=bpy.data.objects['root'];rig=bpy.data.objects['octocat_rig'];scene=bpy.context.scene
# Clear inherited playback, then rebuild only the intended named NLA tracks.
for o in [root,*root.children_recursive]:
    if o.animation_data:o.animation_data_clear()
    if o.type=='ARMATURE':
        o.data.pose_position='POSE'
        for bone in o.pose.bones:bone.matrix_basis.identity()
scene.frame_set(0);bpy.context.view_layer.update()
meshes=[o for o in root.children_recursive if o.type=='MESH']
def geometry_hash(o):
    return hashlib.sha256(json.dumps({'vertices':[list(v.co) for v in o.data.vertices],'faces':[list(p.vertices) for p in o.data.polygons]},separators=(',',':')).encode()).hexdigest()
before={o.name:geometry_hash(o) for o in meshes}
ROLES=['fur','cup_inner','eyes','iris','suckers','inner_ear','smile','highlight']
HEX=['6744EF','CF4DAB','FFF1FA','31136E','FFAFE6','FF80D4','31136E','FFFFFF']
def color(h):return [int(h[i:i+2],16)/255 for i in (0,2,4)]+[1]
def mix(a,b,t):return [x*(1-t)+y*t for x,y in zip(color(a),color(b))]
colors=[color(h) for h in HEX]
palette=bpy.data.images.new('mona_classic_gradient_roles_128x64',width=128,height=64,alpha=False)
palette.pixels[:]=[c for row in range(64) for x in range(128) for c in (mix('6744EF','C832EF',row/63) if x<96 else colors[(x-96)//4])]
palette.file_format='PNG';palette.pack()
mat=bpy.data.materials['octocat_palette'];mat.name='mona_palette'
for n in mat.node_tree.nodes:
    if n.type=='TEX_IMAGE':n.image=palette;n.interpolation='Linear'
for o in meshes:
    if o.name=='head_and_ears':continue
    uv=o.data.uv_layers.active
    for poly in o.data.polygons:
        for li in poly.loop_indices:
            original_role=min(7,int(uv.data[li].uv.x*8))
            if o.name=='body_five_tentacles':
                z=o.data.vertices[o.data.loops[li].vertex_index].co.z
                uv.data[li].uv=(.35,max(.03,min(.97,z/.926)))
            else:
                role=1 if o.name=='suction_cup_rows' and len(poly.vertices)==3 else original_role
                uv.data[li].uv=((96+4*role+2)/128,.5)
# Preserve the base's exact painted face contour and add the Mona gradient.
fm=bpy.data.materials['octocat_face'];fm.name='mona_face_gradient'
tex=next(n for n in fm.node_tree.nodes if n.type=='TEX_IMAGE');old=tex.image
W,H=old.size;pix=list(old.pixels[:]);oldfur=color('252A31');oldface=color('F6C3AA')
v=[oldface[i]-oldfur[i] for i in range(3)];den=sum(x*x for x in v)
for row in range(H):
    t=max(0,min(1,(row/(H-1)-.02)/.88));fur=mix('C832EF','6744EF',t);face=mix('FF64C8','FFC1EA',t)
    for x in range(W):
        k=(row*W+x)*4;a=max(0,min(1,sum((pix[k+i]-oldfur[i])*v[i] for i in range(3))/den))
        pix[k:k+4]=[fur[i]*(1-a)+face[i]*a for i in range(3)]+[1]
# Paint pink inner ears above the original crown; a single shell avoids overlay seams.
S=.5851744927;XMAX=1.232*S;ZMIN=(2.02-.81*1.12)*S;ZMAX=(2.02+.81*1.48)*S
for sign in [-1,1]:
    outline=[(sign*x,z) for x,z in [(.45,1.57),(.52,1.72),(.55,1.73),(.58,1.67),(.57,1.59),(.51,1.57)]]
    points=[((x/XMAX+1)*.5*W,(z-ZMIN)/(ZMAX-ZMIN)*H) for x,z in outline]
    for row in range(H):
        yy=row+.5;xs=[]
        for j,(x1,y1) in enumerate(points):
            x2,y2=points[(j+1)%len(points)]
            if (y1<=yy<y2) or (y2<=yy<y1):xs.append(x1+(yy-y1)*(x2-x1)/(y2-y1))
        xs.sort()
        for j in range(0,len(xs)-1,2):
            lo=max(0,int(math.ceil(xs[j]-.5)));hi=min(W,int(math.floor(xs[j+1]-.5))+1)
            pix[(row*W+lo)*4:(row*W+hi)*4]=color('FF80D4')*(hi-lo)
face=bpy.data.images.new('mona_classic_face_512',width=W,height=H,alpha=False);face.pixels[:]=pix;face.file_format='PNG';face.pack();tex.image=face
head=bpy.data.objects['head_and_ears'];uv=head.data.uv_layers.active
for li,entry in enumerate(uv.data):
    if abs(entry.uv.x-.015)<1e-5 and abs(entry.uv.y-.985)<1e-5:
        z=head.data.vertices[head.data.loops[li].vertex_index].co.z;entry.uv=(.015,(z-ZMIN)/(ZMAX-ZMIN))
# Two tiny eye glints inherit their eye control, without modifying existing geometry.
for sign,label in [(-1,'left'),(1,'right')]:
    iris=bpy.data.objects['eye_iris_'+str(sign)]
    tree=BVHTree.FromPolygons([v.co for v in iris.data.vertices],[list(p.vertices) for p in iris.data.polygons])
    xs=[v.co.x for v in iris.data.vertices];zs=[v.co.z for v in iris.data.vertices]
    cx=(min(xs)+max(xs))/2+.020;cz=(min(zs)+max(zs))/2+.060
    points=[(cx,cz)]+[(cx+.010*math.cos(j*math.tau/8),cz+.016*math.sin(j*math.tau/8)) for j in range(8)]
    vertices=[]
    for x,z in points:
        hit=tree.ray_cast(Vector((x,-4,z)),Vector((0,1,0)))[0]
        assert hit is not None,(x,z)
        vertices.append((x,hit.y-.004,z))
    data=bpy.data.meshes.new('mona_eye_glint_'+label);data.from_pydata(vertices,[],[(0,j+1,(j+1)%8+1) for j in range(8)]);data.update();data.materials.append(mat)
    uv=data.uv_layers.new(name='PaletteUV')
    for entry in uv.data:entry.uv=(126/128,.5)
    obj=bpy.data.objects.new('eye_glint_'+label,data);scene.collection.objects.link(obj);obj.parent=rig
    group=obj.vertex_groups.new(name='eye_'+label);group.add(list(range(len(vertices))),1,'REPLACE');mod=obj.modifiers.new('Inherited eye skin','ARMATURE');mod.object=rig
    for poly in data.polygons:poly.use_smooth=True
assert all(geometry_hash(o)==before[o.name] for o in meshes),'Base geometry changed'
root['source_variant']='copilot_octocat_classic_lowpoly/v01/revision8'
root['supporting_legs']=4;root['arms']=0;root['tails']=1;root['appendage_count']=5
runpy.run_path(str(FOLDER/'animate.py'))
OUT=Path(os.environ.get('ASSET_BUILD_DIR',str(FOLDER)));OUT.mkdir(parents=True,exist_ok=True)
allmeshes=[o for o in root.children_recursive if o.type=='MESH']
stats={'base_source_sha256':EXPECTED,'base_geometry_unchanged':True,'base_geometry_hashes':before,'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in allmeshes),'meshes':len(allmeshes),'bones':len(rig.data.bones),'supporting_legs':4,'tails':1,'cups':45,'glint_triangles':16,'clips':[t.name for t in rig.animation_data.nla_tracks]}
assert stats['triangles']==3506
(OUT/'authoring_stats.json').write_text(json.dumps(stats,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ.get('ASSET_SOURCE_NAME','copilot_mona_v01.blend')))
print(json.dumps(stats))
