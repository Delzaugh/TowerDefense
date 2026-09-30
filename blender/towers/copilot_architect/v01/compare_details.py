"""Evidence layout only: untouched concept crops next to actual GLB closeups."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
import json,textwrap
p=Path(__file__).resolve().parent
out=p/'validation/spec-comparison'
source=p/'references/keystone_placeable_2026-09-27/keystone_field_architect.png'
ref=Image.open(source).convert('RGB')
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',n)
board=Image.new('RGB',(1800,1240),'#0d1d2e');d=ImageDraw.Draw(board)
d.text((25,14),'FIELD ARCHITECT  /  DETAIL COMPARISON',font=font(34),fill='white')
d.text((25,62),'Selected concept crops and actual exported geometry. Same reference; no painted-in model details.',font=font(22),fill='#aacbdd')
items=[('BLUEPRINT POD',(25,215,235,660),'blueprint-close.png',
        'Spiral paper edge, blue flap, one-to-two plan glyph and two ivory cradle bands. The diagonal flap is rigid and sits clear of the roll.'),
       ('DRAFTING FRAME + STYLUS',(663,278,935,758),'stylus-close.png',
        'Two triangular openings, beveled ivory frame, teal fitted dock, six-sided orange pencil, cream cap/wood cone, graphite point, clip and two cyan marks.'),
       ('APPLICATION DIAGRAM',(264,188,642,429),'diagram-close.png',
        'Four-pane application tile branches to database and one-to-three service hierarchy. All glyphs are geometry; cyan paths follow the upper shell.')]
for i,(name,crop,actual,note) in enumerate(items):
    x=i*600
    d.rounded_rectangle((x+12,105,x+588,1210),12,fill='#172d43',outline='#416179',width=2)
    d.text((x+28,116),name,font=font(24),fill='white')
    d.text((x+28,155),'SELECTED CONCEPT',font=font(19),fill='#ffcb80')
    for im,y in [(ref.crop(crop),185),(Image.open(out/actual).convert('RGB'),650)]:
        im=ImageOps.contain(im,(535,395),Image.Resampling.LANCZOS)
        board.paste(im,(x+(600-im.width)//2,y+(395-im.height)//2))
    d.text((x+28,612),'ACTUAL EXPORTED MODEL',font=font(19),fill='#74e2ed')
    yy=1065
    for line in textwrap.wrap(note,48):
        d.text((x+28,yy),line,font=font(20),fill='#ccdce6');yy+=27
board.save(out/'spec-vs-model-details.png')
meta=json.loads((out/'cameras.json').read_text())
(out/'detail_comparison.json').write_text(json.dumps({'model':meta['model'],
    'reference':str(source.relative_to(p)).replace('\\','/'),'items':[{'feature':a,'referenceCrop':b,'actualRender':c,'finding':e} for a,b,c,e in items],
    'method':'Crops retain original pixels and aspect ratio. Actual closeups are orthographic renders of the hash-identified registered GLB. No pixel-level geometry claim is made.'},indent=2))
