"""Three original reference-guided bookshelf/work lounges; front +Z, metres."""
import math, random
from pod_tools import Pod, rounded_rect

def brick_wall(m,width,z,y,h):
    m.box('Mortared brick backing',0,z,y,width,.12,h,'mortar',0)
    rows=int(h/.19)
    for row in range(rows):
        by=y-h/2+.095+row*.19
        count=int(width/.40)+1
        for col in range(count):
            left=-width/2+col*.40+(row%2)*.20;right=min(left+.375,width/2-.012);left=max(left,-width/2+.012)
            if right-left>.035:m.box('Staggered warehouse brick',(left+right)/2,z+.072,by,right-left,.038,.165,'brick' if (row+col)%7 else 'walnut',.008)

def lamp(m,x,z,y,side=False):
    m.cylinder('Lamp shade',x,z,y,.21,.15,'dark',18)
    m.cone('Tapered black lamp top',x,z,y+.10,.21,.11,.17,'dark')
    m.cylinder('Warm inner diffuser',x,z,y-.083,.172,.019,'ivory',18,kind='warm_light')
    m.beam('Lamp stem',(x,z,y+.18),(x,z,y+.34),.035,'dark')
    m.beam('Lamp wall bracket',(x,z,y+.34),(x+.17 if side else x,z if side else z-.18,y+.34),.035,'dark')

def quilt(m,x,z,y,width,height,side=False):
    # True padded diamond tiles with a narrow fabric seam between adjacent diamonds.
    cols=max(3,round(width/.24));dx=width/cols;dy=.16;rows=round(height/(dy/2))
    for row in range(rows):
        yy=y-height/2+(row+.5)*height/rows
        for col in range(cols):
            u=-width/2+(col+.5)*dx+(row%2)*dx/2
            if u+dx/2>width/2:continue
            diamond=[(u,yy+dy*.47),(u+dx*.47,yy),(u,yy-dy*.47),(u-dx*.47,yy)]
            m.profile('Diamond upholstery',diamond,x,z,.030,'ivory',side=side,kind='fabric')

def wood_grain(m,width,z,y,h):
    for i in range(max(2,int(width/.34))):
        x=-width/2+.16+i*.34
        m.box('Wide oak grain stripe',x,z,y,.011,.009,h,'grain',0)

def bookshelf(m):
    b=m.box;m.group('Bookshelf shell and genuine side niche')
    b('Grounded cabinet plinth',0,0,.075,1.60,2.20,.15,'oak_edge',.025)
    b('Roof oak panel',0,0,3.135,1.60,2.20,.13,'oak',.025)
    b('Rear oak panel',0,-1.04,1.65,1.60,.12,3.03,'oak',.02)
    b('Reading back oak panel',.735,-.22,1.65,.13,1.54,3.03,'oak',.02)
    b('Seated niche structural back',.38,-.20,1.61,.10,1.51,1.82,'oak_edge',.015)
    # Continuous shell with a real rounded rectangular through-cut on the negative-X side.
    outer=rounded_rect(2.20,3.05,.05,1.675);inner=[(u-.20,y) for u,y in rounded_rect(1.50,1.92,.20,1.57)]
    m.ring('Side opening oak frame',outer,inner,-.735,0,.13,'oak',side=True)
    m.ring('Padded niche perimeter',[(u-.20,y) for u,y in rounded_rect(1.55,1.97,.22,1.57)],[(u-.20,y) for u,y in rounded_rect(1.41,1.82,.17,1.57)],-.660,0,.075,'ivory',side=True,kind='fabric')
    b('Niche raised seat support',0,-.20,.425,1.42,1.52,.55,'oak_edge',.02)
    b('Broad side reading cushion',-.20,-.20,.76,1.06,1.49,.18,'fabric',.055,kind='fabric')
    b('Quilted inside backing',.307,-.20,1.62,.042,1.50,1.74,'fabric',.012,kind='fabric')
    quilt(m,.275,-.20,1.62,1.47,1.71,side=True)
    lamp(m,.13,-.32,2.15,side=True)
    # Book end-cap faces +Z, structurally separate from the occupied side niche.
    b('Bookshelf deep backing',0,.616,1.61,1.45,.09,2.72,'oak_edge',.01)
    for x in (-.742,.742):b('Bookcase upright',x,.857,1.52,.116,.49,2.73,'oak',.02)
    rng=random.Random(91)
    for row,shelf in enumerate((.19,.65,1.11,1.57,2.03)):
        b('Oak book shelf',0,.85,shelf,1.42,.47,.085,'oak',.01)
        # Leave a clear bust display niche on the third shelf, as pictured.
        if row==3:continue
        cursor=-.65;j=0
        while cursor<.64:
            w=rng.choice((.052,.064,.078,.090));height=rng.uniform(.26,.37)
            if cursor+w>.68:break
            x=cursor+w/2;role=('bordeaux','blue','paper','green','gold','walnut','red','purple')[j%8]
            b('Varied book spine',x,.894,shelf+.052+height/2,w,.34,height,role,.004)
            for yy in (shelf+.092,shelf+height-.015):b('Spine label band',x,1.067,yy,w*.81,.008,.011,'paper',0)
            cursor+=w+.012;j+=1
    m.group('Bust halo and fittings')
    b('Bust display foot',0,.91,1.638,.49,.30,.048,'paper',.014)
    m.sphere('Bust shoulders',0,.86,1.728,(.21,.12,.095),'walnut')
    m.cylinder('Bust neck',0,.84,1.804,.063,.08,'walnut')
    m.sphere('Tiny sculptural head',0,.85,1.891,(.093,.083,.105),'walnut')
    m.sphere('Hair cap',-.018,.80,1.938,(.095,.076,.058),'oak_edge')
    b('Circular light backing panel',0,.828,2.77,1.38,.06,.60,'oak',.02)
    m.cylinder('Warm circular halo',0,.891,2.77,.26,.024,'ivory',28,axis='z',kind='warm_light')
    m.cylinder('Oak circular light disk',0,.912,2.77,.225,.025,'oak_edge',28,axis='z')
    m.anchor('anchor_seat',-.12,-.20,.85);m.anchor('anchor_books',0,1.10,1.50)

def worklounge(m):
    b=m.box;m.group('Full depth oak lounge enclosure')
    b('Grounded raised base',0,0,.20,6,2.40,.40,'oak',.035)
    b('Upper oak roof',0,0,3.12,6,2.40,.16,'oak',.025)
    for x in (-2.92,2.92):b('Deep side oak enclosure',x,0,1.76,.16,2.40,2.72,'oak',.025)
    outer=rounded_rect(6,2.84,.04,1.78);inner=rounded_rect(4.78,2.19,.25,1.665)
    m.ring('Broad rounded rectangle oak opening',outer,inner,0,1.12,.16,'oak')
    m.ring('Padded rounded inset edge',rounded_rect(4.80,2.22,.26,1.665),rounded_rect(4.65,2.07,.22,1.665),0,1.024,.08,'ivory',kind='fabric')
    for side in (-1,1):
        for i in range(3):b('Vertical oak front grain',side*(2.52+i*.13),1.208,1.68,.008,.006,2.27,'grain',0)
    m.group('Brick niche and tailored seating')
    brick_wall(m,5.70,-1.11,1.74,2.76)
    b('Long seat support',0,-.09,.48,4.63,1.98,.22,'oak_edge',.035)
    for x in (-1.55,0,1.55):b('Long tailored seat cushion',x,-.07,.675,1.50,1.80,.19,'fabric',.055,kind='fabric')
    for x in (-2.23,2.23):
        b('Upholstered side lining',x,-.01,1.64,.06,1.86,1.79,'fabric',.022,kind='fabric')
        quilt(m,x+(-.041 if x>0 else .041),-.04,1.61,1.81,1.70,side=True)
    for x,z,role in [(-1.92,-.75,'ivory'),(1.95,-.75,'fabric')]:
        m.profile('Relaxed reading pillow',rounded_rect(.67,.65,.10,1.02),x,z,.30,role,kind='fabric')
    lamp(m,1.99,-.83,2.30)
    # A thin integrated shelf is useful without blocking the occupied opening.
    b('Inset work shelf',-1.27,.42,.86,.73,.39,.07,'oak_edge',.017)
    b('Open book lower cover',-1.28,.42,.91,.39,.24,.045,'bordeaux',.003)
    b('Open book paper',-1.28,.42,.94,.35,.21,.020,'paper',0)
    m.anchor('anchor_seat',0,0,.77);m.anchor('anchor_opening',0,1.25,1.68)

def recessed(m):
    b=m.box;m.group('Dark framed raised work nook')
    b('Raised oak platform',0,0,.215,4.5,2.4,.43,'oak',.035)
    b('Warm step riser inset',0,1.172,.248,4.13,.035,.046,'ivory',0,kind='warm_light')
    for i in range(15):b('Platform plank seam',-2.1+i*.30,.42,.435,.008,1.46,.006,'oak_edge',0)
    for x in (-2.135,2.135):b('Deep graphite side frame',x,0,1.79,.23,2.40,2.82,'dark',.02)
    b('Dark upper portal frame',0,0,3.045,4.5,2.40,.31,'dark',.025)
    b('Dark backdrop',0,-1.13,1.75,4.10,.14,2.70,'dark',.018)
    b('Warehouse timber inside rear',-.61,-1.018,1.94,.26,.14,2.50,'oak_edge',.025)
    for k in range(3):b('Timber broad grain mark',-.65+k*.047,-.938,1.97,.013,.015,2.36,'grain',0)
    m.group('Couch cushions and work details')
    b('Sofa lower body',.15,-.25,.68,3.50,1.48,.37,'walnut',.06,kind='fabric')
    b('Back cushion body',.15,-.88,1.12,3.51,.27,.97,'fabric',.07,kind='fabric')
    for x in (-1.17,-.29,.59,1.47):b('Tailored seating',x,-.17,.925,.84,1.25,.18,'walnut',.06,kind='fabric')
    for x,z,role in [(-1.15,-.67,'fabric'),(-.3,-.73,'walnut'),(.85,-.66,'fabric'),(1.44,-.72,'ivory')]:
        m.profile('Large loose sofa pillow',rounded_rect(.65,.68,.095,1.26),x,z,.28,role,kind='fabric')
    # Folded striped throw spills over the front edge, with deliberately enlarged tassels.
    b('Throw across cushion',1.10,.14,1.035,.84,.88,.029,'paper',.01,kind='fabric')
    b('Throw drape',1.10,.593,.75,.84,.030,.56,'paper',.009,kind='fabric')
    for x in (.84,1.01,1.18,1.35):
        b('Throw woven stripe',x,.15,1.055,.064,.87,.011,'dark',0,kind='fabric')
        b('Throw front stripe',x,.615,.75,.064,.011,.56,'dark',0,kind='fabric')
    for i in range(10):b('Throw fringe',.72+i*.082,.62,.433,.023,.025,.088,'paper',0,kind='fabric')
    b('Narrow rear ledge',0,-.903,1.55,3.88,.28,.075,'oak',.015)
    for x in (-1.72,-1.07):
        m.beam('Folding side table crossed leg',(x-.18,.67,.47),(x+.18,.98,.98),.029,'gold')
        m.beam('Folding side table crossed leg',(x+.18,.67,.47),(x-.18,.98,.98),.029,'gold')
    b('Folding side table',-1.39,.83,1.00,.84,.46,.065,'oak',.02)
    m.cylinder('Mug',-1.43,.83,1.12,.071,.17,'paper',14)
    m.cylinder('Mug coffee',-1.43,.83,1.213,.057,.01,'walnut',14)
    m.cylinder('Lantern lower base',1.66,-.89,1.634,.116,.07,'red',14)
    m.cylinder('Lantern warm core',1.66,-.89,1.775,.069,.22,'ivory',14,kind='warm_light')
    for x in (1.555,1.765):m.beam('Lantern safety cage',(x,-.89,1.65),(x,-.89,1.92),.020,'red')
    m.cone('Lantern cap',1.66,-.89,1.945,.115,.06,.09,'red',14)
    for x in (1.60,1.72):m.beam('Lantern carrying handle',(x,-.89,1.97),(x,-.89,2.075),.020,'dark')
    m.beam('Lantern handle top',(1.60,-.89,2.075),(1.72,-.89,2.075),.020,'dark')
    b('Open work laptop lower',-.46,-.03,1.046,.43,.31,.035,'dark',.007)
    b('Open laptop upright',-.46,-.178,1.19,.43,.025,.28,'dark',.01)
    b('Laptop screen',-.46,-.160,1.195,.371,.009,.22,'blue',0)
    m.anchor('anchor_seat',.15,-.10,1.015);m.anchor('anchor_opening',0,1.25,1.80)

def build(asset,folder):
    m=Pod(asset,folder);{'gh_bookshelf_pod':bookshelf,'gh_worklounge_pod':worklounge,'gh_recessed_lounge':recessed}[asset](m);m.save()
