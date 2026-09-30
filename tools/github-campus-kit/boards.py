from PIL import Image,ImageDraw,ImageOps
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
assets=[a for a in json.loads((root/'tools/github-campus-kit/plan.json').read_text())['assets'] if a['owner']=='site']
for page in range((len(assets)+3)//4):
    board=Image.new('RGB',(1600,1460),'#F2F5F3');d=ImageDraw.Draw(board)
    for row,a in enumerate(assets[page*4:page*4+4]):
        d.text((12,row*365+5),a['name']+' / '+a['id'],fill='#101411')
        for col,view in enumerate(['iso','rear','inspector-detail','inspector-phone']):
            im=Image.open(root/f"blender/environment/{a['id']}/v01/validation/{view}.png").convert('RGB')
            im=ImageOps.contain(im,(390,330))
            board.paste(im,(col*400+(400-im.width)//2,row*365+27+(330-im.height)//2))
            d.text((col*400+10,row*365+345),view,fill='#101411')
    board.save(root/f'artifacts/github-campus/site-board-{page+1}.jpg',quality=95)
