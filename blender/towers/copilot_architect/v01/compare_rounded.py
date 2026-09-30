"""Compose untouched inspector views at the same uniform scale for review."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
p=Path(__file__).resolve().parent
old=p/'revisions/r19_rejected_top_flat_body/inspector'
new=p/'validation/inspector'
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',25)
small=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',19)
board=Image.new('RGB',(1500,1580),'#13232e');d=ImageDraw.Draw(board)
d.text((32,16),'ARCHITECT | ROUNDED BODY, TOP PLATFORM REMOVED',font=font,fill='#f5e6ce')
d.text((32,53),'Same fixed views, lighting and crop scale; Inspector frames each asset. Left: rejected r19. Right: rounded body.',font=small,fill='#aabcc9')
for i,(view,label) in enumerate([('front','FRONT — bowed screen and tapered shoulders'),('right','SIDE — curved front, shoulders and rear; no fins'),('iso','ISOMETRIC — architecture diagram follows the curved shoulder')]):
    y=95+i*490
    d.text((32,y),label,font=small,fill='#f5e6ce')
    for col,folder in enumerate((old,new)):
        im=Image.open(folder/(view+'.png')).convert('RGB')
        # Central square crop only; no stretching, silhouette warping or recolouring.
        w,h=im.size;im=im.crop(((w-h)//2,0,(w+h)//2,h))
        im=im.resize((460,460),Image.Resampling.LANCZOS)
        board.paste(im,(col*750+145,y+26))
board.save(p/'validation'/'rounded_body_comparison.png')

