"""Security revision: measured YZ profile from feedback-left-contour.png.
Reference mapping is uniform .011 m/px, y=(u-103)*.011, z=(670-v)*.011.
Rigid accessories have their own local profiles and fitted transforms.
"""
import bpy,bmesh,os,sys,json,math
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'_shared'))
from persona_quality import Maker,matrix
m=json.loads(Path(os.environ.get('ASSET_MANIFEST',HERE/'asset.json')).read_text(encoding='utf-8-sig'))
bpy.ops.wm.read_factory_settings(use_empty=True);a=Maker(m)
BLOCKOUT=os.environ.get('SECURITY_BLOCKOUT')=='1'
def octagon(w,h,c):return [(-w/2+c,h/2),(-w/2,h/2-c),(-w/2,-h/2+c),(-w/2+c,-h/2),(w/2-c,-h/2),(w/2,-h/2+c),(w/2,h/2-c),(w/2-c,h/2)]
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

# Each horizontal section carries the traced fore/aft limits and a width from
# the front sheet. The rear bottom is raised, leaving the projecting jaw lowest.
# (image v, front u, rear u, half width)
sections=[(650,99,154,.52),(646,93,159,.72),(619,39,185,.91),
          (595,23,198,.99),(563,21,199,1.0),(536,26,197,.97),
          (510,33,185,.88),(483,70,161,.61),(468,94,145,.31)]
v=[]
for vv,uf,ub,w in sections:
 z=(670-vv)*.011;yf=(uf-103)*.011;yb=(ub-103)*.011;mid=(yf+yb)/2
 xy=[(-w*.76,yf+.10),(-w*.42,yf+.027),(0,yf),(.42*w,yf+.027),(.76*w,yf+.10),
     (w,yf+.30),(w,mid),(.94*w,yb-.10),(.60*w,yb),(0,yb+.012),
     (-.60*w,yb),(-.94*w,yb-.10),(-w,mid),(-w,yf+.30)]
 v.extend((x,y,z) for x,y in xy)
n=14;f=[];roles=[]
for j in range(len(sections)-1):
 for i in range(n):
  f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
  roles.append('screen' if i<4 and 1<=j<=5 else 'shell')
f.extend([tuple(range(n-1,-1,-1)),tuple((len(sections)-1)*n+i for i in range(n))]);roles+=['shell','shell']
body=mesh('traced_helmet_sections',v,f)
for r in ['shell','screen']:body.data.materials.append(bpy.data.materials.new('construction_'+r))
for p,r in zip(body.data.polygons,roles):p.material_index=int(r=='screen')
if not BLOCKOUT:
 for z in [.87,1.06,1.25]:
  bpy.ops.mesh.primitive_cube_add(size=1,location=(0,1.04,z));cut=bpy.context.object;cut.dimensions=(.61,.27,.077)
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  be=cut.modifiers.new('Vent chamfer','BEVEL');be.width=.012;be.segments=1;bpy.ops.object.modifier_apply(modifier=be.name)
  bpy.context.view_layer.objects.active=body;bo=body.modifiers.new('Recessed vent','BOOLEAN');bo.operation='DIFFERENCE';bo.object=cut
  bpy.ops.object.modifier_apply(modifier=bo.name);bpy.data.objects.remove(cut,do_unlink=True)
  a.box('vent_well',(0,.915,z),(.60,.014,.075),'detail',.01,1)
a.collect(body,'traced_helmet_sections',['screen' if p.material_index==1 else 'shell' for p in body.data.polygons])

# The pod housing is broader fore/aft than its inset octagonal trim. Trace the
# swept front cheek and the rising lower-rear corner, instead of a square slab.
pod_cy=.30;pod_cz=.94
housing_px=[(79,535),(109,526),(153,520),(164,528),(186,548),(190,580),
            (187,611),(158,645),(104,649),(77,636),(57,615),(52,602),(53,570),(61,549)]
housing=[((u-103)*.011-pod_cy,(670-vv)*.011-pod_cz) for u,vv in housing_px]
pod=octagon(1.23,1.27,.27)
for s in [-1,1]:
 xf=matrix((s*.935,pod_cy,pod_cz),'right' if s>0 else 'left')
 hp=housing if s>0 else [(-x,z) for x,z in reversed(housing)]
 a.loft('swept_pod_housing_'+str(s),[(scale(hp,.92),.14),(hp,-.035),(hp,-.17),(scale(hp,.965),-.225)],'shell',xf)
 ring('pod_white_trim_'+str(s),pod,[(1.055,1.055,-.22),(1.03,1.03,-.29),(.84,.84,-.315),(.80,.80,-.285),(.80,.80,-.22)],'trim',xf)
 ring('pod_cobalt_ring_'+str(s),pod,[(.83,.83,-.28),(.785,.785,-.345),(.615,.615,-.372),(.565,.565,-.335),(.565,.565,-.28)],'shell_dark',xf)
 a.loft('pod_navy_center_'+str(s),[(scale(pod,.58),-.31),(scale(pod,.563),-.35)],'graphite',xf)

# Long diagonal brow-to-crown rise and short flat crest are explicit YZ points.
crown=[(-.82,.49,1.80),(-.14,.59,2.34),(.41,.57,2.355),(.79,.44,1.945)]
a.loft('sloped_crest',[( [(x,z-.085+h) for x,h in octagon(w,.17,.02)],y) for y,w,z in crown],'shell')
for s in [-1,1]:
 xf=matrix((s*.405,0,0))
 a.loft('fitted_crown_support_'+str(s),[( [(x,z+h) for x,h in octagon(.24,.12,.023)],y) for y,z in [(-.19,2.09),(.05,2.20),(.36,2.16),(.57,1.985)]],'graphite',xf)

# Separate forward jaw, directly traced in side profile. It wraps across the
# front with a lower middle lip; the back point meets the raised pod underside.
jaw=[(-1.04,.71),(-.95,.77),(-.57,.79),(-.49,.55),(-.115,.245),
     (-.51,.085),(-.80,.01),(-.96,.07),(-1.035,.235),(-1.092,.59)]
xs=[-.73,-.54,0,.54,.73];v=[]
for x in xs:
 t=1-abs(x)/.73
 for i,(y,z) in enumerate(jaw):
  taper={5:.93,6:.66,7:.77,8:.94}.get(i,1)
  v.append((x*taper,y-.04*t,z-(.115*t if i in [0,1,2,9] else 0)))
n=len(jaw);f=[]
for j in range(len(xs)-1):f.extend((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for i in range(n))
f.extend([tuple(range(n-1,-1,-1)),tuple((len(xs)-1)*n+i for i in range(n))])
ob=mesh('projecting_swept_jaw',v,f);bpy.context.view_layer.objects.active=ob
be=ob.modifiers.new('Jaw edge planes','BEVEL');be.width=.022;be.segments=1;bpy.ops.object.modifier_apply(modifier=be.name)
a.collect(ob,'projecting_swept_jaw','shell')

# A closed continuous white lip with its own short thickness and shared corners.
lip_rows=[(-.73,.742),(-.55,.714),(-.34,.645),(0,.626),(.34,.645),(.55,.714),(.73,.742)]
v=[]
for back in [0,.040]:
 for lower in [0,1]:
  for x,z in lip_rows:v.append((x,-1.125+.102*abs(x)+back+(lower*.006),z-.09*lower))
n=len(lip_rows);f=[]
for i in range(n-1):f.extend([(i,i+1,n+i+1,n+i),(2*n+i,3*n+i,3*n+i+1,2*n+i+1),(i,2*n+i,2*n+i+1,i+1),(n+i,n+i+1,3*n+i+1,3*n+i)])
f.extend([(0,n,3*n,2*n),(n-1,2*n-1,4*n-1,3*n-1)])
a.add('fitted_jaw_white_lip',v,f,'trim')
if not BLOCKOUT:
 plate=octagon(.79,.54,.075);xf=matrix((0,-1.087,.307),pitch=.17)
 a.loft('central_chin_armor',[(plate,.055),(plate,-.020),(scale(plate,.94),-.046)],'shell_dark',xf)
 shield=[(-.162,.115),(-.074,.141),(0,.194),(.074,.141),(.162,.115),(.142,-.071),(.075,-.155),(0,-.216),(-.075,-.155),(-.142,-.071)]
 a.loft('security_shield',[(scale(shield,.95),-.052),(scale(shield,.95),-.074)],'trim',xf)

# Rigid goggle pair: lower in the new brow profile, with a slight downward pitch.
goggle=[(-.36,.22),(.265,.22),(.39,-.055),(.24,-.25),(-.225,-.25),(-.38,-.09)]
for s in [-1,1]:
 p=goggle if s<0 else [(-x,z) for x,z in reversed(goggle)]
 xf=matrix((s*.412,-.884,1.457),pitch=.14,yaw=s*.12)
 ring('angular_goggle_frame_'+str(s),p,[(1,1,.18),(1.04,1.04,-.10),(.99,.99,-.18),(.79,.73,-.18),(.74,.68,-.13),(.74,.68,.18)],['shell_dark','shell_dark','shell_dark','detail','detail','shell_dark'],xf)
 if not BLOCKOUT:
  start=len(a.mi);a.loft('pale_blue_optic_'+str(s),[(scale(p,.746,.686),-.115),(scale(p,.73,.66),-.153),(scale(p,.49,.46),-.179)],'lens',xf,smooth=True)
  for j in range(start,len(a.mi)):a.mi[j]=1
a.poly('goggle_bridge',[(-.13,.10),(.13,.10),(.16,-.10),(-.16,-.10)],(0,-1.075,1.415),.20,'shell_dark')
brow=[(0,1.708),(.143,1.746),(.700,1.773),(.836,1.713),(.833,1.496),(.727,1.467),(.707,1.640),(.185,1.617),(.087,1.478),(0,1.478)]
for s in [-1,1]:
 for name,yfront,yback,role in [('white_brow',-1.158,-1.025,'trim'),('brow_seat',-1.035,-.51,'shell_dark')]:
  v=[(s*x,yy+.082*x,z) for yy in [yfront,yback] for x,z in brow]
  n=len(brow);f=[tuple(range(n-1,-1,-1)),tuple(n+i for i in range(n))]+[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)]
  ob=mesh(name+str(s),v,f);a.collect(ob,name+str(s),role)

# Scanner is lower/farther back. Local pitch follows its illustrated rising
# rear axis; modest outward yaw makes the front optic readable in the side view.
scanner=matrix((.99,.15,1.855),pitch=.14,yaw=.25)
circ=[(.209*math.cos(2*math.pi*i/12),.209*math.sin(2*math.pi*i/12)) for i in range(12)]
a.box('scanner_fitted_saddle',(.96,.16,1.62),(.32,.57,.19),'shell_dark',.035,1)
a.loft('faceted_scanner_housing',[(scale(circ,.87),.43),(circ,.37),(circ,-.31),(scale(circ,.94),-.37)],'shell',scanner)
for y in [-.27,.31]:a.loft('scanner_end_band',[(scale(circ,1.035),y+.042),(scale(circ,1.035),y-.042)],'shell_dark',scanner)
if not BLOCKOUT:
 ring('scanner_white_bezel',circ,[(.97,.97,-.35),(.96,.96,-.411),(.72,.72,-.427),(.68,.68,-.402),(.68,.68,-.35)],'trim',scanner)
 ring('scanner_navy_gasket',circ,[(.72,.72,-.407),(.64,.64,-.435),(.52,.52,-.435),(.52,.52,-.397)],'detail',scanner)
 a.loft('scanner_dark_lens',[(scale(circ,.55),-.40),(scale(circ,.51),-.447),(scale(circ,.28),-.466)],'screen',scanner,smooth=True)
 # The glint and strip use the scanner local coordinate system too.
 glint=[(.025*math.cos(2*math.pi*i/10),.025*math.sin(2*math.pi*i/10)) for i in range(10)]
 a.loft('scanner_cyan_glint',[( [(x-.035,z+.05) for x,z in glint],-.470)],'cyan',scanner)
 p=[(-.043,-.20),(.043,-.20),(.043,.20),(-.043,.20)]
 v=[tuple(scanner@Vector((x,y,.209))) for x,y in p];a.add('scanner_status_strip',v,[(0,1,2,3)],'cyan')
 for s in [-1,1]:a.eye((s*.275,-.920,.946),.32,.12)

output=os.environ.get('ASSET_BUILD_DIR',str(HERE));source_name=os.environ.get('ASSET_SOURCE_NAME','copilot_security_v01.blend')
a.finish(output,source_name)
obj=bpy.data.objects['security_model'];me=obj.data;me.set_sharp_from_angle(angle=math.radians(42))
bs=bpy.data.materials['security_palette'].node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.50
bs=bpy.data.materials['security_optics'].node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Strength'].default_value=.12
bpy.data.objects['anchor_action'].location=scanner@Vector((0,-.48,0))
bpy.data.objects['anchor_target'].location=(0,0,1.15)
bpy.data.objects['root']['design']='Rebuilt from user left-profile rejection: diagonal crown, raised rear, forward swept jaw; rigid accessories fitted to traced sections.'
bpy.ops.wm.save_as_mainfile(filepath=str(Path(output)/source_name))
me.calc_loop_triangles();print('SECURITY_CONTOUR',len(me.loop_triangles),'triangles; blockout',BLOCKOUT)
