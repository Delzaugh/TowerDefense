"""Tester detail-sheet refinement. Uses shared palette/assembly helpers only."""
import bpy, math, json
from pathlib import Path
from persona_quality import Maker, ellipse, rounded, matrix, signpow

def helmet(a):
    # Longitudinal sections form a domed shell with a lower, smaller face opening.
    # An explicit common belt boundary prevents a jagged material border.
    n=28
    def outline(w,h,zc,p):
        t=math.asin(signpow((.43-zc)/(h/2),p/2))
        angles=[t+(math.pi-2*t)*i/18 for i in range(18)]
        angles += [math.pi-t+(math.pi+2*t)*i/10 for i in range(10)]
        return [(w/2*signpow(math.cos(q),2/p),zc+h/2*signpow(math.sin(q),2/p)) for q in angles]
    sections=[(-.76,1.70,1.52,.85,2.55),(-.59,1.91,1.76,.92,2.3),
              (-.43,1.973,1.872,.963,2.15),(-.28,2.00,1.93,.985,2.08),(.09,1.99,1.97,1.00,2.0),
              (.42,1.83,1.82,.96,2.05),(.57,1.67,1.677,.924,2.1),(.68,1.47,1.52,.88,2.15),
              (.82,1.04,1.10,.78,2.5)]
    outlines=[outline(w,h,z,p) for y,w,h,z,p in sections]
    v=[(x,sec[0],z) for sec,points in zip(sections,outlines) for x,z in points];f=[];roles=[]
    for j in range(len(sections)-1):
        for i in range(n):
            f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
            roles.append('shell' if i<18 else 'trim')
    end=len(v);v.append((0,.91,.78))
    last=(len(sections)-1)*n
    for i in range(n):f.append((last+i,last+(i+1)%n,end));roles.append('shell' if i<18 else 'trim')
    # Thick rolled ivory surround, dark reveal and convex supported screen.
    previous=0
    for sx,sz,y,role in [(1.005,1.005,-.79,'trim'),(.98,.98,-.835,'trim'),
                            (.84,.83,-.849,'trim'),(.817,.807,-.816,'screen'),
                            (.53,.53,-.864,'screen')]:
        start=len(v);v.extend([(x*sx,y,.85+(z-.85)*sz) for x,z in outlines[0]])
        for i in range(n):f.append((previous+i,previous+(i+1)%n,start+(i+1)%n,start+i));roles.append(role)
        previous=start
    center=len(v);v.append((0,-.881,.85))
    for i in range(n):f.append((previous+i,previous+(i+1)%n,center));roles.append('screen')
    a.add('domed_helmet_continuous_ivory_cradle_and_display',v,f,roles,True)

def lens(a,name,c,r,n,scallop=False):
    # Scalloping is confined to the OUTER rim; optical opening stays circular.
    inner=r-.071 if r<.35 else r-.086
    v=[];f=[]
    for radius,y,tooth in [(r*.97,.13,True),(r,.008,True),(r*.96,-.055,True),(inner,-.065,False),(inner,.115,False)]:
        for i in range(n):
            t=2*math.pi*i/n
            rr=radius*(1+.025*math.cos(math.pi*i) if scallop and tooth else 1)
            v.append((rr*math.cos(t),y,rr*math.sin(t)))
    for j in range(5):
        for i in range(n):f.append((j*n+i,j*n+(i+1)%n,((j+1)%5)*n+(i+1)%n,((j+1)%5)*n+i))
    xf=matrix(c,pitch=-.08,yaw=.045 if c[0]>0 else -.08)
    a.add(name+'_ivory_bezel',v,f,'trim',True,xf=xf)
    v=[];f=[]
    for rr,y in [(inner,.055),(inner,-.037),(inner*.65,-.095)]:
        v.extend([(rr*math.cos(2*math.pi*i/n),y,rr*math.sin(2*math.pi*i/n)) for i in range(n)])
    v.append((0,-.12,0));f.append(tuple(range(n-1,-1,-1)))
    for j in range(2):
        for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    for i in range(n):f.append((2*n+i,2*n+(i+1)%n,3*n))
    a.add(name+'_domed_dark_glass',v,f,'lens',True,True,xf)

def build(manifest_path,output,source_name):
    m=json.loads(Path(manifest_path).read_text(encoding='utf-8-sig'))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    a=Maker(m);helmet(a)
    for s in (-1,1):a.eye((s*.225,-.88,.64),.285,.115)
    lens(a,'small_diagnostic',(-.50,-.849,1.39),.283,24)
    lens(a,'large_diagnostic',(.32,-.864,1.43),.447,32,True)
    a.box('ivory_optical_bridge',(-.139,-.81,1.40),(.24,.15,.10),'trim',.028,2)
    for s in (-1,1):
        axis='right' if s>0 else 'left'
        def side_panel(name,c,w,h,role,r,depth):
            a.loft(name,[(rounded(w,h,r,2),depth/2),(rounded(w,h,r,2),-depth/2+.02),
                         (rounded(w-.04,h-.04,r-.02,2),-depth/2)],role,matrix(c,axis),True)
        # The broad ivory seat penetrates the shell; no detached ear stalk.
        side_panel('side_ivory_seat',(s*.925,-.03,.82),.90,.94,'trim',.24,.24)
        side_panel('side_teal_module',(s*1.070,-.06,.84),.70,.73,'shell_dark',.18,.20)
        side_panel('side_mint_face',(s*1.173,-.06,.84),.60,.63,'shell',.14,.028)
        for k in (-1,1):
            a.stroke('test_bracket',[(k*.065,.145),(k*.13,.145),(k*.13,-.145),(k*.065,-.145)],.039,(s*1.191,-.06,.84),'trim',axis)
    # Face badge is turned with the cheek; its entire check remains exposed.
    a.disc('ivory_badge_seat',(.625,-.823,.385),.205,.105,'trim',n=20)
    a.disc('teal_check_inlay',(.625,-.884,.385),.158,.04,'shell_dark',n=20)
    a.stroke('quality_check',[(-.077,.006),(-.020,-.058),(.085,.080)],.047,(.625,-.909,.385),'trim')
    a.panel('rear_hatch_seam',(0,.861,.78),.82,.68,'shell_dark',.13,.047,'rear',True)
    a.panel('rear_service_hatch',(0,.889,.78),.772,.631,'shell',.11,.041,'rear',True)
    a.panel('rear_cradle_latch',(0,.848,.31),.53,.071,'trim',.028,.072,'rear',True)
    a.finish(output,source_name)
