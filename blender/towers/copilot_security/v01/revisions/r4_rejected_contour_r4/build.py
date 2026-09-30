"""Landmark-built Security; metres; Blender -Y forward, +Z up."""
import bpy,bmesh,os,sys,json,math
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'_shared'))
from persona_quality import Maker,matrix
m=json.loads(Path(os.environ.get('ASSET_MANIFEST',HERE/'asset.json')).read_text(encoding='utf-8-sig'))
bpy.ops.wm.read_factory_settings(use_empty=True)
a=Maker(m);BLOCKOUT=os.environ.get('SECURITY_BLOCKOUT')=='1'
def octagon(w,h,c):
 return [(-w/2+c,h/2),(-w/2,h/2-c),(-w/2,-h/2+c),(-w/2+c,-h/2),(w/2-c,-h/2),(w/2,-h/2+c),(w/2,h/2-c),(w/2-c,h/2)]
def soft(p,t=.12):return [tuple(Vector(p[i]).lerp(Vector(p[(i+d)%len(p)]),t)) for i in range(len(p)) for d in [-1,1]]
def scale(p,x,z=None):return [(u*x,v*(x if z is None else z)) for u,v in p]
def mesh(name,v,f):
 me=bpy.data.meshes.new(name);me.from_pydata(v,[],f);me.update()
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
 ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);return ob
def ring(name,p,loops,roles,xf):
 n=len(p);v=[(x*sx,y,z*sz) for sx,sz,y in loops for x,z in p];f=[];rr=[]
 for j in range(len(loops)):
  for i in range(n):
   f.append((j*n+i,j*n+(i+1)%n,((j+1)%len(loops))*n+(i+1)%n,((j+1)%len(loops))*n+i));rr.append(roles[j] if isinstance(roles,list) else roles)
 a.add(name,v,f,rr,xf=xf)

# Shared perimeter between curved display and sectioned round helmet.
p=soft(octagon(2.00,2.19,.44),.14);n=len(p);zc=1.095
sections=[(1.,.94,-.46),(.985,1.,.04),(.94,.97,.47),(.83,.86,.77),(.64,.65,.94)]
v=[(x*sx,y,z*sz+zc) for sx,sz,y in sections for x,z in p];f=[];roles=[]
for j in range(len(sections)-1):
 for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i));roles.append('shell')
f.append(tuple((len(sections)-1)*n+i for i in range(n)));roles.append('shell')
previous=0
for sx,sz,y,role in [(.89,.86,-.70,'shell'),(.80,.69,-.79,'shell'),(.77,.665,-.825,'shell_dark'),(.49,.43,-.896,'screen')]:
 off=len(v);v.extend((x*sx,y,z*sz+zc) for x,z in p)
 for i in range(n):f.append((previous+i,previous+(i+1)%n,off+(i+1)%n,off+i));roles.append(role)
 previous=off
v.append((0,-.918,zc));center=len(v)-1
for i in range(n):f.append((previous+i,previous+(i+1)%n,center));roles.append('screen')
ob=mesh('sectioned_helmet_and_display',v,f)
for r in ['shell','shell_dark','screen']:ob.data.materials.append(bpy.data.materials.new('construction_'+r))
for poly,r in zip(ob.data.polygons,roles):poly.material_index=['shell','shell_dark','screen'].index(r)
if not BLOCKOUT:
 for z in [.81,1.00,1.19]:
  bpy.ops.mesh.primitive_cube_add(size=1,location=(0,.95,z));cut=bpy.context.object;cut.dimensions=(.61,.18,.083)
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  be=cut.modifiers.new('Vent corner chamfer','BEVEL');be.width=.015;be.segments=1;bpy.ops.object.modifier_apply(modifier=be.name)
  bpy.context.view_layer.objects.active=ob;bo=ob.modifiers.new('Recessed rear ventilation','BOOLEAN');bo.operation='DIFFERENCE';bo.object=cut
  bpy.ops.object.modifier_apply(modifier=bo.name);bpy.data.objects.remove(cut,do_unlink=True)
  a.box('vent_well',(0,.866,z),(.60,.008,.079),'detail',.01,1)
a.collect(ob,'sectioned_helmet_and_display',[['shell','shell_dark','screen'][p.material_index] for p in ob.data.polygons])

# Symmetric, seated octagonal side pods. White trim is a closed ring.
pod=octagon(1.31,1.43,.30)
for s in [-1,1]:
 xf=matrix((s*.92,.06,1.065),'right' if s>0 else 'left')
 a.loft('pod_structural_housing_'+str(s),[(scale(pod,.82),.14),(scale(pod,.96),-.02),(pod,-.14),(scale(pod,.96),-.23)],'shell',xf)
 ring('pod_continuous_white_trim_'+str(s),pod,[(.94,.94,-.22),(.91,.91,-.29),(.79,.79,-.315),(.75,.75,-.28),(.75,.75,-.22)],'trim',xf)
 ring('pod_cobalt_inner_ring_'+str(s),pod,[(.77,.77,-.275),(.735,.735,-.345),(.55,.55,-.372),(.50,.50,-.335),(.50,.50,-.285)],'shell_dark',xf)
 a.loft('pod_navy_center_'+str(s),[(scale(pod,.52),-.31),(scale(pod,.50),-.35)],'graphite',xf)

for s in [-1,1]:a.box('crest_dark_support',(s*.405,.025,2.195),(.26,.61,.16),'graphite',.025,1)
a.loft('curved_central_crest',[( [(x,z-.06+h) for x,h in octagon(w,.26,.025)],y) for y,w,z in [(-.64,.53,1.98),(-.42,.58,2.20),(-.03,.58,2.285),(.37,.53,2.205),(.66,.45,1.98)]],'shell')

# Divide bowed front panels at the centre plane: each half is planar, avoiding
# concave non-planar n-gons whose automatic diagonals crossed the display.
for s in [-1,1]:
 for name,outline,yfront,yback,role in [
  ('armored_chin',[(0,.61),(.30,.61),(.53,.65),(.70,.76),(.77,.69),(.72,.26),(.46,.045),(0,.045)],-.965,-.50,'shell'),
  ('chin_white_lip',[(0,.635),(.292,.635),(.527,.679),(.683,.791),(.755,.705),(.578,.565),(.338,.535),(0,.535)],-1.01,-.95,'trim')]:
  n=len(outline);v=[(s*x,yy+.16*x,z) for yy in [yfront,yback] for x,z in outline]
  ff=[tuple(range(n-1,-1,-1)),tuple(n+i for i in range(n))]+[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)]
  ob=mesh(name+str(s),v,ff);a.collect(ob,name+str(s),role)
if not BLOCKOUT:
 plate=[(-.30,.575),(.30,.575),(.39,.475),(.35,.08),(.28,.049),(-.28,.049),(-.35,.08),(-.39,.475)]
 a.loft('central_chin_armor',[(plate,-.88),(plate,-.984),([(x*.92,(z-.31)*.92+.31) for x,z in plate],-1.015)],'shell_dark')

goggle=[(-.36,.22),(.265,.22),(.39,-.055),(.24,-.25),(-.225,-.25),(-.38,-.09)]
for s in [-1,1]:
 p=goggle if s<0 else [(-x,z) for x,z in reversed(goggle)]
 xf=matrix((s*.412,-.838,1.60),pitch=-.08,yaw=s*.12)
 ring('angular_goggle_frame_'+str(s),p,[(1,1,.055),(1.04,1.04,-.10),(.99,.99,-.18),(.79,.73,-.18),(.74,.68,-.13),(.74,.68,.06)],['shell_dark','shell_dark','shell_dark','detail','detail','shell_dark'],xf)
 if not BLOCKOUT:
  start=len(a.mi)
  a.loft('pale_blue_optic_'+str(s),[(scale(p,.746,.686),-.115),(scale(p,.73,.66),-.153),(scale(p,.49,.46),-.179)],'lens',xf,smooth=True)
  for j in range(start,len(a.mi)):a.mi[j]=1
a.poly('goggle_bridge',[(-.13,.10),(.13,.10),(.16,-.10),(-.16,-.10)],(0,-1.025,1.58),.15,'shell_dark')
brow=[(-.836,1.883),(-.700,1.943),(-.143,1.916),(0,1.878),(.143,1.916),(.700,1.943),(.836,1.883),(.833,1.666),(.727,1.637),(.707,1.810),(.185,1.787),(.087,1.648),(-.087,1.648),(-.185,1.787),(-.707,1.810),(-.727,1.637),(-.833,1.666)]
v=[(x,-1.105+.07*(abs(x)/.836)**2,z) for x,z in brow]+[(x,-.975+.07*(abs(x)/.836)**2,z) for x,z in brow]
n=len(brow);ff=[tuple(range(n-1,-1,-1)),tuple(n+i for i in range(n))]+[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)]
ob=mesh('single_white_brow',v,ff);bpy.context.view_layer.objects.active=ob;be=ob.modifiers.new('Brow edge chamfer','BEVEL');be.width=.014;be.segments=1;bpy.ops.object.modifier_apply(modifier=be.name);a.collect(ob,'single_white_brow','trim')
# A solid shaped housing fills the seat from the raised brow to the forehead.
# It stays behind the trim, closing the oblique upper gap without a floating bar.
v=[(x,-1.008+.07*(abs(x)/.836)**2,z) for x,z in brow]+[(x,-.66,z) for x,z in brow]
ob=mesh('brow_fitted_backing',v,ff);a.collect(ob,'brow_fitted_backing','shell_dark')

# Character-left is +X, matching the supplied front reference.
scanner=matrix((.94,-.13,1.99))
circ=[(.207*math.cos(2*math.pi*i/12),.207*math.sin(2*math.pi*i/12)) for i in range(12)]
a.box('scanner_fitted_saddle',(.92,-.13,1.79),(.32,.61,.15),'shell_dark',.04,1)
a.loft('faceted_scanner_housing',[(scale(circ,.87),.39),(circ,.34),(circ,-.31),(scale(circ,.94),-.37)],'shell',scanner)
for y in [-.27,.26]:a.loft('scanner_end_band',[(scale(circ,1.035),y+.042),(scale(circ,1.035),y-.042)],'shell_dark',scanner)
if not BLOCKOUT:
 ring('scanner_white_bezel',circ,[(.97,.97,-.35),(.96,.96,-.411),(.72,.72,-.427),(.68,.68,-.402),(.68,.68,-.35)],'trim',scanner)
 ring('scanner_navy_gasket',circ,[(.72,.72,-.407),(.64,.64,-.435),(.52,.52,-.435),(.52,.52,-.397)],'detail',scanner)
 a.loft('scanner_dark_lens',[(scale(circ,.55),-.40),(scale(circ,.51),-.447),(scale(circ,.28),-.466)],'screen',scanner,smooth=True)
 a.disc('scanner_cyan_glint',(.902,-.603,2.045),.031,.008,'cyan',n=10)
 a.box('scanner_status_strip',(.94,-.12,2.192),(.087,.43,.015),'cyan',.006,1)
 for s in [-1,1]:a.eye((s*.275,-.913,1.001),.335,.122)
 shield=[(-.162,.115),(-.074,.141),(0,.194),(.074,.141),(.162,.115),(.142,-.071),(.075,-.155),(0,-.216),(-.075,-.155),(-.142,-.071)]
 a.poly('white_security_shield',shield,(0,-1.043,.326),.044,'trim',bevel=.009)

output=os.environ.get('ASSET_BUILD_DIR',str(HERE));source_name=os.environ.get('ASSET_SOURCE_NAME','copilot_security_v01.blend')
a.finish(output,source_name)
obj=bpy.data.objects['security_model'];me=obj.data;me.set_sharp_from_angle(angle=math.radians(40))
bs=bpy.data.materials['security_palette'].node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.48
bs=bpy.data.materials['security_optics'].node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Strength'].default_value=.12
bpy.data.objects['anchor_action'].location=(.94,-.62,1.99)
bpy.data.objects['anchor_target'].location=(0,0,1.1)
bpy.data.objects['root']['design']='Security reference reconstruction: rounded armor, octagonal pods, angular white brow, single left-temple scanner; model-only'
bpy.ops.wm.save_as_mainfile(filepath=str(Path(output)/source_name))
me.calc_loop_triangles();print('SECURITY',len(me.loop_triangles),'triangles; blockout',BLOCKOUT)
