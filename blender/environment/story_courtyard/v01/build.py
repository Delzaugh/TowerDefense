"""Authored warm coffee courtyard; x positive is the unobstructed escape route."""
import sys, math
from pathlib import Path
folder=Path(__file__).resolve().parent; sys.path.insert(0,str(folder))
from model_tools import initialize
palette={'stone':'#CBBBA3','paving':'#E6D1AE','paper':'#E2EDF0','slate':'#89A4B8','glass':'#35566B','teal':'#70B5B4','wood':'#A77B55','terra':'#C57857','leaf':'#69966B','dark':'#333E48','gold':'#E8B75C','cream':'#F2E3C9'}
m=initialize(palette,'courtyard_palette',folder); b=m.box

# A true paved courtyard, with small chamfered corners and consistent grout.
b('Ground slab',0,-1,-.145,24,18,.18,'stone',.07)
for ix in range(16):
    for iz in range(9):
        x=-11.25+ix*1.5; z=-5.35+iz*1.45
        b('Laid sandstone paver',x,z,-.025,1.47,1.42,.05,'paving',0)
for x in (-11.5,11.5): b('Continuous courtyard edging',x,-.4,-.012,.18,15.5,.07,'stone',0)
m.group('Courtyard paving')

# Facades establish a friendly campus rather than a dark sci-fi set.
b('Coffee house lower body',0,-7.9,1.65,14.2,2.25,3.3,'cream',.07)
b('Coffee house upper body',0,-8.05,4.36,14.2,1.95,2.12,'paper',.07)
b('Long recessed roof cornice',0,-8.05,5.53,14.6,2.3,.22,'slate',.045)
b('Terracotta roof coping',0,-8.05,5.72,14.8,2.38,.16,'terra',.025)
b('Facade horizontal sill course',0,-6.755,3.38,14.3,.17,.22,'stone',.02)
for x in (-6.4,-3.1,0,3.1,6.4): b('Pilaster stone foot',x,-6.73,1.61,.20,.18,3.18,'stone',.025)
for x,z,w,d,h,role in [(-9.4,-6.65,4.6,5.1,7.2,'terra'),(9.5,-7.65,4.7,3.2,6.5,'slate')]:
    b('Campus side building',x,z,h/2,w,d,h,role,.07)
    b('Side building rim',x,z,h+.08,w+.25,d+.2,.22,'paper',.03)
    for level in (1.65,3.75,5.85):
        for dx in (-1.1,1.1):
            b('Side window frame',x+dx,z+d/2+.035,level,1.12,.12,1.22,'cream',.03)
            b('Recessed side window',x+dx,z+d/2+.1,level,.91,.035,.99,'glass',0)
            b('Window transom',x+dx,z+d/2+.123,level,1,.025,.08,'paper',0)
            b('Window mullion',x+dx,z+d/2+.125,level,.07,.03,1.03,'paper',0)
m.group('Warm campus architecture')

# Repeated upper-floor windows have real framing, inset depths and broad shutters.
for x in (-5.15,-2.55,0,2.55,5.15):
    b('Upper window stone surround',x,-7.04,4.38,1.54,.18,1.45,'stone',.03)
    b('Upper window dark glazing',x,-6.928,4.38,1.27,.04,1.2,'glass',0)
    b('Upper window middle mullion',x,-6.90,4.38,.065,.025,1.2,'cream',0)
    b('Upper window transom',x,-6.90,4.39,1.27,.025,.065,'cream',0)
    for dx in (-.99,.99): b('Broad painted shutter',x+dx,-6.94,4.38,.30,.07,1.31,'teal',.025)
    b('Deep window sill',x,-6.81,3.64,1.76,.28,.14,'cream',0)
# Cafe front: three display bays, welcoming central door, geometric cup emblem.
for x in (-4.15,0,4.15):
    b('Cafe fitted dark frame',x,-6.70,1.69,2.48,.20,2.45,'wood',.025)
    b('Cafe glazing inset',x,-6.585,1.80,2.22,.04,1.95,'glass',0)
    b('Cafe window mullion',x,-6.557,1.80,.09,.02,1.95,'cream',0)
    b('Cafe window lower rail',x,-6.55,.82,2.27,.025,.14,'wood',0)
    b('Cafe window transom',x,-6.55,2.47,2.27,.025,.09,'cream',0)
    # Warm shelves and stylized pastries belong inside window seats.
    b('Display shelf',x,-6.54,1.16,1.94,.12,.08,'gold',0)
    for dx in (-.57,0,.57): m.cone('Coffee takeaway cup',x+dx,-6.44,1.36,.10,.13,.30,'cream',8)
for x in (-6.32,6.32):
    b('Cafe entrance frame',x,-6.65,1.42,.85,.17,2.78,'wood',.022)
    b('Cafe door glass',x,-6.55,1.68,.63,.045,1.74,'glass',0)
    b('Door gold handle',x+.23,-6.50,1.12,.055,.06,.34,'gold',0)
b('Cafe sign wooden backing',0,-6.60,3.02,3.8,.14,.47,'wood',.015)
# No fragile tiny text: cup icon and three coffee-bean marks read in a close shot.
b('Cup sign body',-.78,-6.513,3.05,.32,.045,.22,'cream',0)
b('Cup sign handle',-.54,-6.51,3.05,.085,.06,.13,'cream',0)
for x in (-.17,.36,.89): m.ico('Sign coffee bean',x,-6.50,3.05,.115,'gold',(.55,.32,1.0))

# A continuous sloping awning is geometrically shaped, with short valance strips.
for i in range(18):
    x=-6.57+i*.73; role='teal' if i%2==0 else 'cream'
    verts=[(x,-6.55,3.23),(x+.73,-6.55,3.23),(x+.73,-5.47,2.88),(x,-5.47,2.88),
           (x,-6.55,3.15),(x+.73,-6.55,3.15),(x+.73,-5.47,2.80),(x,-5.47,2.80)]
    m.mesh('Striped fitted canvas awning',verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)],role)
    b('Short awning valance',x+.365,-5.44,2.72,.73,.065,.25,role,0)
for x in (-6.55,6.55): m.beam('Awning side bracket',(x,-6.58,2.7),(x,-5.46,2.85),.08,.08,'wood')
m.group('Cafe fittings and awning')

# Deep-set landscaping frames the actors; no prop occupies center/escape corridor.
for x,z in [(-6.9,-2.2),(6.4,-3.4),(-9,4.7),(9.1,5.5)]:
    b('Planter base',x,z,.27,1.65,1.32,.54,'stone',.065)
    b('Planter fitted lip',x,z,.57,1.82,1.47,.16,'cream',.035)
    b('Inset planter soil',x,z,.653,1.54,1.19,.025,'dark',0)
    for dx,dz,scale in [(-.40,-.17,1),(.15,.23,1.1),(.49,-.23,.8)]:
        m.ico('Angular broad foliage',x+dx,z+dz,1.02,.51,'leaf',(scale,scale,.75))
        m.ico('Teal foliage highlight',x+dx-.06,z+dz-.02,1.2,.26,'teal',(.8,.8,.75))
for x,z in [(-9.2,-2.0),(9.9,-3.8)]:
    m.cylinder('Tree trunk',x,z,1.40,.19,2.8,'wood',9)
    m.ico('Tree broad upper canopy',x,z,3.2,1.6,'leaf',(1,.9,.85))
    m.ico('Tree secondary canopy',x-.68,z+.25,2.83,.96,'teal',(1,1,.8))
m.group('Courtyard planters and trees')

# Two cafe table ensembles at the side, kept out of camera sightlines at stage.
for x,z in [(-5.4,-3.9),(5.05,-4.25)]:
    m.cylinder('Round cafe table',x,z,.91,.65,.11,'wood',14)
    m.cylinder('Cafe table pedestal',x,z,.43,.10,.84,'dark',10)
    m.cylinder('Cafe table foot',x,z,.045,.39,.09,'dark',10)
    for dx in (-1.10,1.10):
        b('Chair seat',x+dx,z,.48,.51,.52,.12,'teal',.025)
        for lx in (-.18,.18):
            for lz in (-.18,.18): b('Chair leg',x+dx+lx,z+lz,.23,.065,.065,.46,'wood',0)
        b('Chair fitted back',x+dx,z-.22,.83,.51,.09,.48,'teal',.03)
    m.cone('Table coffee cup',x+.18,z,.1+1.02,.085,.115,.19,'cream',9)
# A close shot callback: two coffees already waiting just outside the actors.
x,z=-3.7,-1.4
m.cylinder('Story coffee table top',x,z,.91,.65,.11,'wood',14)
m.cylinder('Story coffee table pedestal',x,z,.43,.10,.84,'dark',10)
m.cylinder('Story coffee table foot',x,z,.045,.39,.09,'dark',10)
for dx,dz in [(-.24,-.08),(.22,.16)]:
    m.cylinder('Coffee saucer',x+dx,z+dz,.979,.18,.025,'cream',12)
    m.cone('Waiting coffee cup',x+dx,z+dz,1.074,.085,.115,.19,'cream',10)
    m.cylinder('Visible dark coffee',x+dx,z+dz,1.174,.085,.01,'dark',10)
    b('Cup fitted little handle',x+dx+.137,z+dz,1.087,.09,.055,.083,'cream',0)
m.group('Coffee terrace furniture')

# Broad lanterns and wooden bollards frame the courtyard perimeter.
for x,z in [(-10.8,2.6),(10.8,-1.8),(-6.5,6.7),(7.0,6.7)]:
    b('Bollard stone footing',x,z,.10,.36,.36,.20,'stone',.035)
    b('Warm perimeter bollard',x,z,.61,.23,.23,1.05,'wood',.025)
    b('Bollard gold lantern face',x,z+.121,.89,.15,.025,.16,'gold',0)
m.group('Courtyard perimeter details')
m.anchor('anchor_stage',0,0,0); m.anchor('anchor_exit',12,0,0); m.anchor('anchor_cafe',0,-6.7,1.5)
m.root['placement_contract']='Paving y=0, stage x=-2..4 z=0 clear; unobstructed escape along x to12; cafe facade z=-6.8'
m.save('story_courtyard_v01.blend')
