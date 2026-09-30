"""Contact sheets of actual runtime renders, not concept illustrations."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
project=Path(__file__).resolve().parents[2]
entries=json.loads((project/'tools/asset-recipes/campus-forest-entries.json').read_text(encoding='utf-8'))
output=project/'blender/environment/campus_tile_forest/v01/renders';output.mkdir(exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',22)
small=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',17)
title=ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',38)
def board(name,items,views,cell=(460,430)):
    w,h=cell;im=Image.new('RGB',(w*len(views),h*len(items)+75),'#eef3f5');d=ImageDraw.Draw(im);d.text((24,15),name,font=title,fill='#24354e')
    for row,e in enumerate(items):
        for col,view in enumerate(views):
            prefix='renders/' if view.startswith('inspector-') else 'validation/'
            src=Image.open(project/f"blender/environment/{e['id']}/v01/{prefix}{view}.png").convert('RGB')
            src.thumbnail((w-16,h-58));x=col*w+(w-src.width)//2;y=75+row*h
            im.paste(src,(x,y));d.text((col*w+12,y+h-52),e['name'],font=small,fill='#24354e');d.text((col*w+12,y+h-28),view,font=small,fill='#527077')
    im.save(output/(name.lower().replace(' ','-')+'.jpg'),quality=95)
board('Bare tree forms',entries[:6],['iso','front','rear'],(430,375))
board('Forest group construction',entries[6:9],['iso','top','rear'],(500,440))
board('Forest tile construction',entries[9:],['iso','top','rear'],(620,560))
if (project/f"blender/environment/{entries[-1]['id']}/v01/renders/inspector-phone.png").exists():
    for name,items in [('Original forms',entries[:3]),('New forms',entries[3:6]),('Groups',entries[6:9]),('Tile',entries[9:])]:
        board(name+' phone and underside',items,['inspector-phone','inspector-bottom'],(430,400))
        board(name+' close construction',items,['inspector-close','inspector-rear'],(560,500))
print(output)
