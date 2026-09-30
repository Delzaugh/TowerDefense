from PIL import Image,ImageDraw
from pathlib import Path
import json
base=Path(__file__).parent;r=json.loads((base/'asset.json').read_text())['revision'];out=base/'validation'/f'work_straps_r{r}'
sets={
 'work_sequence':[f'work_{v}_{f}' for v in ['front','iso'] for f in [0,12,24,38,52,64,76,92,108,120]],
 'work_close':[f'close_work_{v}_{f}' for v in ['front','iso','right','left'] for f in [0,38,76]],
 'strap_clearance':[f'close_celebrate_team_{v}_{f}' for v in ['front','iso','right','left'] for f in [22,28,54]],
 'rear_phone':[f'close_work_rear_{f}' for f in [0,38,76]]+['phone_work','phone_small'],
}
for name,names in sets.items():
    cols=4 if name!='rear_phone' else 3;rows=(len(names)+cols-1)//cols
    board=Image.new('RGB',(cols*360,rows*300),(25,40,50));draw=ImageDraw.Draw(board)
    for i,n in enumerate(names):
        im=Image.open(out/(n+'.png')).convert('RGB');im.thumbnail((360,272))
        x=i%cols*360;y=i//cols*300;board.paste(im,(x+(360-im.width)//2,y));draw.text((x+8,y+279),n,fill='white')
    board.save(out/(name+'.jpg'),quality=94)
print(out)
