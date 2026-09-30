"""Original static office ensembles, authored in metre X/Z ground coordinates."""
import math, os, re, xml.etree.ElementTree as ET
from pathlib import Path
import bpy
from mathutils import Vector
from props_tools import initialize

PALETTE={'wood':'#BF9465','wood_dark':'#835739','mahogany':'#77483B','dark':'#232925','paper':'#F2F5F3','slate':'#89A4B8','screen':'#153F50','green':'#0FBF3E','leaf':'#70B5B4','gold':'#E9B864','purple':'#8534F3','blue':'#5579B8','bordeaux':'#7C354D','stone':'#D2D0C5','bronze':'#98794C','bronze_dark':'#65583C'}

def sphere(m,name,x,z,y,scale,role,segments=16,rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=(x,-z,y))
    o=bpy.context.object;o.scale=scale;return m.finish(o,name,role)

def tube(m,name,points,radius,role,sides=8):
    pts=[Vector((x,-z,y)) for x,z,y in points];verts=[]
    for i,p in enumerate(pts):
        tangent=(pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)]).normalized()
        ref=Vector((0,0,1)) if abs(tangent.z)<.92 else Vector((0,1,0))
        u=tangent.cross(ref).normalized();v=tangent.cross(u).normalized()
        verts.extend([p+radius*(u*math.cos(j*2*math.pi/sides)+v*math.sin(j*2*math.pi/sides)) for j in range(sides)])
    faces=[]
    for i in range(len(pts)-1):
        for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
    faces.extend([tuple(range(sides-1,-1,-1)),tuple((len(pts)-1)*sides+j for j in range(sides))])
    return m.mesh(name,[(v.x,-v.y,v.z) for v in verts],faces,role)

def chair(m,x,z,role='dark',angle=0):
    # Local seating assembly, front+Z. Rotate about own center before joining.
    start=len(m.parts);b=m.box
    b('Chair cushion',x,z,.49,.62,.62,.14,role,.05)
    b('Chair back cushion',x,z+.27,.87,.64,.13,.61,role,.045)
    for dx in (-.25,.25):
        for dz in (-.23,.23):b('Chair metal leg',x+dx,z+dz,.23,.06,.06,.46,'dark',0)
    for dx in (-.32,.32):
        b('Chair armrest',x+dx,z,.71,.075,.51,.065,'wood',.015)
        b('Chair arm support',x+dx,z-.16,.60,.045,.045,.25,'dark',0)
    if angle:
        c=Vector((x,-z,0));rot=math.radians(-angle)
        from mathutils import Matrix
        mat=Matrix.Rotation(rot,4,'Z')
        for o in m.parts[start:]:o.location=c+mat@(o.location-c);o.rotation_euler.z+=rot

def mug(m,x,z,y):
    m.cylinder('Coffee saucer',x,z,y,.14,.025,'paper',12)
    m.cone('Coffee cup',x,z,y+.105,.068,.094,.18,'paper',12)
    m.cylinder('Coffee surface',x,z,y+.198,.077,.012,'dark',12)
    tube(m,'Cup handle',[(x+.077,z,y+.05),(x+.13,z,y+.055),(x+.145,z,y+.10),(x+.13,z,y+.15),(x+.085,z,y+.16)],.018,'paper',6)

def workstation(m):
    b=m.box
    b('Solid oak butcher block',0,-.34,.79,2.25,.88,.12,'wood',.045)
    for x in (-.9,.9):
        b('Iron desk frame',x,-.34,.39,.10,.69,.72,'dark',.02)
        b('Iron desk foot',x,-.34,.065,.37,.82,.10,'dark',.02)
    b('Desk rear cross member',0,-.66,.38,1.87,.065,.08,'dark',0)
    b('Monitor foot',-.40,-.53,.87,.38,.25,.04,'dark',.01)
    b('Monitor stem',-.40,-.62,1.03,.085,.07,.28,'dark',0)
    b('Monitor casing',-.40,-.62,1.30,.96,.09,.56,'dark',.035)
    b('Screen inset',-.40,-.567,1.30,.86,.015,.46,'screen',0)
    for row,w in enumerate((.29,.47,.36,.53)):
        b('Readable code line',-.65+w/2,-.555,1.44-row*.09,w,.018,.025,'leaf' if row%2 else 'paper',0)
    b('Keyboard',-.4,-.19,.868,.57,.21,.035,'slate',.008)
    b('Laptop base',.59,-.21,.865,.46,.32,.032,'slate',0)
    o=b('Open laptop display',.59,-.35,1.015,.46,.025,.28,'dark',.01);o.rotation_euler.x=math.radians(-12)
    b('Laptop screen',.59,-.329,1.03,.40,.018,.205,'green',0)
    mug(m,.91,-.46,.857)
    chair(m,0,.47,'blue');m.group('Oak workstation and upholstered task chair')

def meeting(m):
    b=m.box;b('Thick mahogany conference slab',0,0,.87,4.9,1.60,.15,'mahogany',.06)
    for x in (-1.7,1.7):
        b('Trestle angled-look foot',x,0,.10,.88,1.23,.20,'wood_dark',.04)
        b('Trestle panel',x,0,.46,.23,.95,.72,'wood_dark',.045)
    b('Trestle connecting rail',0,0,.38,3.5,.16,.16,'wood_dark',.02)
    for x in (-1.70,-.57,.57,1.70):
        chair(m,x,1.21,'bordeaux',0);chair(m,x,-1.21,'bordeaux',180)
    b('Table cable grommet',0,0,.953,.60,.24,.015,'dark',0)
    for x in (-1.7,1.7):mug(m,x,.46,.953)
    b('Shared laptop base',.78,.25,.978,.48,.32,.04,'slate',0)
    b('Shared laptop lid',.78,.08,1.13,.48,.045,.30,'dark',.01)
    m.group('Mahogany meeting table eight chairs and fittings')

def library(m):
    b=m.box
    # Three genuinely open reading bays: broad rectangular side portals and central arch.
    b('Bookcase plinth',0,-.46,.09,6,1.03,.18,'wood',.04)
    b('Bookcase upper lintel',0,-.46,2.86,6,1.03,.33,'wood',.03)
    for x in (-2.94,-1.10,1.10,2.94):b('Bookcase upright',x,-.46,1.51,.15,1.03,2.86,'wood',.025)
    for x in (-2,2):
        b('Reading niche rear',x,-.975,1.28,1.68,.08,1.95,'wood_dark',.025)
        b('Sit-in reading cushion',x,-.42,.57,1.53,.83,.20,'bordeaux',.045)
        b('Niche upper bookshelf',x,-.46,2.43,1.68,1.02,.13,'wood',.015)
        for j in range(10):
            h=.30+(j%3)*.09;b('Book spine',x-.66+j*.145,-.29,2.50+h/2,.10,.37,h,('paper','leaf','bordeaux','blue')[j%4],.005)
    # True curved opening assembled from eight closed arch segments, with central negative space.
    outer=1.08;inner=.87;cy=1.63
    for i in range(10):
        a=i*math.pi/10;c=(i+1)*math.pi/10
        p=[(outer*math.cos(a),-.99,cy+outer*math.sin(a)),(outer*math.cos(c),-.99,cy+outer*math.sin(c)),(inner*math.cos(c),-.99,cy+inner*math.sin(c)),(inner*math.cos(a),-.99,cy+inner*math.sin(a))]
        verts=p+[(x,.045,y) for x,z,y in p];m.mesh('Curved oak niche arch',verts,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],'wood')
    for x in (-.98,.98):b('Central arch jamb',x,-.46,1.02,.22,1.03,1.21,'wood',.015)
    b('Central niche seat',0,-.48,.51,1.76,.86,.16,'blue',.04)
    b('Central niche rear panel',0,-1.005,1.41,1.76,.055,1.77,'wood_dark',0)
    # Paired front carrels carry signature burgundy folded screens.
    for x in (-1.5,1.5):
        b('Carrel oak desk',x,.72,.77,1.34,.69,.12,'wood',.02)
        b('Burgundy carrel rear screen',x,.40,1.20,1.39,.065,.81,'bordeaux',.015)
        for dx in (-.65,.65):b('Burgundy carrel wing',x+dx,.72,1.18,.065,.66,.85,'bordeaux',.015)
        for dx in (-.54,.54):b('Carrel iron leg',x+dx,.72,.36,.075,.075,.72,'dark',0)
        b('Reading book',x,.70,.85,.34,.28,.05,'paper',0)
    m.group('Pale oak sit-in library and burgundy carrels')

def cafe(m):
    b=m.box
    b('Coffee bar boarded base',0,.15,.60,5.8,.78,1.20,'wood_dark',.035)
    for i in range(18):b('Bar oak plank',-2.70+i*.318,.556,.59,.295,.04,1.13,'wood',.006)
    b('Warm butcherblock bar top',0,.15,1.24,6,.99,.15,'wood',.04)
    for x in (-2,-.67,.67,2):
        m.cylinder('Oak stool seat',x,1.0,.78,.28,.10,'wood',12)
        for dx,dz in [(-.18,-.17),(.18,-.17),(-.18,.17),(.18,.17)]:
            m.beam('Stool iron leg',(x+dx*1.3,1+dz*1.3,0),(x+dx,1+dz,.74),.055,.055,'dark')
        b('Stool footrest',x,1.22,.29,.43,.04,.045,'dark',0)
    b('Back bar counter',0,-.97,.80,5.8,.43,.12,'stone',.025)
    b('Back bar tile wall',0,-1.24,1.48,6,.13,2.96,'paper',.03)
    for y in (1.79,2.34):
        b('Suspended bottle shelf',0,-.985,y,5.6,.44,.08,'wood',.015)
        for j in range(12):
            x=-2.50+j*.45;m.cylinder('Coffee bar bottle',x,-1.01,y+.17,.072,.27,('leaf','gold','wood_dark')[j%3],8)
            m.cylinder('Bottle neck',x,-1.01,y+.35,.033,.10,'dark',8)
    b('Espresso machine body',-1.95,-.84,1.11,.76,.36,.53,'slate',.045)
    b('Espresso dark face',-1.95,-.638,1.15,.65,.045,.30,'dark',.015)
    for dx in (-.18,.18):b('Espresso group handle',-1.95+dx,-.51,1.04,.07,.19,.07,'dark',0)
    for x in (-1,1):mug(m,x,.19,1.325)
    m.group('Warm oak coffee bar bottle shelves espresso and stools')

def lounge(m):
    b=m.box
    def sofa(x,z,width,role):
        b('Lounge soft base',x,z,.32,width,.94,.34,role,.09)
        b('Lounge soft back',x,z-.42,.69,width,.23,.79,role,.08)
        for dx in (-width/2+.15,width/2-.15):b('Sofa rounded arm',x+dx,z,.57,.30,.93,.52,role,.07)
        n=max(1,round(width/.75))
        for i in range(n):b('Separate tailored seat cushion',x-width/2+.32+(i+.5)*(width-.64)/n,z+.05,.56,(width-.68)/n,.69,.18,role,.045)
        for dx in (-width/2+.22,width/2-.22):b('Sofa wood foot',x+dx,z,.085,.13,.64,.17,'wood_dark',0)
    sofa(-.9,-.68,2.75,'blue');sofa(1.63,.28,1.3,'purple')
    m.cylinder('Trunk style coffee table',-.80,.76,.29,.64,.55,'wood',14)
    m.cylinder('Blackened table top',-.80,.76,.59,.65,.07,'dark',14)
    mug(m,-.90,.76,.63);b('Coffee table magazine',-.5,.73,.65,.26,.33,.035,'paper',0)
    m.group('Blue and purple lounge with stump coffee table')

def pendant(m):
    b=m.box;b('Black industrial suspension beam',0,0,1.44,3,.14,.17,'dark',.02)
    for x in (-1.1,0,1.1):
        m.cylinder('Pendant ceiling cable',x,0,.91,.019,1.03,'dark',6)
        m.cone('Pendant shade',x,0,.30,.32,.15,.31,'dark',12)
        m.cylinder('Pendant warm disc',x,0,.147,.27,.025,'gold',12)
        sphere(m,'Visible filament globe',x,0,.074,(.11,.11,.074),'gold',12,6)
    m.group('Three suspended warehouse pendants')

def thinktocat(m):
    b=m.box
    # Tapered stone plinth and rock seat support the reflective pose.
    verts=[(-.81,-.72,0),(.81,-.72,0),(.81,.72,0),(-.81,.72,0),(-.66,-.61,.77),(.66,-.61,.77),(.66,.61,.77),(-.66,.61,.77)]
    m.mesh('Tapered chalk stone plinth',verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'paper')
    m.ico('Sculpture rock seat',0,-.03,1.08,.62,'bronze_dark',(1,.82,.65))
    sphere(m,'Seated bronze body',0,-.04,1.42,(.49,.40,.59),'bronze',16,8)
    # Large round head resolves proportions first: broad forehead, small lowered muzzle.
    sphere(m,'Bronze thinking cat head',-.04,.13,2.40,(.97,.67,.84),'bronze',20,10)
    for x in (-.66,.58):
        verts=[(x-.24,-.10,2.91),(x+.23,-.10,2.98),(x+.02,-.12,3.35),(x-.19,.21,2.93),(x+.18,.21,2.98),(x+.01,.18,3.28)]
        m.mesh('Distinct bronze cat ear',verts,[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)],'bronze')
    sphere(m,'Inset lowered face',-.04,.73,2.19,(.62,.052,.46),'bronze_dark',16,8)
    for x in (-.29,.21):
        # Downward eyelids read thoughtfulness rather than a staring generic cat.
        tube(m,'Contemplative eyelid',[(x-.10,.793,2.21),(x,.811,2.17),(x+.10,.793,2.21)],.022,'bronze',6)
    sphere(m,'Bronze cat nose',-.04,.819,2.06,(.08,.07,.055),'bronze',10,6)
    # Five curved extremities, one curled against chin, one crossing elbow, two feet, tail.
    tube(m,'Chin supporting tentacle',[(-.32,.15,1.05),(-.38,.52,1.37),(-.30,.66,1.67),(-.24,.78,1.89),(-.08,.80,1.97),(.09,.79,1.94)],.12,'bronze',10)
    tube(m,'Crossed reflective tentacle',[(.43,-.01,1.51),(.53,.38,1.64),(.35,.68,1.57),(.07,.76,1.42),(-.05,.71,1.27)],.115,'bronze',10)
    tube(m,'Left seated foot',[(-.30,0,1.30),(-.49,.30,1.09),(-.56,.56,.87),(-.36,.68,.83)],.135,'bronze',10)
    tube(m,'Right seated foot',[(.23,0,1.31),(.44,.28,1.05),(.57,.53,.86),(.43,.67,.84)],.135,'bronze',10)
    tube(m,'Curved rear tentacle tail',[(.37,-.27,1.29),(.72,-.39,1.45),(.98,-.29,1.66),(1.04,-.10,1.91),(.93,.02,2.06)],.11,'bronze',10)
    b('Plinth plaque',0,.728,.44,.68,.018,.18,'bronze_dark',0)
    m.group('Original low-poly reflective bronze Octocat monument')

def parse_svg(d):
    tokens=re.findall(r'[MLCZmlcz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',d);i=0;cmd=None;point=(0.,0.);start=(0.,0.);paths=[];path=[]
    def num():
        nonlocal i
        v=float(tokens[i]);i+=1;return v
    while i<len(tokens):
        if tokens[i].isalpha():cmd=tokens[i];i+=1
        if cmd in ('Z','z'):
            if path:paths.append(path);path=[]
            point=start;cmd=None;continue
        relative=cmd.islower()
        if cmd.upper() in ('M','L'):
            p=(num(),num());p=(p[0]+point[0],p[1]+point[1]) if relative else p
            if cmd.upper()=='M':
                if path:paths.append(path)
                path=[p];start=p;cmd='l' if relative else 'L'
            else:path.append(p)
            point=p
        elif cmd.upper()=='C':
            p1=(num(),num());p2=(num(),num());p3=(num(),num())
            if relative:p1=(p1[0]+point[0],p1[1]+point[1]);p2=(p2[0]+point[0],p2[1]+point[1]);p3=(p3[0]+point[0],p3[1]+point[1])
            p0=point
            for j in range(1,9):
                t=j/8;v=1-t;path.append((v**3*p0[0]+3*v*v*t*p1[0]+3*v*t*t*p2[0]+t**3*p3[0],v**3*p0[1]+3*v*v*t*p1[1]+3*v*t*t*p2[1]+t**3*p3[1]))
            point=p3
        else:raise ValueError('Unsupported SVG command '+str(cmd))
    if path:paths.append(path)
    return paths

def sign(m,folder):
    b=m.box;b('Monument stone footing',0,0,.15,5,.55,.30,'stone',.04)
    b('GitHub graphite sign slab',0,0,1.45,5,.39,2.50,'dark',.055)
    svg=folder/'references/official/GitHub Logos/SVG/GitHub_Lockup_White.svg'
    curve=bpy.data.curves.new('Exact official GitHub white lockup','CURVE');curve.dimensions='2D';curve.fill_mode='BOTH';curve.extrude=.007
    for elem in ET.parse(svg).iter():
        if elem.tag.endswith('path'):
            for path in parse_svg(elem.attrib['d']):
                s=curve.splines.new('POLY');s.points.add(len(path)-1)
                for pt,(x,y) in zip(s.points,path):pt.co=((x-208)*.0093,(47.5-y)*.0093,0,1)
                s.use_cyclic_u=True
    o=bpy.data.objects.new('Unmodified official vector logo lockup',curve);bpy.context.scene.collection.objects.link(o);o.location=(0,-.209,1.61);o.rotation_euler.x=math.pi/2
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');o=bpy.context.object;m.finish(o,'Unmodified official vector logo lockup','paper')
    b('Sign subtle foundation green bar',0,.205,.58,3.50,.018,.075,'green',0)
    m.group('GitHub monument sign and official logo')

def contribution(m):
    b=m.box
    # Contribution grid resolves an Invertocat-inspired negative-space silhouette from front.
    for x in (-3.90,3.90):b('Artwork black upright',x,0,3,.09,.09,6,'dark',0)
    for y in (.08,5.95):b('Artwork top bottom rail',0,0,y,7.9,.09,.09,'paper',0)
    cols=23;rows=17;spacing=.335
    for col in range(cols):
        x=(col-(cols-1)/2)*spacing
        b('Suspended artwork vertical wire',x,-.11,3,.012,.012,5.86,'stone',0)
        for row in range(rows):
            y=.34+row*spacing; nx=x/3.0;ny=(y-3.0)/2.4
            face=(nx*nx/.62**2+(ny-.03)**2/.46**2)<1
            ears=(abs(nx)>.31 and abs(nx)<.59 and ny>.27 and ny<.62 and ny<.85-abs(nx)*.5)
            stem=(abs(nx)<.20 and ny<-.22 and ny>-.84)
            body=(abs(nx)<.45 and ny<-.26 and ny>-.45)
            tail=(nx<-.36 and nx>-.66 and ny<-.3 and ny>-.58)
            if face or ears or stem or body or tail:continue
            depth=math.sin(col*.7+row*.4)*.50
            o=b('Rounded green contribution plate',x,depth,y,.27,.035,.27,'green' if (row+col)%3 else 'leaf',.02)
            o.rotation_euler.z=math.radians((col%3-1)*12)
            # Short transverse suspension arms prevent visually floating plates.
            if abs(depth+.11)>.05:m.beam('Plate hanging depth spacer',(x,-.11,y+.10),(x,depth,y+.10),.012,.012,'stone')
    m.group('Green suspended contribution plate field with cat negative space')

def roof(m):
    b=m.box
    m.cylinder('Concrete circular chess table top',0,0,.85,.85,.13,'stone',20)
    m.cone('Concrete pedestal',0,0,.42,.29,.18,.72,'stone',12)
    m.cylinder('Concrete pedestal foot',0,0,.06,.53,.12,'stone',12)
    # Clear inlaid chessboard, with sparse original game pieces.
    for ix in range(8):
        for iz in range(8):b('Chess board inset',-.35+ix*.10,-.35+iz*.10,.921,.098,.098,.014,'dark' if (ix+iz)%2 else 'paper',0)
    for x,z,role in [(-.25,-.35,'paper'),(.05,-.35,'paper'),(.25,.35,'dark'),(-.15,.25,'dark')]:
        m.cone('Chess pawn base',x,z,.963,.039,.025,.067,role,8);sphere(m,'Chess pawn head',x,z,1.01,(.030,.030,.030),role,8,4)
    for x,z in [(-1.70,.2),(1.70,.2)]:
        for dx in (-.55,.55):b('Bench concrete support',x+dx,z,.22,.23,.65,.44,'stone',.035)
        for k in range(4):b('Bench oak seat slat',x,z-.25+k*.17,.49,1.55,.14,.12,'wood',.02)
        for k in range(3):b('Bench oak back slat',x,z-.31,.71+k*.15,1.55,.10,.11,'wood',.02)
        for dx in (-.6,.6):b('Bench steel back upright',x+dx,z-.34,.70,.06,.06,.53,'dark',0)
    b('Concrete integrated planter',0,-1.30,.36,2,.85,.72,'stone',.045)
    b('Planter inset earth',0,-1.30,.73,1.83,.68,.035,'wood_dark',0)
    for x in (-.63,0,.63):m.ico('Roof planter foliage',x,-1.30,.97,.35,'leaf',(1,.8,.9))
    m.group('Concrete chess table oak benches and roof planter')

FUNCTIONS={'gh_workstation':workstation,'gh_meeting_set':meeting,'gh_library':library,'gh_cafe_bar':cafe,'gh_lounge':lounge,'gh_pendant':pendant,'gh_thinktocat':thinktocat,'gh_sign':sign,'gh_contribution_art':contribution,'gh_roof_furniture':roof}
def build(asset_id,folder):
    m=initialize(PALETTE,asset_id+'_palette',folder)
    if asset_id=='gh_sign':sign(m,folder)
    else:FUNCTIONS[asset_id](m)
    m.group('Remaining office details');m.root['interpretation']='Research-informed original modular GitHub office interpretation, not as-built geometry.'
    m.save(asset_id+'_v01.blend')
