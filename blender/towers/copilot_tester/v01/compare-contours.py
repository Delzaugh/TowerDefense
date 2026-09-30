from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json

base=Path(__file__).resolve().parent
old=base/'.staging/r4_1790746680801/validation'
new=base/'validation'
ref=Image.open(base/'references/boundary-watcher-six-angle-sheet.png').convert('RGB')
board=Image.new('RGB',(1560,1110),'#142333')
d=ImageDraw.Draw(board)
fontpath='C:/Windows/Fonts/segoeui.ttf'
font=ImageFont.truetype(fontpath,24)
title=ImageFont.truetype(fontpath,34)
small=ImageFont.truetype(fontpath,20)
d.text((30,20),'Boundary Watcher | Front volume refinement',font=title,fill='white')
d.text((30,70),'Illustrative reference and actual exported models. Each image retains its original aspect ratio.',font=small,fill='#b8cad9')
def tile(im,x,y,w=490,h=340):
    im=im.copy(); im.thumbnail((w,h),Image.Resampling.LANCZOS)
    board.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2))
for col,label in enumerate(['Concept reference','Before / r4 / 1,100 triangles','After / r6 / 2,292 triangles']):
    d.text((30+col*510,120),label,font=font,fill='#edf3f8')
for row,view in enumerate(['front','side']):
    y=180+row*390
    crop=(35,75,510,430) if view=='front' else (1065,65,1485,435)
    tile(ref.crop(crop),30,y)
    for col,folder in [(1,old),(2,new)]:
        im=Image.open(folder/(view+'.png')).convert('RGB')
        tile(im.crop((185,225,715,580)),30+col*510,y)
    d.text((30,y+345),view.capitalize()+' contour',font=small,fill='#b8cad9')
d.text((30,975),'Front outline and bracket gaps retained; forehead, display and chin now roll into a convex front.',font=font,fill='white')
d.text((30,1015),'Curved goggles and eyes follow the head. Rounded rims and two-step guard bevels improve close views.',font=small,fill='#b8cad9')
d.text((30,1050),'Measured GLB depth: 1.782 -> 2.087 m. Width 2.800 m and height 1.795 m unchanged. Budget: 2,500 triangles.',font=small,fill='#b8cad9')
board.save(new/'contour-comparison.png')
(new/'contour-audit.md').write_text('''# Contour comparison: r4 to r6

The user identified the r4 front as too flat. Earlier author approval is superseded by that feedback.

The board compares the illustrative six-angle concept with actual Three.js front and side renders from r4 and r6. Reference images retain their aspect ratio but are independently fitted, so these are qualitative comparisons rather than measured reference overlays. Before/after renders use identical crop rectangles and uniform scaling.

The front outline remains broad and compact. The revised front develops curvature across both axes: forehead and chin roll back, the display has a convex surface, and the goggles follow the brow. The reference remains more faceted; the new source prioritizes the requested volume and improved surface quality while preserving the selected character landmarks.

The GLB reports measure depth increasing from 1.782000 to 2.086972 m, with width 2.800000 m and height 1.794875 m unchanged. This is total asset depth including goggles, not a measurement of face thickness. Triangles increase from 1,100 to 2,292 within the 2,500 limit.

Close oblique, reverse, underside, top, phone-width and small silhouette captures were reviewed after the final geometry and normal repairs. Palette and anatomy are retained. Model acceptance remains pending; no animation was added.
''',encoding='utf-8')
