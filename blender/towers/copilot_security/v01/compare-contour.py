from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib
HERE=Path(__file__).resolve().parent
out=HERE/'validation'
ref=Image.open(HERE/'references/feedback-left-contour.png').convert('RGB').crop((2,455,201,672))
before=Image.open(HERE/'references/rejected-r4-side.png').convert('RGB').crop((98,83,723,795))
im=Image.open(out/'side.png').convert('RGB');mask=Image.open(out/'side-silhouette.png').convert('L').point(lambda p:255 if p<128 else 0)
bounds=mask.getbbox();after=im.crop(bounds)
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',22)
small=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',15)
board=Image.new('RGB',(1350,560),'#f3f6f9');draw=ImageDraw.Draw(board)
for i,(title,pic) in enumerate([('Reference contour',ref),('Previous model — rejected',before),('Revised model',after)]):
 h=420;w=round(pic.width*h/pic.height);pic=pic.resize((w,h),Image.Resampling.LANCZOS)
 x=i*450+(450-w)//2;board.paste(pic,(x,65));draw.text((i*450+25,20),title,fill='#182d43',font=font)
 draw.line((i*450+20,486,i*450+430,486),fill='#71889e',width=1)
draw.text((26,510),'Equal displayed height, uniform scale, aligned ground. No independent width stretching.',fill='#334b61',font=small)
board.save(out/'contour-comparison.png')
meta={'referenceCrop':[2,455,201,672],'rejectedCrop':[98,83,723,795],'exportSideMaskCrop':bounds,'displayHeight':420,'alignment':'uniform per-image scale; top and ground aligned','sourceReference':'feedback-left-contour.png','exportHash':json.loads((HERE/'asset.json').read_text())['delivery']['sha256']}
(out/'contour-comparison.json').write_text(json.dumps(meta,indent=2))
