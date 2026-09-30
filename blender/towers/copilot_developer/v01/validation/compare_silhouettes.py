"""Diagnostic comparison only; keeps reference aspect ratio and uniform scale.
Masks are normalized to equal height and bbox center, never stretched separately.
IoU is a supporting measurement, not an artistic acceptance test.
"""
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,sys
from pathlib import Path
p=Path(__file__).resolve().parent.parent
new=Path(sys.argv[1]) if len(sys.argv)>1 else p/'.staging/landmark_blockout/validation'
out=Path(sys.argv[2]) if len(sys.argv)>2 else p/'validation/landmark_comparison'
out.mkdir(parents=True,exist_ok=True)
reference=Image.open(p/'references/shape_study.png').convert('RGB')
def norm(mask):
    ys,xs=np.where(mask);crop=Image.fromarray(np.uint8(mask[ys.min():ys.max()+1,xs.min():xs.max()+1])*255)
    size=(round(crop.width*400/crop.height),400);crop=crop.resize(size,Image.Resampling.NEAREST)
    canvas=Image.new('L',(520,450));canvas.paste(crop,((520-size[0])//2,25));return np.asarray(canvas)>0
def render_mask(file):
    im=np.array(Image.open(file).convert('RGB')).astype(int);bg=im[0,0]
    return norm(np.max(abs(im-bg),axis=2)>8)
metrics={};board=Image.new('RGB',(1560,1010),'#ffffff');draw=ImageDraw.Draw(board)
try:font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
except:font=None
for row,(view,rect) in enumerate([('front',(10,165,265,409)),('side',(512,155,774,410))]):
    ref=norm(np.min(np.array(reference.crop(rect)),axis=2)<75)
    old=render_mask(p/'revisions/r4_review_baseline'/f'{view}.png');current=render_mask(new/f'{view}.png')
    for col,(name,mask) in enumerate([('REFERENCE',ref),('REVISION 4',old),('REBUILD',current)]):
        rgb=np.full((450,520,3),255,dtype=np.uint8)
        if col==0:rgb[ref]=[28,38,45]
        else:
            rgb[ref & mask]=[40,55,66];rgb[ref & ~mask]=[226,95,61];rgb[mask & ~ref]=[28,166,195]
        board.paste(Image.fromarray(rgb),(520*col,55+row*480))
        draw.text((520*col+24,18+row*480),view.upper()+' / '+name,fill='#17252f',font=font)
    metrics[view]={}
    for name,mask in [('revision4',old),('rebuild',current)]:
        metrics[view][name]={'intersectionOverUnion':round(float(np.sum(ref&mask)/np.sum(ref|mask)),4),'referenceMissingPixels':int(np.sum(ref&~mask)),'extraModelPixels':int(np.sum(mask&~ref))}
draw.text((24,980),'Dark: overlap   Orange: reference outside model   Cyan: model outside reference',fill='#17252f',font=font)
board.save(out/'silhouette_comparison.png')
(out/'metrics.json').write_text(json.dumps({'alignment':'Equal silhouette height and bounding-box center; original aspect ratios preserved.','limits':'Illustrative references, imperfect orthographic consistency. IoU cannot assess internal contours, attachments or shading.','views':metrics},indent=2))
print(json.dumps(metrics))
