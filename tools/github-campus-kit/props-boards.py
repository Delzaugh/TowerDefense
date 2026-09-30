from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import json
root=Path.cwd();assets=[a for a in json.loads((root/'tools/github-campus-kit/plan.json').read_text())['assets'] if a['owner']=='props']
dest=root/'tools/github-campus-kit/props-review';dest.mkdir(exist_ok=True)
for batch in range(2):
    board=Image.new('RGB',(1600,1600),'#eef1ef');draw=ImageDraw.Draw(board)
    for row,a in enumerate(assets[batch*5:batch*5+5]):
        draw.text((15,row*320+5),a['id'],fill='#111111')
        folder=root/f"blender/environment/{a['id']}/v01/validation"
        for col,view in enumerate(['front','iso','rear','inspector-phone']):
            source=folder/(view+'.png');img=Image.open(source).convert('RGB');img=ImageOps.contain(img,(392,290));x=col*400+(400-img.width)//2;y=row*320+24+(290-img.height)//2;board.paste(img,(x,y))
    board.save(dest/f'board-{batch+1}.jpg',quality=92)
