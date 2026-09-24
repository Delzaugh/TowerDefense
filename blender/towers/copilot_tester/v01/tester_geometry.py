"""Tester detail-sheet refinement. Uses shared palette/assembly helpers only."""
import bpy, math, json
from pathlib import Path
from persona_quality import Maker, ellipse, rounded, matrix, signpow

def helmet(a):
    # Longitudinal sections form a domed shell with a lower, smaller face opening.
    # An explicit common belt boundary prevents a jagged material border.
    n=24
    def outline(w,h,zc,p,belt_z):
        t=math.asin(signpow((belt_z-zc)/(h/2),p/2))
        angles=[t+(math.pi-2*t)*i/16 for i in range(16)]
        angles += [math.pi-t+(math.pi+2*t)*i/8 for i in range(8)]
        return [(w/2*signpow(math.cos(q),2/p),zc+h/2*signpow(math.sin(q),2/p)) for q in angles]
    sections=[(-.76,1.70,1.52,.85,2.55),(-.53,1.91,1.76,.92,2.3),
              (-.43,1.973,1.872,.963,2.15),(-.28,2.00,1.93,.985,2.08),(.09,1.99,1.97,1.00,2.0),
              (.42,1.83,1.82,.96,2.05),(.57,1.67,1.677,.924,2.1),(.68,1.47,1.52,.88,2.15),
              (.82,1.04,1.10,.78,2.5)]
    belts=[.43]*len(sections)
    outlines=[outline(w,h,z,p,belts[j]) for j,(y,w,h,z,p) in enumerate(sections)]
    # The front section rolls back at the brow and chin. The previous constant-Y
    # section made the whole display read as a vertical slab in profile.
    def face_y(base,z,bow,tilt=0):
        return base + bow*((z-.85)/.85)**2 + tilt*(z-.85)
    v=[(x,face_y(sec[0],z,.07,.13) if j==0 else sec[0],z)
       for j,(sec,points) in enumerate(zip(sections,outlines)) for x,z in points];f=[];roles=[]
    for j in range(len(sections)-1):
        for i in range(n):
            f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
            roles.append('shell' if i<16 else 'trim')
    end=len(v);v.append((0,.91,.78))
    last=(len(sections)-1)*n
    for i in range(n):f.append((last+i,last+(i+1)%n,end));roles.append('shell' if i<16 else 'trim')
    # Thick rolled ivory surround, dark reveal and convex supported screen.
    previous=0
    for sx,sz,y,bow,tilt,role in [(1.005,1.005,-1.020,.18,.12,'trim'),(.98,.98,-1.130,.20,.15,'trim'),
                                 (.84,.83,-1.150,.16,.14,'trim'),(.817,.807,-1.090,.12,.12,'screen'),
                                 (.53,.53,-1.195,.08,.12,'screen')]:
        start=len(v);v.extend([(x*sx,face_y(y,.85+(z-.85)*sz,bow,tilt),.85+(z-.85)*sz)
                                for x,z in outlines[0]])
        for i in range(n):f.append((previous+i,previous+(i+1)%n,start+(i+1)%n,start+i));roles.append(role)
        previous=start
    center=len(v);v.append((0,-1.32,.85))
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
    for s in (-1,1):a.eye((s*.225,-1.275,.64),.285,.115)
    lens(a,'small_diagnostic',(-.50,-1.125,1.39),.283,20)
    lens(a,'large_diagnostic',(.32,-1.150,1.43),.447,28,True)
    a.box('ivory_optical_bridge',(-.139,-1.112,1.40),(.24,.15,.10),'trim',.028,2)
    for s in (-1,1):
        axis='right' if s>0 else 'left'
        def side_panel(name,c,w,h,role,r,depth):
            a.loft(name,[(rounded(w,h,r,2),depth/2),(rounded(w,h,r,2),-depth/2+.02),
                         (rounded(w-.04,h-.04,r-.02,2),-depth/2)],role,matrix(c,axis),True)
        # Swept saddle with a sloping front edge, instead of the old vertical
        # rounded rectangle that read as a flat wall from the side.
        seat=[(-.14,.46),(-.28,.41),(-.32,.26),(-.39,.02),(-.49,-.24),
              (-.43,-.42),(-.22,-.49),(.22,-.45),(.42,-.28),
              (.46,.18),(.32,.39),(.12,.46)]
        def seat_ring(scale):return [(s*x*scale,z*scale) for x,z in seat]
        a.loft('swept_ivory_side_saddle',[(seat_ring(1),.12),(seat_ring(1),-.10),
                                        (seat_ring(.95),-.14)],'trim',matrix((s*.925,.04,.82),axis),True)
        side_panel('side_teal_module',(s*1.070,.05,.84),.70,.73,'shell_dark',.18,.20)
        side_panel('side_mint_face',(s*1.173,.05,.84),.60,.63,'shell',.14,.028)
        for k in (-1,1):
            a.stroke('test_bracket',[(k*.065,.145),(k*.13,.145),(k*.13,-.145),(k*.065,-.145)],.039,(s*1.191,.05,.84),'trim',axis)
    # Face badge is turned with the cheek; its entire check remains exposed.
    a.disc('ivory_badge_seat',(.625,-1.105,.385),.205,.105,'trim',n=20)
    a.disc('teal_check_inlay',(.625,-1.166,.385),.158,.04,'shell_dark',n=20)
    a.stroke('quality_check',[(-.077,.006),(-.020,-.058),(.085,.080)],.047,(.625,-1.191,.385),'trim')
    a.panel('rear_hatch_seam',(0,.869,.85),.96,.77,'shell_dark',.14,.066,'rear',True)
    a.panel('rear_service_hatch',(0,.909,.85),.875,.685,'shell',.12,.054,'rear',True)
    for s in (-1,1):
        a.panel('rear_service_vent',(s*.715,.699,.83),.13,.38,'shell_dark',.045,.028,'rear',True)
    a.poly('rear_cradle_latch',[(-.25,-.026),(.25,-.026),(.28,0),
                                (.25,.026),(-.25,.026),(-.28,0)],
           (0,.846,.285),.006,'trim','rear')
    a.finish(output,source_name)
