"""Developer Tower. Forward = Blender -Y; Z is authoring up.
Local geometry owns the reference silhouette; shared Maker handles mesh/palette IO.
"""
import bpy, os, sys, json, math
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_shared'))
from persona_quality import Maker, matrix
m = json.loads(Path(os.environ.get('ASSET_MANIFEST', HERE/'asset.json')).read_text(encoding='utf-8-sig'))
bpy.ops.wm.read_factory_settings(use_empty=True)
a = Maker(m)
def scale(poly,sx,sz,z=0):return [(x*sx,zz*sz+z) for x,zz in poly]
def octagon(w,h,c=.20):
    return [(-w/2+c,h/2),(-w/2,h/2-c),(-w/2,-h/2+c),(-w/2+c,-h/2),(w/2-c,-h/2),(w/2,-h/2+c),(w/2,h/2-c),(w/2-c,h/2)]
def ring(name,outer,inner,center,role,axis='front',depth=.15,bevel=.035):
    n=len(outer)
    rings=[(outer,depth),(outer,bevel),(scale(outer,.94,.94),0),(inner,0),(scale(inner,.98,.98),bevel),(inner,depth)]
    v=[(x,y,z) for p,y in rings for x,z in p]
    f=[(j*n+i,j*n+(i+1)%n,((j+1)%6)*n+(i+1)%n,((j+1)%6)*n+i) for j in range(6) for i in range(n)]
    a.add(name,v,f,role,xf=matrix(center,axis))

# Continuous shell, cheek border and inset face share perimeter vertices.
outline=[(-.57,.85),(-.84,.64),(-.93,.40),(-.93,-.30),(-.84,-.61),(-.57,-.85),(.57,-.85),(.84,-.61),(.93,-.30),(.93,.40),(.84,.64),(.57,.85)]
rings=[(scale(outline,.91,.91,.88),-.70),(scale(outline,1,1,.88),-.49),(scale(outline,1,1,.88),.27),(scale(outline,.87,.88,.85),.68),(scale(outline,.72,.75,.84),.80)]
n=len(outline);v=[(x,y,z) for p,y in rings for x,z in p];f=[];roles=[]
for j in range(4):
    for i in range(n):
        face=(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i);f.append(face)
        mid=sum(v[k][2] for k in face)/4
        roles.append('shell' if mid>1.24 or (j<2 and mid>.39) else 'graphite')
f.append(tuple(range(4*n,5*n)));roles.append('graphite');last=0
for p,y,role in [(scale(outline,.84,.82,.88),-.735,'shell'),(scale(outline,.81,.79,.88),-.703,'detail'),(scale(outline,.57,.55,.88),-.753,'screen')]:
    start=len(v);v.extend((x,y,z) for x,z in p)
    for i in range(n):f.append((last+i,last+(i+1)%n,start+(i+1)%n,start+i));roles.append(role)
    last=start
v.append((0,-.772,.88));c=len(v)-1
for i in range(n):f.append((last+i,last+(i+1)%n,c));roles.append('screen')
a.add('continuous_helmet_casing_and_inset_face',v,f,roles)
chin=[(-.79,.48),(-.73,.23),(-.43,.035),(.43,.035),(.73,.23),(.79,.48),(.68,.53),(.61,.35),(.37,.18),(-.37,.18),(-.61,.35),(-.68,.53)]
a.poly('continuous_chin_guard',chin,(0,-.805,0),.18,'graphite',bevel=.025)
for s in (-1,1):a.eye((s*.225,-.775,.665),.31,.115)

# Closed frames, shared bevel loops, separate inset curved lenses.
goggle=[(-.31,.29),(-.41,.13),(-.38,-.13),(-.24,-.30),(.24,-.30),(.38,-.13),(.41,.13),(.31,.29)]
for s in (-1,1):
    center=(s*.435,-.955,1.30);inner=scale(goggle,.70,.65)
    ring('goggle_frame_'+str(s),goggle,inner,center,'graphite',depth=.25)
    ring('goggle_inner_gasket_'+str(s),scale(inner,1.035,1.04),scale(inner,.94,.94),(center[0],center[1]+.014,center[2]),'detail',depth=.05,bevel=.009)
    vr=[]
    for p,y in [(scale(inner,.98,.98),.045),(scale(inner,.72,.72),.022),(scale(inner,.30,.30),.012)]:vr.extend((x,y,z) for x,z in p)
    vr.append((0,.01,0));fr=[]
    for j in range(2):fr.extend((j*8+i,j*8+(i+1)%8,(j+1)*8+(i+1)%8,(j+1)*8+i) for i in range(8))
    fr.extend((16+i,16+(i+1)%8,24) for i in range(8));fr.append(tuple(range(7,-1,-1)))
    a.add('inset_teal_lens_'+str(s),vr,fr,'lens',True,True,matrix(center))
a.box('solid_goggle_bridge',(0,-.854,1.30),(.18,.20,.20),'graphite',.025,1)

# Three layered swept cooling fins with genuinely open trailing channels.
def blade(name,sections):
    loops=[]
    for y,w,z,t in sections:
        p=[(-w*.5+.025,t*.5),(-w*.5,t*.5-.025),(-w*.5,-t*.5+.025),(-w*.5+.025,-t*.5),(w*.5-.025,-t*.5),(w*.5,-t*.5+.025),(w*.5,t*.5-.025),(w*.5-.025,t*.5)]
        loops.append(([(x,zz+z) for x,zz in p],y))
    a.loft(name,loops,'shell')
blade('upper_integrated_cooling_fin',[(-.67,.32,1.59,.15),(-.38,.56,1.98,.22),(.03,.68,2.10,.25),(.86,.57,2.20,.12),(1.14,.49,2.22,.075)])
blade('middle_integrated_cooling_fin',[(-.57,1.19,1.50,.19),(-.19,1.49,1.72,.21),(.30,1.47,1.84,.21),(1.12,1.29,1.97,.11),(1.19,1.22,1.98,.065)])
blade('lower_integrated_cooling_fin',[(-.12,1.64,1.29,.23),(.23,1.72,1.41,.23),(.66,1.65,1.53,.20),(1.12,1.47,1.68,.11),(1.16,1.38,1.69,.06)])
a.box('upper_channel_radiator',(0,.43,1.91),(.45,.48,.17),'detail',.025,1)
a.box('lower_channel_radiator',(0,.55,1.64),(.85,.38,.14),'detail',.022,1)

# Seated octagonal housings and continuous mitered curly braces on both temples.
for s in (-1,1):
    axis='right' if s>0 else 'left'
    a.loft('temple_mount_'+str(s),[(octagon(.73,.76,.15),.08),(octagon(.73,.76,.15),-.09)],'shell_dark',matrix((s*.90,.06,.84),axis))
    a.loft('ivory_temple_housing_'+str(s),[(octagon(.87,.90,.19),.11),(octagon(.92,.95,.20),.02),(octagon(.84,.87,.18),-.085)],'trim',matrix((s*1.03,.06,.84),axis))
    a.loft('inset_graphite_code_badge_'+str(s),[(octagon(.72,.74,.15),.02),(octagon(.74,.76,.16),-.025),(octagon(.66,.68,.14),-.07)],'graphite',matrix((s*1.132,.06,.84),axis))
    for k in (-1,1):
        pts=[(k*.075,.185),(k*.13,.17),(k*.13,.06),(k*.173,.015),(k*.173,-.015),(k*.13,-.06),(k*.13,-.17),(k*.075,-.185)]
        a.stroke('continuous_code_brace_'+str(s)+'_'+str(k),pts,.043,(s*1.210,.06,.84),'trim',axis,depth=.012)
rear_start=len(a.r)
a.rear_hatch((0,.775,.57),1.13,.65,'graphite',2,'detail')
for i in range(rear_start,len(a.r)):
    if a.r[i]=='shell_dark':a.r[i]='detail'
a.finish(os.environ.get('ASSET_BUILD_DIR',str(HERE)),os.environ.get('ASSET_SOURCE_NAME','copilot_developer_v01.blend'))
