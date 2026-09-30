"""Original open-front tow cradle, centered on the captive character's foot origin."""
import sys, math
from pathlib import Path
folder=Path(__file__).resolve().parent; sys.path.insert(0,str(folder.parent.parent/'story_courtyard'/'v01'))
from model_tools import initialize
palette={'graphite':'#333E48','slate':'#89A4B8','violet':'#7565A3','amber':'#E8B75C','dark':'#041D2A','paper':'#E2EDF0','warm':'#C57857','signal':'#CBB7EE'}
m=initialize(palette,'carrier_palette',folder); b=m.box
# Low tray: broad rounded shell with open front and fitted side edge.
b('Octocat tow cradle tray',0,0,-.12,2.45,1.60,.18,'violet',.045)
b('Fitted foot platform',0,.10,-.015,2.02,1.14,.03,'slate',0)
for x in (-1.12,1.12):
    b('Tray amber side rail',x,0,.05,.14,1.55,.16,'amber',0)
    b('Rear structural upright',x,-.64,1.08,.18,.20,2.05,'graphite',.025)
    b('Structural upright inset',x,-.516,1.1,.10,.025,1.55,'violet',0)
    b('Top amber clamp seat',x,-.64,2.14,.31,.34,.22,'amber',.035)
    # Curved-looking faceted pods keep the silhouette mechanical and legible.
    m.cylinder('Side tow winch housing',x*1.235,-.12,.65,.30,.62,'violet',12)
    m.cylinder('Side winch amber cap',x*1.235,-.12,.97,.27,.075,'amber',12)
    m.cylinder('Winch bolt',x*1.235,-.12,1.018,.095,.025,'graphite',8)
    b('Side tow pod fitted seat',x*1.17,-.12,.35,.50,.62,.18,'graphite',.035)
    m.beam('Structural side winch bracket',(x,-.64,.34),(x*1.235,-.12,.34),.16,.16,'graphite')
    b('Tow attachment lug',x*1.39,0,.65,.20,.22,.16,'amber',.025)
    for y in (.39,.63,.87): b('Pod warning registration bar',x*1.235,.186,y,.28,.025,.06,'warm',0)
    m.beam('Seated rear brace',(x,-.65,.12),(x,-.65,.67),.15,.15,'graphite')
# Back structure holds a recessed power core; open +Z frontal silhouette stays clear.
b('Rear lower spine',0,-.73,.39,2.40,.18,.26,'graphite',.025)
b('Rear upper spanning head',0,-.64,2.14,2.50,.22,.20,'graphite',.025)
b('Rear power module support stem',0,-.875,1.08,.18,.13,1.27,'graphite',.025)
b('Rear violet power module',0,-.80,1.11,.66,.31,.77,'violet',.065)
b('Recessed amber power plate',0,-.976,1.11,.40,.05,.49,'amber',.025)
b('Power plate indicator',0,-1.008,1.11,.20,.016,.28,'signal',0)
for x in (-.24,.24): b('Power module latch',x,-.98,1.11,.06,.035,.58,'graphite',0)
for x in (-.84,-.56,.56,.84):
    b('Back mechanism vent',x,-.847,.39,.095,.03,.13,'slate',0)
# Upright upper contour has distinctive angled shoulders rather than a full cage roof.
for x in (-1,1):
    m.beam('Angled rear shoulder',(x*1.12,-.64,2.09),(x*.90,-.64,2.32),.15,.20,'violet')
b('Continuous rear shoulder bridge',0,-.64,2.34,1.83,.20,.15,'violet',.025)
for x in (-.55,0,.55): b('Upper amber registration mark',x,-.519,2.34,.19,.026,.065,'amber',0)
m.group('Open front Octocat capture carrier')
m.anchor('anchor_tow_left',-1.58,0,.65); m.anchor('anchor_tow_right',1.58,0,.65)
m.anchor('anchor_captive',0,0,0); m.anchor('anchor_power',0,-1.04,1.11)
m.root['fit_contract']='Foot origin y=0; open +Z front; interior width2.02 depth1.14 height2.04; Octocat1.836x1.8x.883'
m.save('story_capture_carrier_v01.blend')
