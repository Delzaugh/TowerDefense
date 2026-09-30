"""Casual human developer. Original landmark-driven model; -Y forward, Z up."""
import bpy, bmesh, math, json, os, sys
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'_shared'))
from persona_quality import Maker
M=json.loads(Path(os.environ.get('ASSET_MANIFEST',HERE/'asset.json')).read_text(encoding='utf-8-sig'))
bpy.ops.wm.read_factory_settings(use_empty=True)
a=Maker(M)
DETAIL=os.environ.get('HUMAN_BLOCKOUT')!='1'

def loft(name,sections,role,n=12,soft=False,p=2.8):
    v=[]
    for x,y,z,rx,ry in sections:
        for i in range(n):
            t=math.tau*i/n
            v.append((x+rx*math.copysign(abs(math.cos(t))**(2/p),math.cos(t)),y+ry*math.copysign(abs(math.sin(t))**(2/p),math.sin(t)),z))
    f=[tuple(reversed(range(n)))]
    for j in range(len(sections)-1):
        f.extend((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n))
    f.append(tuple((len(sections)-1)*n+i for i in range(n)))
    a.add(name,v,f,role,soft)

def oval(name,c,r,role,n=12,rings=6,soft=False):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=n,ring_count=rings,location=c)
    o=bpy.context.object;o.scale=r
    a.collect(o,name,role,soft)

def tube(name,path,radii,role,n=8):
    v=[];path=[Vector(p) for p in path]
    for j,c in enumerate(path):
        t=(path[min(j+1,len(path)-1)]-path[max(0,j-1)]).normalized()
        u=t.cross(Vector((0,1,0))).normalized();w=t.cross(u).normalized()
        for i in range(n):
            ang=math.tau*i/n;v.append(tuple(c+radii[j]*(math.cos(ang)*u+math.sin(ang)*w)))
    f=[tuple(reversed(range(n)))]
    for j in range(len(path)-1):
        f.extend((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n))
    f.append(tuple((len(path)-1)*n+i for i in range(n)))
    a.add(name,v,f,role)

# Primary landmarks: ground 0, soles .07, crotch 1.03, hoodie hem 1.16,
# shoulders 1.91, neck 2.12, chin 2.16, eye line 2.53, hair apex 3.00.
# Slightly wide planted legs leave a visible gap, with oversized everyday shoes.
for s,side in [(-1,'left'),(1,'right')]:
    x=s*.235
    a.box('sneaker_sole_'+side,(x,-.11,.045),(.38,.62,.09),'cream',.045,1)
    loft('sneaker_upper_'+side,[(x,-.11,.08,.17,.285),(x,-.11,.15,.175,.275),(x,-.055,.25,.143,.175)],'cream',8)
    loft('jeans_'+side,[(x,.015,.22,.142,.145),(x,.012,.36,.151,.158),(x,0,.67,.16,.173),(s*.22,0,.96,.185,.205),(s*.21,0,1.20,.19,.20)],'denim',8)
    if DETAIL:
        loft('rolled_cuff_'+side,[(x,.012,.24,.15,.158),(x,.012,.34,.158,.163)],'denim_light',8)
        a.box('sneaker_tongue_'+side,(x,-.195,.204),(.14,.16,.038),'hoodie_dark',.02,1,rot=(.23,0,0))
        for yy in [-.225,-.173]:a.box('broad_lace_'+side,(x,yy,.23),(.13,.027,.022),'cream',.006,1)
loft('jeans_pelvis',[(0,0,1.045,.26,.195),(0,0,1.17,.38,.22),(0,0,1.29,.37,.22)],'denim',12)

# Underlying T-shirt is visible through the open front and collar.
loft('tee',[(0,0,1.165,.355,.225),(0,0,1.38,.35,.235),(0,0,1.73,.35,.245),(0,0,1.88,.32,.205),(0,0,2.015,.147,.12)],'cream',12)
loft('neck',[(0,0,1.95,.145,.125),(0,0,2.24,.155,.13)],'skin',10)

# Thick continuous open hoodie shell, wrapping sides and back with actual front opening.
# Angles start on right front edge and go around the back to left front edge.
angles=[-1.21,-.93,-.55,0,.52,1.05,1.57,2.09,2.62,3.14,3.70,4.08,4.35]
sections=[(1.17,.405,.263),(1.30,.432,.282),(1.66,.446,.285),(1.88,.475,.263),(2.015,.205,.178)]
v=[]
for inner in [False,True]:
    for z,rx,ry in sections:
        for t in angles:
            v.append(((rx-(.022 if inner else 0))*math.cos(t),(ry-(.022 if inner else 0))*math.sin(t),z))
n=len(angles);layer=n*len(sections);f=[];roles=[]
for shell in range(2):
    for j in range(len(sections)-1):
        for i in range(n-1):
            k=shell*layer+j*n+i;f.append((k,k+1,k+1+n,k+n));roles.append('hoodie' if shell==0 else 'hoodie_dark')
for j in range(len(sections)-1):
    for i in [0,n-1]:
        k=j*n+i;f.append((k,k+n,k+n+layer,k+layer));roles.append('hoodie_dark')
for j in [0,len(sections)-1]:
    for i in range(n-1):
        k=j*n+i;f.append((k,k+layer,k+1+layer,k+1));roles.append('hoodie_dark')
a.add('open_hoodie_shell',v,f,roles)

# Dropped fabric hood: concave bowl with a broad opening behind the neck.
v=[];n=12
for z,rx,ry,y in [(1.76,.18,.10,.23),(1.85,.30,.16,.235),(2.015,.265,.16,.185),(2.015,.215,.113,.185),(1.87,.21,.092,.225)]:
    for i in range(n):
        t=math.tau*i/n;v.append((rx*math.cos(t),y+ry*math.sin(t),z))
f=[]
for j in range(4):f.extend((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n))
f.extend([tuple(range(n-1,-1,-1)),tuple(4*n+i for i in range(n))])
a.add('dropped_hood',v,f,['hoodie']*(2*n)+['hoodie_dark']*(2*n)+['hoodie','hoodie_dark'])

# Hanging right arm, carrying left arm. Sleeve cylinders follow elbow landmarks.
tube('right_sleeve',[(.35,0,1.83),(.53,.005,1.69),(.61,-.035,1.40),(.64,-.095,1.21)],[.20,.188,.16,.135],'hoodie')
tube('right_cuff',[(.635,-.085,1.255),(.655,-.105,1.16)],[.141,.132],'hoodie_dark')
oval('right_hand',(.66,-.11,1.075),(.13,.113,.17),'skin',10,5)
oval('right_thumb',(.55,-.17,1.105),(.061,.067,.105),'skin',8,4)
tube('left_sleeve',[(-.35,0,1.83),(-.57,.05,1.65),(-.69,-.015,1.38),(-.68,-.23,1.33)],[.20,.177,.151,.13],'hoodie')
tube('left_cuff',[(-.68,-.20,1.335),(-.675,-.29,1.345)],[.137,.125],'hoodie_dark')
oval('left_hand',(-.665,-.335,1.355),(.13,.105,.115),'skin',10,5)

# Closed slim laptop held vertically against left side, with a visible bound edge.
a.box('laptop_rubber_edge',(-.535,-.065,1.445),(.105,.64,.70),'ink',.037,1)
a.box('laptop_lid',(-.594,-.065,1.445),(.03,.595,.65),'laptop',.014,1)
if DETAIL:
    # Simple contrasting code sticker on the outward-facing lid.
    for s in [-1,1]:
        a.stroke('laptop_code_bracket',[(s*.071,.06),(s*.12,0),(s*.071,-.06)],.024,(-.613,-.065,1.49),'hoodie','left',.007)

# Broad rounded head: shallow temples, defined cheeks, soft chin, full back cranium.
loft('head',[(0,-.015,2.135,.16,.16),(0,-.025,2.20,.27,.225),(0,-.005,2.37,.35,.276),(0,.005,2.61,.355,.28),(0,.012,2.77,.30,.245),(0,.02,2.845,.17,.16)],'skin',12,False,2.8)
for s in [-1,1]:
    oval('ear', (s*.355,.015,2.46),(.071,.085,.115),'skin',8,5)
    if DETAIL:oval('ear_inset',(s*.397,-.01,2.47),(.024,.055,.062),'skin_shadow',8,4)

# Hair cap uses a purpose-shaped irregular hairline and sloped swept crown.
n=12;v=[]
for ring in range(3):
    for i in range(n):
        t=math.tau*i/n;front=max(0,-math.sin(t))
        if ring==0:
            rx,ry=.362,.288;z=2.40+.285*front
            if front>.8:z+=.035*math.cos(t)
        elif ring==1:rx,ry=.346,.275;z=2.80+.028*math.cos(t)
        else:rx,ry=.22,.19;z=2.94+.036*math.cos(t)
        v.append((rx*math.copysign(abs(math.cos(t))**.72,math.cos(t)),.022+ry*math.copysign(abs(math.sin(t))**.72,math.sin(t)),z))
f=[]
for j in range(2):f.extend((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n))
f.append(tuple(2*n+i for i in range(n)));a.add('swept_hair_cap',v,f,'hair')
if DETAIL:
    # One broad fringe wedge continues the crown silhouette across the forehead.
    a.poly('swept_fringe',[(-.31,2.71),(-.25,2.83),(.20,2.885),(.31,2.79),(.16,2.71),(-.10,2.65)],(0,-.277,0),.095,'hair',bevel=.012)
    for s in [-1,1]:
        oval('eye',(s*.142,-.285,2.52),(.032,.021,.046),'ink',8,4)
        a.stroke('eyebrow',[(s*.075,2.606),(s*.14,2.625),(s*.204,2.61)],.024,(0,-.282,0),'hair',depth=.011)
    oval('nose',(0,-.296,2.424),(.071,.062,.068),'skin',8,4)
    a.stroke('small_smile',[(-.083,2.32),(0,2.303),(.078,2.325)],.018,(0,-.285,0),'skin_shadow',depth=.009)
    # Two fitted welt pockets, short pull cords, and zipper tapes carry clothing identity.
    for s in [-1,1]:
        a.stroke('pocket_welt',[(s*.27,1.35),(s*.355,1.44)],.023,(0,-.247,0),'hoodie_dark',depth=.009)
        tube('hood_cord',[(s*.143,-.177,1.975),(s*.168,-.271,1.83),(s*.18,-.285,1.73)],[.013,.013,.013],'cream',6)

# One packed semantic palette, one material, one editable mesh with named part groups.
roles=list(M['palette']['colors']);width,height=32,8
atlas=bpy.data.images.new('human_developer_palette',width=width,height=height,alpha=True)
pixels=[]
for yy in range(height):
    for xx in range(width):
        idx=((height-1-yy)//4)*8+xx//4;col=M['palette']['colors'][roles[min(idx,len(roles)-1)]].lstrip('#')
        pixels.extend([int(col[i:i+2],16)/255 for i in (0,2,4)]+[1])
atlas.pixels=pixels;atlas.pack()
mat=bpy.data.materials.new('human_developer_palette');mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.86;bs.inputs['Specular IOR Level'].default_value=.22
tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=atlas;tex.interpolation='Closest';mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
mesh=bpy.data.meshes.new('casual_developer_geometry');mesh.from_pydata(a.v,[],a.f);mesh.update();mesh.materials.append(mat)
uv=mesh.uv_layers.new(name='PaletteUV')
for p,role,soft in zip(mesh.polygons,a.r,a.s):
    idx=roles.index(role);p.use_smooth=soft
    for k in p.loop_indices:uv.data[k].uv=((idx%8*4+2)/width,1-(idx//8*4+2)/height)
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
obj=bpy.data.objects.new('casual_developer',mesh);bpy.context.collection.objects.link(obj)
for name,start,count in a.parts:obj.vertex_groups.new(name=name).add(list(range(start,start+count)),1,'REPLACE')
root=bpy.data.objects.new('root',None);bpy.context.collection.objects.link(root);obj.parent=root
root['asset']='human_developer_v01';root['design']='Original casual human developer; user-selected open hoodie outfit.'
for name,pos in [('anchor_ui',(0,0,3.20)),('anchor_action',(-.665,-.335,1.355)),('anchor_target',(0,0,1.55))]:
    e=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(e);e.parent=root;e.location=pos
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1;scene.render.fps=24
bpy.context.view_layer.objects.active=obj;obj.select_set(True)
out=Path(os.environ.get('ASSET_BUILD_DIR',HERE));out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/os.environ.get('ASSET_SOURCE_NAME','human_developer_v01.blend')))
mesh.calc_loop_triangles();print('HUMAN_MODEL',len(mesh.loop_triangles),'triangles', 'detail',DETAIL)
