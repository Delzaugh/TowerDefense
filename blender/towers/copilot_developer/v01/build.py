"""Developer: landmark-driven reconstruction. Blender -Y forward, +Z up.
The silhouette is established in local profiles; rigid accessories are fitted
afterward. No whole-model deformation and no generic head extrusion.
"""
import bpy,bmesh,os,sys,json,math
from pathlib import Path
from mathutils import Vector
from mathutils.geometry import tessellate_polygon
from mathutils.bvhtree import BVHTree
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'_shared'))
from persona_quality import Maker,matrix
m=json.loads(Path(os.environ.get('ASSET_MANIFEST',HERE/'asset.json')).read_text(encoding='utf-8-sig'))
bpy.ops.wm.read_factory_settings(use_empty=True);a=Maker(m)
BLOCKOUT=os.environ.get('DEVELOPER_BLOCKOUT')=='1'
def octagon(w,h,c):
    return [(-w/2+c,h/2),(-w/2,h/2-c),(-w/2,-h/2+c),(-w/2+c,-h/2),(w/2-c,-h/2),(w/2,-h/2+c),(w/2,h/2-c),(w/2-c,h/2)]
def softened(p,t=.07):
    return [tuple(Vector(p[i]).lerp(Vector(p[(i+d)%len(p)]),t)) for i in range(len(p)) for d in [-1,1]]
def scaled(p,sx,sz):return [(x*sx,z*sz) for x,z in p]
def mesh_obj(name,v,f):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],f);mesh.update()
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);return obj
def bevel(obj,width=.025,segments=2):
    bpy.context.view_layer.objects.active=obj
    mod=obj.modifiers.new('Controlled edge chamfer','BEVEL');mod.width=width;mod.segments=segments
    bpy.ops.object.modifier_apply(modifier=mod.name)
def collect(obj,name,role):a.collect(obj,name,role)

# Horizontal sections follow the measured face/chin/rear profile. Each line is
# (height, half width, front depth, rear depth), all in metres.
body_sections=[(.035,.49,-.79,.35),(.18,.71,-.90,.61),(.38,.86,-.92,.78),
               (.64,.94,-.965,.86),(.91,.87,-.960,.755),(1.12,.62,-.91,.68),
               (1.34,.45,-.79,.48),(1.51,.30,-.61,.27)]
v=[]
for z,w,yf,yb in body_sections:
    mid=(yf+yb)*.5
    xy=[(-w*.74,yf+.13),(-w*.40,yf+.035),(0,yf),(.40*w,yf+.035),(.74*w,yf+.13),
        (w,yf+.32),(w,mid),(.92*w,yb-.13),(.60*w,yb),(0,yb+.012),
        (-.60*w,yb),(-.92*w,yb-.13),(-w,mid),(-w,yf+.32)]
    v.extend((x,y,z) for x,y in xy)
n=14;f=[];r=[]
for j in range(len(body_sections)-1):
    for i in range(n):
        f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
        r.append('screen' if i in range(4) and j>=1 else 'graphite')
f.extend([tuple(range(n-1,-1,-1)),tuple((len(body_sections)-1)*n+i for i in range(n))]);r+=['graphite','graphite']
core=mesh_obj('landmark_body',v,f)
# Preserve semantic face roles through two local vent cuts in the actual casing.
for role in ['graphite','screen']:
    mat=bpy.data.materials.new('construction_'+role);core.data.materials.append(mat)
for poly,role in zip(core.data.polygons,r):poly.material_index=int(role=='screen')
if not BLOCKOUT:
    for z in [.48,.68]:
        bpy.ops.mesh.primitive_cube_add(size=1,location=(0,.875,z));cut=bpy.context.object;cut.dimensions=(.59,.29,.065)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);bevel(cut,.024,2)
        bpy.context.view_layer.objects.active=core;mod=core.modifiers.new('Integrated rear ventilation','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cut
        bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
        a.box('recessed_vent_back',(0,.742,z),(.60,.016,.069),'detail',0,1)
body_bvh=BVHTree.FromPolygons([p.co.copy() for p in core.data.vertices],[list(p.vertices) for p in core.data.polygons])
def body_x(y,z):
    point,normal,index,distance=body_bvh.ray_cast(Vector((3,y,z)),Vector((-1,0,0)))
    return point.x if point else .55
# Provide a real recessed seat beneath the cheek armor. The fitting surface
# above remains the design envelope; the hidden inner casing has clearance.
for vertex in core.data.vertices:
    if vertex.co.y<-.45 and vertex.co.z<1.15 and abs(vertex.co.x)>.68:
        vertex.co.x*=.90
collect(core,'profiled_body_and_face',['screen' if p.material_index==1 else 'graphite' for p in core.data.polygons])

# Crown outline traced in the enlarged side-contour image. Pixel coordinates
# map with a shared ground datum (742), longitudinal datum (400), scale .0032.
# Widths come from the front contour: narrow crest, middle shoulders, lower fins.
crown_profile=[
 (167,253,.30),(347,125,.31),(726,49,.265),(739,63,.265),(740,96,.27),
 (565,166,.34),(477,205,.40),(492,225,.69),(754,142,.48),(764,150,.50),(764,196,.77),
 (531,333,.76),(553,355,.79),(751,285,.72),(764,293,.76),(764,332,.83),
 (637,428,.80),(648,435,.84),(682,465,.84),(596,480,.89),(506,452,.95),
 (448,371,.92),(286,378,.91),(195,454,.875),(113,450,.80),(177,360,.90)]
yz=[((u-400)*.0032,(742-w)*.0032) for u,w,x in crown_profile]
poly2=[Vector((y,z,0)) for y,z in yz];tris=tessellate_polygon([poly2])
index={(round(p.x,8),round(p.y,8)):i for i,p in enumerate(poly2)}
tri_idx=[tuple(p if isinstance(p,int) else index[(round(p.x,8),round(p.y,8))] for p in tri) for tri in tris]
n=len(yz);v=[]
for side in [-1,1]:v.extend((side*crown_profile[i][2],y,z) for i,(y,z) in enumerate(yz))
f=[tuple(reversed(t)) for t in tri_idx]+[tuple(n+i for i in t) for t in tri_idx]
f.extend((i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n))
crown=mesh_obj('traced_crown_and_fins',v,f);bevel(crown,.014,2)
collect(crown,'traced_crown_and_fins','shell')

# Cheek strips terminate at the temple and chin landmarks; the display stays
# open and the broad middle/rear volume remains graphite as in the reference.
for s in [-1,1]:
    def fitted_strip(name,rows,columns=4,crown_join=False):
        vv=[]
        for z,yf,yb,minimum in rows:
            for i in range(columns):
                y=yf+(yb-yf)*i/(columns-1)
                x=max(minimum,body_x(y,z)+.035)
                vv.append((s*x,y,z))
        if crown_join:
            # Seat the first edge along the crown's measured lower-front edge.
            for i in range(columns):
                t=i/(columns-1)
                vv[i]=(s*(.8+.075*t),-.9184+.2624*t,.9344-.0128*t)
        count=len(vv);vv.extend((x-s*.027,y,z) for x,y,z in list(vv));ff=[]
        for j in range(len(rows)-1):
            for i in range(columns-1):
                q=(j*columns+i,j*columns+i+1,(j+1)*columns+i+1,(j+1)*columns+i)
                ff.extend([q,tuple(count+k for k in reversed(q))])
        perimeter=list(range(columns))+[j*columns+columns-1 for j in range(1,len(rows))]+list(range(count-2,count-columns-1,-1))+[j*columns for j in range(len(rows)-2,0,-1)]
        for k,i in enumerate(perimeter):
            j=perimeter[(k+1)%len(perimeter)];ff.append((i,j,j+count,i+count))
        ob=mesh_obj(name,vv,ff);bevel(ob,.007,1);collect(ob,name,'shell')
    fitted_strip('fitted_cheek_'+str(s),[(.955,-.898,-.54,.83),(.75,-.922,-.59,.80),(.48,-.905,-.585,.80),(.30,-.74,-.42,.77),(.18,-.61,-.355,.65),(.07,-.48,-.31,.54)],crown_join=True)
    fitted_strip('fitted_lower_strap_'+str(s),[(.43,-.29,-.025,0),(.25,-.29,-.025,0),(.15,-.29,-.025,0),(.063,-.29,-.025,0)],3)

# Substantial projecting chin: upper edge, forward corner and receding bottom
# are explicitly authored. It is not generated by bowing the whole model.
front=[(-.77,-.867,.48),(-.81,-1.000,.265),(-.43,-.802,.015),(.43,-.802,.015),(.81,-1.000,.265),(.77,-.867,.48),
       (.66,-.874,.50),(.62,-.921,.34),(.37,-.930,.19),(-.37,-.930,.19),(-.62,-.921,.34),(-.66,-.874,.50)]
n=len(front);v=front+[(x,y+.15,z+.025) for x,y,z in front]
f=[tuple(range(n-1,-1,-1)),tuple(n+i for i in range(n))]+[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)]
chin=mesh_obj('projecting_chin',v,f);bevel(chin,.02,2);collect(chin,'projecting_chin','graphite')

# Rigid, chamfered goggles. Pitch follows the traced side profile; yaw follows
# the forehead width. Local optics remain undeformed after fitting.
outline=softened([(-.34,.31),(.28,.31),(.435,.105),(.405,-.14),(.25,-.30),(-.25,-.30),(-.415,-.14),(-.44,.105)],.09)
n=len(outline);lens_data=[]
for s in [-1,1]:
    xf=matrix((s*.465,-.995,1.278),pitch=-.25,yaw=s*.10)
    if s<0:shape=[(-x,z) for x,z in reversed(outline)]
    else:shape=outline
    loops=[(1,1,.275),(1,1,.03),(.96,.96,-.02),(.87,.88,-.045),(.68,.64,-.045),(.64,.60,.003),(.64,.60,.19)]
    v=[(x*sx,y,z*sz) for sx,sz,y in loops for x,z in shape]
    f=[(j*n+i,j*n+(i+1)%n,((j+1)%len(loops))*n+(i+1)%n,((j+1)%len(loops))*n+i) for j in range(len(loops)) for i in range(n)]
    a.add('fitted_goggle_frame_'+str(s),v,f,'graphite',xf=xf)
    v=[(x*sx,y,z*sz) for sx,sz,y in [(.658,.618,.0),(.658,.618,.10),(.61,.57,.10),(.61,.57,.0)] for x,z in shape]
    f=[(j*n+i,j*n+(i+1)%n,((j+1)%4)*n+(i+1)%n,((j+1)%4)*n+i) for j in range(4) for i in range(n)]
    a.add('lens_gasket_'+str(s),v,f,'detail',xf=xf)
    v=[]
    for scale,y in [(1,.050),(.73,-.005),(.35,-.017)]:v.extend((x*.63*scale,y,z*.59*scale) for x,z in shape)
    v.append((0,-.021,0));f=[tuple(range(n-1,-1,-1))]
    for j in range(2):f.extend((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n))
    f.extend((2*n+i,2*n+(i+1)%n,3*n) for i in range(n))
    lens_data.append((len(a.v),len(v),xf));a.add('inset_teal_lens_'+str(s),v,f,'lens',True,True,xf)
a.box('solid_bridge',(0,-.926,1.29),(.18,.23,.205),'graphite',.018,1)

# Temple landmark: lower and farther forward than rejected revision 4.
for s in [-1,1]:
    xf=matrix((s*.95,-.145,.80),'right' if s>0 else 'left')
    p=softened(octagon(1.00,.96,.22),.065)
    a.loft('temple_socket_'+str(s),[(scaled(p,.76,.76),.24),(scaled(p,.94,.94),-.025)],'detail',xf)
    a.loft('ivory_temple_housing_'+str(s),[(scaled(p,.91,.91),.01),(p,-.045),(p,-.13),(scaled(p,.92,.92),-.17)],'trim',xf)
    a.loft('badge_seat_'+str(s),[(scaled(p,.79,.79),-.167),(scaled(p,.79,.79),-.19)],'detail',xf)
    a.loft('code_badge_'+str(s),[(scaled(p,.765,.765),-.177),(scaled(p,.765,.765),-.205),(scaled(p,.69,.69),-.237)],'graphite',xf)
    if not BLOCKOUT:
        for k in [-1,1]:
            points=[(k*.075,.185),(k*.13,.17),(k*.13,.065),(k*.172,.024),(k*.172,-.024),(k*.13,-.065),(k*.13,-.17),(k*.075,-.185)]
            a.stroke('curly_brace',points,.043,(s*1.197,-.145,.80),'trim','right' if s>0 else 'left',.013)
if not BLOCKOUT:
    for s in [-1,1]:a.eye((s*.235,-.956,.65),.315,.118)
    a.box('upper_recessed_radiator',(0,.48,1.69),(.48,.34,.16),'detail',.022,1)
    a.box('lower_recessed_radiator',(0,.57,1.28),(.86,.25,.16),'detail',.022,1)

output=os.environ.get('ASSET_BUILD_DIR',str(HERE));source_name=os.environ.get('ASSET_SOURCE_NAME','copilot_developer_v01.blend')
a.finish(output,source_name)
obj=bpy.data.objects['developer_model'];mesh=obj.data
core_start,core_count=next((start,count) for name,start,count in a.parts if name=='profiled_body_and_face')
for poly in mesh.polygons:
    is_core=all(core_start<=i<core_start+core_count for i in poly.vertices)
    # Rear vent cuts share the casing's planar shading, rather than pulling
    # interpolated normals toward the recessed slot walls.
    poly.use_smooth=not (is_core and poly.center.y>-.45)
mesh.set_sharp_from_angle(angle=math.radians(42));bpy.context.view_layer.objects.active=obj
mod=obj.modifiers.new('Stable planar normals','WEIGHTED_NORMAL');mod.keep_sharp=True;mod.weight=50
bpy.ops.object.modifier_apply(modifier=mod.name)
normals=[tuple(n.vector) for n in mesh.corner_normals]
for start,count,xf in lens_data:
    inv=xf.inverted()
    for loop in mesh.loops:
        if start<=loop.vertex_index<start+count:
            p=inv@Vector(a.v[loop.vertex_index]);normals[loop.index]=tuple((xf.to_3x3()@Vector((p.x*1.3,-1,p.z*1.8))).normalized())
mesh.normals_split_custom_set(normals)
bs=bpy.data.materials['developer_palette'].node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.57;bs.inputs['Specular IOR Level'].default_value=.23
bs=bpy.data.materials['developer_optics'].node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.28
bpy.data.objects['root']['design']='Landmark reconstruction from original contour sheet; rigid fitted parts; no global warp'
if m['clips'] and not BLOCKOUT:
    sys.path.insert(0,str(HERE))
    from animate import author
    author(m)
bpy.ops.wm.save_as_mainfile(filepath=str(Path(output)/source_name))
mesh.calc_loop_triangles();print('DEVELOPER_TRIANGLES',len(mesh.loop_triangles),'BLOCKOUT',BLOCKOUT)
