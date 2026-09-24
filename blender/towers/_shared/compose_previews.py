"""Contact sheets of actual exported GLB evidence; no generated concept art."""
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps
from pathlib import Path
import json
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
IDS=['copilot_tester','copilot_analyst','linter_agent']
def font(size):return ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',size)
def isolated(im):
    im=im.convert('RGB');bg=Image.new('RGB',im.size,im.getpixel((0,0)))
    diff=ImageChops.difference(im,bg).convert('L').point(lambda p:255 if p>12 else 0)
    return im.crop(diff.getbbox())
bg='#dce6ef'
board=Image.new('RGB',(1800,1280),bg);d=ImageDraw.Draw(board)
d.text((60,30),'PERSONA TOWERS',font=font(40),fill='#132943')
d.text((62,84),'Persona concepts  /  actual runtime GLB previews',font=font(20),fill='#506377')
for i,id in enumerate(IDS):
    folder=ROOT/'blender/towers'/id/'v01';m=json.loads((folder/'asset.json').read_text())
    report=json.loads((folder/'validation/report.json').read_text())
    im=isolated(Image.open(folder/'validation/iso.png'));im.thumbnail((475,425),Image.Resampling.LANCZOS)
    x=(i%3)*600;y=145+(i//3)*555
    board.paste(im,(x+(600-im.width)//2,y+(425-im.height)//2))
    d.text((x+300,y+450),m['displayName'],font=font(29),anchor='mm',fill='#132943')
    d.text((x+300,y+487),f"{report['triangles']:,} triangles  ·  v01",font=font(19),anchor='mm',fill='#506377')
board.save(HERE/'persona_towers_preview.png')
for title,views,out,height in [
 ('Construction',['front','side','rear','top'],'construction_review_final.png',1100),
 ('Runtime',['inspector_iso','inspector_underside','inspector_phone','inspector_small'],'inspector_review_final.png',1400)]:
    sheet=Image.new('RGB',(1800,height),bg);d=ImageDraw.Draw(sheet);row=height//4
    for j,id in enumerate(IDS):
        for k,v in enumerate(views):
            im=Image.open(ROOT/'blender/towers'/id/'v01/validation'/str(v+'.png')).convert('RGB')
            im=ImageOps.contain(im,(300,row-23),Image.Resampling.LANCZOS)
            sheet.paste(im,(j*300+(300-im.width)//2,k*row))
            d.text((j*300+5,k*row+row-22),id.replace('copilot_','')+' / '+v.replace('inspector_',''),font=font(13),fill='#132943')
    sheet.save(HERE/out)
