"""Boundary Bridge: shaped continuous shell and fitted service assemblies."""
import bpy, bmesh, math, os, json, sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'_shared'))
from persona_quality import Maker, rounded, ellipse, matrix
OUT=Path(os.environ.get('ASSET_BUILD_DIR',str(HERE)))
m=json.loads(Path(os.environ.get('ASSET_MANIFEST',str(HERE/'asset.json'))).read_text(encoding='utf-8'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
a=Maker(m);DETAIL=os.environ.get('ARCHITECT_BLOCKOUT')!='1'
def front(x,z):return -1.01+.25*(x/1.22)**2+.34*((z-.93)/1.08)**2
def loop(w,h,zc,n=48,p=2.6):return [(x,z+zc) for x,z in ellipse(w,h,p,n)]
def surface(name,outlines,ys,roles,smooth=True,optics=False):
    n=len(outlines[0]);v=[]
    for outline,yf in zip(outlines,ys):v.extend([(x,yf(x,z) if callable(yf) else yf,z) for x,z in outline])
    fs=[];rs=[]
    for j in range(len(outlines)-1):
        for i in range(n):
            f=(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i);fs.append(f)
            rs.append(roles(j,i,v,f) if callable(roles) else roles)
    a.add(name,v,fs,rs,smooth,optics)
def cap_last(role,center,optics=False):
    off=len(a.v)-48;end=len(a.v);a.v.append(center)
    a.f.extend([(off+i,off+(i+1)%48,end) for i in range(48)]);a.r.extend([role]*48);a.s.extend([True]*48);a.mi.extend([int(optics)]*48)
outer=loop(2.43,2.10,1.07);inner=loop(1.96,1.17,.87)
surface('rounded_indigo_rear_shell',[outer]+[loop(2.43*s,2.10*s,1.07) for s in (1.01,.98,.86,.62,.28)],[front,-.27,.16,.52,.77,.89],'shell')
cap_last('shell',(0,.92,1.07))
def blend(t):return [((1-t)*x+t*u,(1-t)*z+t*w) for (x,z),(u,w) in zip(outer,inner)]
def rimrole(j,i,v,f):
    x=sum(v[k][0] for k in f)/4;z=sum(v[k][2] for k in f)/4
    return 'shell' if z>1.49 or (abs(x)<.40 and z<.37) else 'trim'
surface('continuous_face_lip',[blend(t) for t in (0,.14,.80,1)],[front,lambda x,z:front(x,z)-.045,lambda x,z:front(x,z)-.045,lambda x,z:front(x,z)+.015],rimrole)
surface('convex_screen',[inner]+[[(x*s,(z-.87)*s+.87) for x,z in inner] for s in (.72,.38)],[lambda x,z:front(x,z)+.015]*3,'screen')
cap_last('screen',(0,front(0,.87)+.015,.87))
pts=[(.55,1.60),(.55,2.06),(.69,2.17),(.95,2.08),(1.18,1.89),(1.24,1.67),(1.09,1.48),(1.02,1.28),(.89,1.31),(.85,1.53)]
for s in (-1,1):
    q=[(s*x,z) for x,z in pts]
    start=len(a.v)
    a.poly('chalk_shoulder_pillar',q,(0,0,0),1.15,'trim',bevel=.065)
    for j in range(start,len(a.v)):
        x,y,z=a.v[j];a.v[j]=(x,y+front(x,z)-.10,z)
outline=[(x,z+1.59) for x,z in rounded(1.94,.33,.09,3)]
def bow(x,z):return front(x,z)-.15
v=[];f=[];nx=9;nz=3;layer=nx*nz
for y in (0,.18):
    for j in range(nz):
        for i in range(nx):v.append((- .97+1.94*i/(nx-1),y,1.425+.33*j/(nz-1)))
for k in (0,1):
    for j in range(nz-1):
        for i in range(nx-1):
            t=k*layer+j*nx+i;f.append((t,t+1,t+nx+1,t+nx))
boundary=list(range(nx))+[j*nx+nx-1 for j in range(1,nz)]+list(range(layer-2,layer-nx-1,-1))+[j*nx for j in range(nz-2,0,-1)]
for i,t in enumerate(boundary):u=boundary[(i+1)%len(boundary)];f.append((t,u,u+layer,t+layer))
me=bpy.data.meshes.new('bridge');me.from_pydata(v,[],f);me.update();o=bpy.data.objects.new('bridge',me);bpy.context.collection.objects.link(o)
bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
bpy.context.view_layer.objects.active=o
bevel=o.modifiers.new('Broad fitted bridge bevel','BEVEL');bevel.width=.048;bevel.segments=2;bevel.limit_method='ANGLE';bpy.ops.object.modifier_apply(modifier=bevel.name)
for vv in o.data.vertices:vv.co.y+=bow(vv.co.x,vv.co.z)
if DETAIL:
    for x,w,h in [(0,.33,.12),(-.40,.31,.077),(.40,.31,.077)]:
        bpy.ops.mesh.primitive_cube_add(size=1,location=(x,bow(x,1.59),1.59));cut=bpy.context.object;cut.dimensions=(w,.28,h)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        bevel=cut.modifiers.new('Rounded slot','BEVEL');bevel.width=h*.45;bevel.segments=2;bpy.ops.object.modifier_apply(modifier=bevel.name)
        bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('True recessed slot','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
        a.panel('slot_dark_well',(x,bow(x,1.59)+.035,1.59),w+.02,h+.025,'shell_dark',h*.46,.04)
        if x==0:a.panel('amber_bridge_marker',(0,bow(0,1.59)+.016,1.59),.27,.092,'amber',.043,.033)
a.collect(o,'bowed_forehead_bridge','shell')
start=len(a.v)
a.panel('indigo_chin_keystone',(0,0,.145),.72,.235,'shell',.067,.10)
for j in range(start,len(a.v)):
    x,y,z=a.v[j];a.v[j]=(x,y+front(x,z)-.025,z)
for s in (-1,1):
    eyes=[[(x+s*.33,z+.84) for x,z in rounded(.17,.43,.085,4)] for j in range(2)]
    surface('cyan_eye_capsule',eyes,[lambda x,z:front(x,z)+.011,lambda x,z:front(x,z)-.012],'cyan',True,True)
    n=len(eyes[0]);off=len(a.v)-n;end=len(a.v);a.v.append((s*.33,front(s*.33,.84)-.017,.84))
    a.f.extend([(off+i,off+(i+1)%n,end) for i in range(n)]);a.r.extend(['cyan']*n);a.s.extend([True]*n);a.mi.extend([1]*n)
def bezel(name,c,w,h,innerw,innerh,role,axis='front'):
    out=rounded(w,h,min(w,h)*.28,3);inside=rounded(innerw,innerh,min(innerw,innerh)*.43,3);n=len(out)
    rings=[(out,.16),(out,-.07),([(x*.94,z*.96) for x,z in out],-.105),(inside,-.105),(inside,.015)]
    v=[(x,y,z) for shape,y in rings for x,z in shape];f=[]
    for j in range(len(rings)):f.extend([(j*n+i,j*n+(i+1)%n,((j+1)%len(rings))*n+(i+1)%n,((j+1)%len(rings))*n+i) for i in range(n)])
    a.add(name,v,f,role,False,False,matrix(c,axis))
for s in (-1,1):
    a.panel('cartridge_mount',(s*1.21,-.09,1.01),.36,.79,'shell_dark',.11,.52)
    a.panel('cartridge_body',(s*1.39,-.08,1.01),.57,.99,'trim',.17,.59)
    bezel('slate_cartridge_rim',(s*1.40,-.45,1.01),.48,.85,.28,.62,'slate')
    bezel('indigo_recessed_socket',(s*1.40,-.52,1.01),.31,.68,.15,.48,'shell')
    a.panel('socket_dark_well',(s*1.40,-.514,1.01),.18,.52,'shell_dark',.08,.04)
    if DETAIL:a.panel('vertical_amber_capsule',(s*1.40,-.559,1.01),.115,.43,'amber',.055,.04)
if DETAIL:
    bezel('rear_service_panel_rim',(0,.85,1.08),.58,.58,.44,.44,'trim','rear')
    a.panel('recessed_rear_panel',(0,.909,1.08),.45,.45,'shell_dark',.085,.035,'rear')
    a.stroke('rear_Y_groove',[(0,.15),(0,.015),(-.13,-.12)],.023,(0,.935,1.08),'screen','rear',.009)
    a.stroke('rear_Y_branch',[(0,.015),(.13,-.12)],.023,(0,.935,1.08),'screen','rear',.009)
    for x,z in [(0,.15),(-.13,-.12),(.13,-.12)]:a.panel('rear_amber_node',(x,.945,z+1.08),.067,.067,'amber',.019,.025,'rear')
OUT.mkdir(parents=True,exist_ok=True)
a.finish(OUT,os.environ.get('ASSET_SOURCE_NAME','copilot_architect_v01.blend'))
