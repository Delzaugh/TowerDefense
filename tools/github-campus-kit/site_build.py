"""Eight reusable, metrically authored site and structural modules."""
import os, json, math, sys
from pathlib import Path
from site_tools import initialize

PALETTE={'wood':'#A77B55','oak':'#D8B990','grain':'#8F6749','dark':'#232925',
 'steel':'#48647D','concrete':'#B6BFB8','chalk':'#E2EDF0','paving':'#D9DED8',
 'green':'#0FBF3E','leaf':'#70B5B4','forest':'#4D855B','orange':'#E97538',
 'soil':'#4C443C','gold':'#E8B75C','wine':'#803647','white':'#F2F5F3'}

def clipped(poly,axis,bound,less):
    output=[]
    for i,p in enumerate(poly):
        q=poly[(i+1)%len(poly)]
        pin=p[axis]<=bound if less else p[axis]>=bound
        qin=q[axis]<=bound if less else q[axis]>=bound
        if pin:output.append(p)
        if pin!=qin:
            t=(bound-p[axis])/(q[axis]-p[axis])
            output.append(tuple(p[j]+t*(q[j]-p[j]) for j in range(2)))
    return output

def build(folder,asset_id):
    material='github_site_palette';m=initialize(PALETTE,material,folder);b=m.box
    if asset_id=='gh_floor_wood':
        b('Continuous wood floor backing',0,0,.055,6,6,.11,'grain',0)
        for row in range(12):
            z=-2.75+row*.5;offset=.98 if row%2 else 0
            for k in range(-1,4):
                left=max(-3,-3+k*2+offset);right=min(3,-3+(k+1)*2+offset)
                if right-left<.025:continue
                role=('wood','oak','wood','wood')[(row+k)%4]
                b('Staggered solid oak floorboard',(left+right)/2,z,.145,right-left-.018,.48,.07,role,0)
                if right-left>.7:
                    b('Quiet inset grain stroke',(left+right)/2,z-.10,.1804,(right-left)*.57,.009,.001,'grain',0)
        m.group('Staggered oak floor');m.anchor('anchor_floor',0,0,.18)
    elif asset_id=='gh_floor_paving':
        b('Paving tile bed',0,0,.05,6,6,.10,'concrete',0)
        for x in range(4):
            for z in range(4):
                b('Chamfered large-format paver',-2.25+x*1.5,-2.25+z*1.5,.14,1.48,1.48,.08,'paving' if (x+z)%3 else 'white',.015)
        m.group('Large-format campus paving');m.anchor('anchor_floor',0,0,.18)
    elif asset_id=='gh_floor_hex':
        b('Hex floor grout bed',0,0,.055,6,6,.11,'dark',0)
        radius=.375
        for ix in range(-6,7):
            for iz in range(-6,7):
                cx=ix*radius*1.5;cz=(iz+(.5 if ix%2 else 0))*radius*math.sqrt(3)
                poly=[(cx+radius*.975*math.cos(k*math.pi/3),cz+radius*.975*math.sin(k*math.pi/3)) for k in range(6)]
                for axis,bound,less in [(0,-3,False),(0,3,True),(1,-3,False),(1,3,True)]:
                    if poly:poly=clipped(poly,axis,bound,less)
                if len(poly)<3:continue
                n=len(poly);verts=[(x,z,y) for y in (.11,.18) for x,z in poly]
                faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(k,(k+1)%n,(k+1)%n+n,k+n) for k in range(n)]
                role='white' if (ix*7+iz*3)%11>2 else ('chalk' if (ix+iz)%3 else 'steel')
                m.mesh('Inset hexagonal cafe tile',verts,faces,role)
        m.group('Laid cafe hexagon tiles');m.anchor('anchor_floor',0,0,.18)
    elif asset_id=='gh_timber_frame':
        for x in (-2.82,2.82):
            for z in (-2.82,2.82):
                b('Iron post shoe',x,z,.09,.44,.44,.18,'dark',.02)
                b('Exposed restored timber post',x,z,2.23,.33,.33,4.28,'wood',.035)
                b('Post grain inset',x+.17,z,2.30,.013,.06,3.65,'grain',0)
                b('Iron post collar',x,z,4.10,.40,.40,.15,'dark',.012)
        for z in (-2.82,2.82):b('Heavy transverse girder',0,z,4.38,6,.38,.52,'wood',.04)
        for x in (-2.82,2.82):b('Heavy longitudinal girder',x,0,4.37,.36,5.64,.50,'wood',.035)
        for x in (-1.8,-.6,.6,1.8):b('Exposed ceiling joist',x,0,4.49,.14,5.61,.25,'oak',.025)
        for x in (-2.82,2.82):
            for z in (-2.82,2.82):
                inward=-1 if x>0 else 1
                m.beam('Fitted diagonal knee brace',(x,z,3.58),(x+inward*.60,z,4.12),.14,.14,'wood')
        m.group('Exposed timber structure');m.anchor('anchor_next_bay',6,0,0)
    elif asset_id=='gh_stairs':
        # Twenty actual treads, open steel stringers and handrail with fitted supports.
        count=20;run=.325;rise=.25
        for i in range(count):
            z=3.25-(i+.5)*run;y=(i+1)*rise
            b('Industrial oak stair tread',0,z,y-.055,2.65,run+.018,.11,'oak',.014)
            b('Stair tread steel nosing',0,z+run/2-.01,y-.02,2.67,.055,.042,'dark',0)
        for x in (-1.26,1.26):
            m.beam('Continuous steel stair stringer',(x,3.29,.13),(x,-3.27,4.94),.13,.21,'steel')
        for x in (-1.42,1.42):
            for i in range(0,count,3):
                z=3.25-(i+.5)*run;y=(i+1)*rise
                b('Stair balustrade upright',x,z,y+.48,.07,.07,.96,'dark',0)
            m.beam('Continuous fitted oak handrail',(x,3.24,1.1),(x,-3.38,6.03),.105,.105,'wood')
            m.beam('Horizontal mid guard cable',(x,3.24,.75),(x,-3.38,5.68),.025,.025,'dark')
        for x in (-1.24,1.24):
            b('Top landing support',x,-3.38,2.50,.15,.15,5,'steel',.02)
        b('Small upper landing',0,-3.36,4.945,2.65,.36,.11,'oak',.015)
        m.group('Industrial stair flight');m.anchor('anchor_bottom',0,3.25,0);m.anchor('anchor_top',0,-3.5,5)
    elif asset_id=='gh_planter':
        b('Chamfered concrete planter body',0,0,.36,2,1.2,.72,'concrete',.065)
        for z in (-.57,.57):b('Planter fitted longitudinal rim',0,z,.745,2.08,.15,.15,'chalk',.025)
        for x in (-.97,.97):b('Planter fitted end rim',x,0,.745,.15,1,.15,'chalk',.025)
        b('Recessed living soil',0,0,.737,1.77,.91,.035,'soil',0)
        for i,(x,z,r) in enumerate([(-.57,-.09,.48),(.05,.1,.56),(.62,-.13,.43)]):
            m.ico('Broad faceted shrub',x,z,1.0,r,'forest',(1,.78,.65))
            m.ico('Layered new foliage',x-.08,z+.02,1.31,r*.75,'leaf',(.9,.72,.68))
            m.ico('Green leaf accent',x+.19,z-.08,1.29,r*.36,'green',(1,.8,.8))
        m.group('Concrete planter and foliage')
    elif asset_id=='gh_tree':
        m.cone('Faceted tapered trunk',0,0,1.37,.20,.115,2.74,'wood',9)
        for a in (.6,2.8,4.8):
            m.beam('Branch seated into trunk',(0,0,1.8),(math.cos(a)*1.05,math.sin(a)*1.05,3.4),.15,.15,'wood')
        m.ico('Broad asymmetric crown',-.25,.02,4.13,1.88,'forest',(1,.9,.93))
        m.ico('Front foliage plane',.73,.50,3.69,1.28,'leaf',(1.1,.86,.8))
        m.ico('Upper canopy planes',-.44,-.15,4.75,1.17,'leaf',(.96,.95,.92))
        m.ico('Sunlit small canopy',-1.00,.49,4.03,.93,'green',(1,.9,.85))
        m.cylinder('Tree planting ring',0,0,.045,.65,.09,'concrete',16)
        m.cylinder('Tree inset soil',0,0,.094,.54,.008,'soil',16)
        m.group('Branching campus shade tree')
    elif asset_id=='gh_courtyard':
        b('Contribution garden stone bed',0,0,.10,8,6,.20,'concrete',.045)
        b('Inset garden living turf',0,0,.206,7.7,5.7,.014,'forest',0)
        for x in range(14):
            for z in range(7):
                role=('leaf','forest','green','chalk')[(x*3+z*7+x*z)%4]
                b('Raised contribution garden paver',-3.12+x*.48,-1.45+z*.48,.24,.42,.42,.065,role,.008)
        # Concrete / wood benches integrate into garden edge, not into the walking lane.
        for z in (-2.6,2.6):
            for x in (-1.7,1.7):b('Concrete bench pier',x,z,.45,.40,.48,.50,'concrete',.025)
            for dz in (-.17,0,.17):b('Continuous oak seat plank',0,z+dz,.725,4.2,.15,.10,'oak',.014)
        for x,z in [(-3.55,-2.45),(3.55,2.45)]:
            b('Courtyard bollard footing',x,z,.275,.30,.30,.15,'dark',.02)
            b('Warm courtyard light post',x,z,.83,.18,.18,1,'steel',.022)
            b('Courtyard lantern frame',x,z,1.43,.29,.29,.24,'dark',.024)
            for dz in (-.151,.151):b('Lantern warm pane',x,z+dz,1.43,.19,.012,.15,'gold',0)
        m.group('Contribution garden with integrated seating')
    elif asset_id=='gh_membrane_wall':
        # Continuous 304.8mm wall thickness follows the documented one-foot assembly.
        radius=5.5;thickness=.3048;count=24
        for k in range(count):
            a=-.79+k*1.58/count;c=-.79+(k+1)*1.58/count
            verts=[]
            for y in (0,3.2):
                for r,t in [(radius-thickness/2,a),(radius-thickness/2,c),(radius+thickness/2,c),(radius+thickness/2,a)]:
                    verts.append((r*math.sin(t),-radius+r*math.cos(t),y))
            m.mesh('Continuous curved luminous membrane segment',verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'white')
            for y in (.12,3.08):
                m.beam('Continuous fine LED perimeter seam',(radius*math.sin(a),-radius+radius*math.cos(a)+.158,y),(radius*math.sin(c),-radius+radius*math.cos(c)+.158,y),.028,.028,'chalk')
        m.group('Curved translucent-white membrane assembly')
        # Deliberately opaque membrane representation: gentle emissive response, no alpha sorting.
        shader=m.material.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Emission Color'].default_value=(.8,.9,.85,1)
        shader.inputs['Emission Strength'].default_value=.18
        for x in (-2.3,2.3):b('Membrane floor fixing shoe',x,-.45,.035,.30,.55,.07,'concrete',.01)
        m.group('Membrane mounting shoes')
    elif asset_id=='gh_ceiling_services':
        emitter=m.material.copy();emitter.name='github_service_lights'
        ebs=emitter.node_tree.nodes.get('Principled BSDF');ebs.inputs['Emission Color'].default_value=(.85,.9,.8,1);ebs.inputs['Emission Strength'].default_value=.65
        obj=m.cylinder('Faceted galvanized duct main',-.65,-.35,.48,.19,4.7,'concrete',16);obj.rotation_euler[1]=math.pi/2
        obj=m.cylinder('Faceted duct outlet',2.10,.725,.48,.19,1.25,'concrete',16);obj.rotation_euler[0]=math.pi/2
        for x in (-2.8,-1.7,-.6,.5,1.45):
            obj=m.cylinder('Raised duct flange',x,-.35,.48,.217,.052,'chalk',16);obj.rotation_euler[1]=math.pi/2
        for z in (.22,1.14):
            obj=m.cylinder('Outlet fitted flange',2.10,z,.48,.217,.052,'chalk',16);obj.rotation_euler[0]=math.pi/2
        verts=[]
        for i in range(9):
            a=-math.pi/2+i*math.pi/16
            for j in range(16):
                phi=j*2*math.pi/16;r=.45+.19*math.cos(phi)
                verts.append((1.65+r*math.cos(a),.1+r*math.sin(a),.48+.19*math.sin(phi)))
        faces=[(i*16+j,i*16+(j+1)%16,(i+1)*16+(j+1)%16,(i+1)*16+j) for i in range(8) for j in range(16)]
        faces.extend([tuple(reversed(range(16))),tuple(range(128,144))])
        m.mesh('Continuous fitted quarter-turn duct elbow',verts,faces,'concrete')
        for x in (-2.3,0,1.5):
            b('Duct suspension tie',x,-.35,.84,.035,.035,.36,'dark',0)
            b('Ceiling mount shoe',x,-.35,1.055,.18,.18,.09,'steel',.01)
        for z in (-1.05,1.05):
            b('Suspended strip light housing',-.3,z,.12,4.9,.15,.14,'dark',.015)
            light=b('Broad warm LED diffuser',-.3,z,.025,4.74,.127,.05,'white',0)
            light.data.materials.clear();light.data.materials.append(emitter)
            for x in (-2.2,1.6):b('Strip light suspension wire',x,z,.59,.024,.024,.9,'steel',0)
        m.group('Exposed warehouse ceiling services')
    elif asset_id=='gh_indoor_park':
        b('Indoor park floor tray',0,0,.06,6,4,.12,'grain',.02)
        b('Inset indoor turf',.4,0,.135,4.6,3.7,.035,'forest',0)
        for i in range(6):b('Timber park edge board',-2.78+i*.23,0,.145,.21,3.7,.05,'oak',.01)
        def chair(x,z):
            for lx in (-.39,.39):
                m.beam('Adirondack splayed front leg',(x+lx,z+.40,.12),(x+lx,z+.30,.55),.10,.10,'oak')
                m.beam('Adirondack rear support',(x+lx,z-.46,.12),(x+lx,z+.06,.50),.10,.10,'oak')
                b('Adirondack broad armrest',x+lx,z,.69,.19,.85,.08,'wood',.018)
                m.beam('Armrest forward fitted support',(x+lx,z+.26,.34),(x+lx,z+.26,.65),.09,.09,'wood')
            for i in range(5):
                xx=x-.30+i*.15
                m.beam('Angled Adirondack seat slat',(xx,z+.42,.46),(xx,z-.29,.33),.132,.06,'oak')
                m.beam('Broad fanned Adirondack back slat',(xx,z-.30,.35),(xx+(i-2)*.018,z-.61,1.08-abs(i-2)*.03),.132,.055,'wood')
            m.beam('Chair back transverse brace',(x-.4,z-.50,.84),(x+.4,z-.50,.84),.08,.08,'grain')
        chair(-.45,-.75);chair(1.15,.75)
        m.cylinder('Indoor park cafe table',.20,.20,.58,.42,.10,'oak',14)
        m.cylinder('Park table pedestal',.20,.20,.28,.08,.51,'dark',10)
        m.cylinder('Park table foot',.20,.20,.145,.29,.05,'dark',14)
        b('Park end planter',2.43,-1.2,.34,.73,.8,.40,'concrete',.035)
        m.ico('Park layered leafy plant',2.43,-1.2,.87,.59,'leaf',(.6,.65,1.1))
        m.group('Indoor park turf and Adirondack seating')
    else:raise ValueError(asset_id)
    m.root['asset_id']=asset_id;m.root['design_intent']='Authored stylized GitHub campus interpretation, not measured as-built geometry.'
    m.save(asset_id+'_v01.blend')

if __name__=='__main__':
    folder=Path(os.environ['ASSET_MANIFEST']).resolve().parent
    build(folder,json.loads((folder/'asset.json').read_text(encoding='utf8'))['id'])
