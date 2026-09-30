"""Compose review evidence from real Inspector captures; preserve image aspect."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageOps
p=Path(__file__).resolve().parent/'validation/motion'

def board(name, rows, crop=None, columns=5):
    result=Image.new('RGB',(columns*300,len(rows)*285),'#eff2f5')
    draw=ImageDraw.Draw(result)
    for r,row in enumerate(rows):
        for c,(file,label) in enumerate(row):
            im=Image.open(p/file).convert('RGB')
            if crop:im=im.crop(crop)
            im=ImageOps.contain(im,(300,255))
            result.paste(im,(c*300+(300-im.width)//2,r*285+30+(255-im.height)//2))
            draw.text((c*300+10,r*285+8),label,fill='#182632')
    result.save(p/name)

clips=[('work',[0,25,50,75,100]),('move',[0,25,50,75,100]),('hit',[0,25,70,100]),('wave',[0,25,50,75,100]),('celebrate',[0,17,48,74,100])]
for view in ['front','left','iso']:
    board(view+'-motion-review-board.png', [[(f'{view}-{clip}-{t:03}.png',f'{clip} {t}%') for t in times] for clip,times in clips], (200,20,810,620))
phone=['work','move','hit','wave','celebrate','place','resolve']
board('phone-review-board.png', [[('phone-'+c+'.png',c) for c in phone[:4]],[('phone-'+c+'.png',c) for c in phone[4:]]],columns=4)
details=json.loads((p/'second_pass.json').read_text())['frames']
board('detail-review-board.png',[[(f['file'],f"{f['view']} {f['clip']} {f['progress']}") for f in details[:5]],[(f['file'],f"{f['view']} {f['clip']} {f['progress']}") for f in details[5:]]])
review=json.loads((p/'review.json').read_text())
board('loop-join-review-board.png',[[(f'join-{clip}-{t:03}.png',f'{clip} {t}%') for t in [96,98,100,0,2,4]] for clip in ['idle','work','move']],columns=6)
rows=[]
for clip in ['idle','work','move']:
    samples=review['loops'][clip]['samples'];duration=review['loops'][clip]['duration']
    selected=[min(range(len(samples)),key=lambda i:abs(samples[i]['elapsed']-duration*t)) for t in [0,.25,.5,.75,1]]
    rows.append([(f'realtime/{clip}-{i:03}.png',f"{clip} {samples[i]['elapsed']:.2f}s") for i in selected])
board('normal-speed-review-board.png',rows,(200,20,810,620))
samples=review['loops']['work']['samples']
frames=[Image.open(f).convert('RGB').crop((200,20,810,620)).resize((400,393)) for f in sorted((p/'realtime').glob('work-*.png'))]
durations=[max(20,round((b['elapsed']-a['elapsed'])*1000)) for a,b in zip(samples,samples[1:])]+[140]
frames[0].save(p/'mona-work-preview.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0,optimize=True)
