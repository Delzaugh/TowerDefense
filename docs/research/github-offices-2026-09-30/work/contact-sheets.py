from pathlib import Path
from PIL import Image,ImageDraw
import json,math
root=Path(__file__).resolve().parent.parent
rows=json.loads((root/'image-index.json').read_text())
for group in dict.fromkeys(r['group'] for r in rows):
    items=[r for r in rows if r['group']==group and r['status']=='downloaded']
    w,h=360,285
    board=Image.new('RGB',(w*3,h*math.ceil(len(items)/3)), '#eeeeee')
    d=ImageDraw.Draw(board)
    for i,r in enumerate(items):
        im=Image.open(root/r['file']).convert('RGB');r['width'],r['height']=im.size
        im.thumbnail((w-16,h-38))
        x=(i%3)*w+(w-im.width)//2;y=(i//3)*h+8
        board.paste(im,(x,y));d.text(((i%3)*w+8,(i//3)*h+h-24),r['id'],fill='black')
    board.save(root/'work'/f'contact-{group}.jpg')
(root/'image-index.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
