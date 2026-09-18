from PIL import Image,ImageDraw
from pathlib import Path
import json
base=Path(__file__).parent;r=json.loads((base/'asset.json').read_text())['revision'];out=base/'validation'/f'proportions_walk_r{r}'
sets={
 'side_walk':[f'move_right_{f}' for f in [0,3,6,9,12,15,18,21,24,27,30,33]],
 'front_iso_walk':[f'move_{v}_{f}' for v in ['front','iso'] for f in [0,6,12,18,24,30]],
 'work_hands':[f'work_{v}_{f}' for v in ['front','iso','right','left'] for f in [38,64,76]],
 'proportions':[f'rest_{v}' for v in ['front','right','rear','iso']],
 'rear_phone':[f'move_rear_{f}' for f in [0,12,24]]+['phone_move','phone_small'],
 'celebrate':[f'celebrate_{v}_28' for v in ['front','iso','right','left']],
}
for name,names in sets.items():
    cols=4 if name!='rear_phone' else 3;rows=(len(names)+cols-1)//cols
    board=Image.new('RGB',(cols*360,rows*330),(25,40,50));draw=ImageDraw.Draw(board)
    for i,n in enumerate(names):
        im=Image.open(out/(n+'.png')).convert('RGB');im.thumbnail((360,302))
        x=i%cols*360;y=i//cols*330;board.paste(im,(x+(360-im.width)//2,y));draw.text((x+8,y+309),n,fill='white')
    board.save(out/(name+'.jpg'),quality=94)
print(out)
