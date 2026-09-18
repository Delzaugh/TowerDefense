"""Assemble unretouched runtime screenshots for pose-sequence review."""
from PIL import Image, ImageDraw
from pathlib import Path
import json
base=Path(__file__).parent
r=json.loads((base/'asset.json').read_text())['revision']
out=base/'validation'/f'celebrate_r{r}'
sets={
 'sequence': [('front',f) for f in [0,8,14,20,24,28,35,40,48,54,66,80,88,96]],
 'depth': [('right',f) for f in [14,22,28,35,54,80]]+[('iso',f) for f in [14,22,28,35,54,80]],
 'rear_phone':[('rear',f) for f in [22,54,80]]+[('phone','contact'),('phone','silhouette')],
 'close':[(v,f) for v in ['close_front','close_iso','close_right'] for f in [20,28,54,80]],
}
for name,frames in sets.items():
    cols=4 if name!='rear_phone' else 3;rows=(len(frames)+cols-1)//cols
    board=Image.new('RGB',(cols*320,rows*400),(25,40,50));draw=ImageDraw.Draw(board)
    for i,(v,f) in enumerate(frames):
        im=Image.open(out/f'{v}_{f}.png').convert('RGB')
        # Keep the entire render viewport; no pose retouching.
        im.thumbnail((320,370))
        x=(i%cols)*320;y=(i//cols)*400
        board.paste(im,(x+(320-im.width)//2,y))
        draw.text((x+12,y+377),f'{v} | frame {f}',fill='white')
    board.save(out/f'board_{name}.jpg',quality=93)
print(out)
