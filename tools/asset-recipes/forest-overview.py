from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageChops
import json
p=Path(__file__).resolve().parents[2]
entries=json.loads((p/'tools/asset-recipes/campus-forest-entries.json').read_text(encoding='utf-8'))
out=p/'blender/environment/campus_tile_forest/v01/renders/forest-kit-overview.png'
im=Image.new('RGB',(1800,1440),'#eef3f5');d=ImageDraw.Draw(im)
def font(size,bold=False):return ImageFont.truetype('C:/Windows/Fonts/'+('segoeuib.ttf' if bold else 'segoeui.ttf'),size)
def text(x,y,s,size=24,bold=False,color='#24354e'):d.text((x,y),s,font=font(size,bold),fill=color)
def asset(e,box):
    src=Image.open(p/f"blender/environment/{e['id']}/v01/validation/iso.png").convert('RGB')
    bg=Image.new('RGB',src.size,src.getpixel((0,0)));mask=ImageChops.difference(src,bg).convert('L').point(lambda v:255 if v>8 else 0)
    bounds=mask.getbbox();src=src.crop((max(0,bounds[0]-14),max(0,bounds[1]-14),min(src.width,bounds[2]+14),min(src.height,bounds[3]+14)))
    src.thumbnail((box[2],box[3]),Image.Resampling.LANCZOS)
    im.paste(src,(int(box[0]+(box[2]-src.width)/2),int(box[1]+(box[3]-src.height)/2)))
text(45,25,'CAMPUS WOODLAND',48,True)
text(47,91,'Six baseless forms · three reusable forest groups · one complete hex tile',26)
labels=['Round / teal','Tall / light teal','Paired / teal','Pine / blue-green','Spreading / sage','Autumn / amber']
for i,e in enumerate(entries[:6]):
    x=30+i*295;asset(e,(x,152,280,285));text(x+15,447,labels[i],23,True)
text(45,508,'PLACE A WHOLE GROVE',27,True)
for i,e in enumerate(entries[6:9]):
    x=35+i*590;asset(e,(x,553,555,287));text(x+20,855,['Mixed grove · 10 trunks','Evergreen thicket · 13 trees','Autumn edge · 7 trees'][i],25,True)
    text(x+20,894,['10 × 10 m · no ground slab','10 × 10 m · no ground slab','12 × 6 m · no ground slab'][i],22)
asset(entries[-1],(35,971,860,407))
text(952,998,'FOREST CLEARING TILE',33,True)
text(952,1053,'42 trees on the campus hex',29)
text(952,1111,'Mixed heights and colors; irregular spacing',24)
text(952,1150,'Open center and north–south passage',24)
text(952,1189,'36 × 31.18 m · terrain base included',24)
text(952,1258,'3,986 triangles · 2 materials',27,True)
text(46,1395,'Actual exported models · neutral runtime renders · thumbnails individually framed',19,color='#527077')
im.save(out)
print(out)
