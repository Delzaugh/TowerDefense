"""Compose actual Inspector captures for visual timing and endpoint review."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE=Path(__file__).resolve().parent
FRAMES=HERE/'animation'
font_path='C:/Windows/Fonts/segoeui.ttf'
font=ImageFont.truetype(font_path,19)
small=ImageFont.truetype(font_path,15)
names=['idle','work','move','place','hit','resolve']
def image(file,width):
    im=Image.open(FRAMES/file).convert('RGB')
    # Canvas screenshots only: crop a uniform central region to enlarge the asset.
    w,h=im.size
    im=im.crop((w*.10,h*.08,w*.90,h*.92))
    im.thumbnail((width,300),Image.Resampling.LANCZOS)
    return im

cell_w,cell_h=360,320
board=Image.new('RGB',(cell_w*4,cell_h*6),(21,35,45));draw=ImageDraw.Draw(board)
for row,name in enumerate(names):
    for column,percent in enumerate([0,25,50,100]):
        im=image(f'{name}-{percent:03}.png',cell_w)
        x=column*cell_w+(cell_w-im.width)//2;y=row*cell_h+34
        board.paste(im,(x,y));draw.text((column*cell_w+14,row*cell_h+8),f'{name.title()} · {percent}%',font=font,fill='#D9E8F1')
board.save(HERE/'animation-contact-sheet.png')

joint_files=['work-side-root.png','work-underside-root.png','phone-work.png','phone-resolve-end.png']
board=Image.new('RGB',(cell_w*2,cell_h*2),(21,35,45));draw=ImageDraw.Draw(board)
for i,file in enumerate(joint_files):
    im=image(file,cell_w);col=i%2;row=i//2
    board.paste(im,(col*cell_w+(cell_w-im.width)//2,row*cell_h+34))
    draw.text((col*cell_w+10,row*cell_h+8),file.replace('.png',''),font=small,fill='#D9E8F1')
board.save(HERE/'animation-joints-phone.png')

extremes={'idle':[0,32,35,36,39,48],'work':[0,2,3,5,8,48],
          'move':[0,12,24,36,47,48],'place':[0,4,8,15,26,30],
          'hit':[0,1,3,6,9,12],'resolve':[0,4,8,15,26,30]}
board=Image.new('RGB',(300*6,260*6),(21,35,45));draw=ImageDraw.Draw(board)
for row,(name,indices) in enumerate(extremes.items()):
    for col,index in enumerate(indices):
        im=image(f'film-{name}-{index:03}.png',300)
        board.paste(im,(col*300+(300-im.width)//2,row*260+32))
        draw.text((col*300+10,row*260+8),f'{name} · {index/24:.3f} s',font=small,fill='#D9E8F1')
board.save(HERE/'animation-motion-extremes.png')

board=Image.new('RGB',(300*3,330*2),(21,35,45));draw=ImageDraw.Draw(board)
for i,name in enumerate(names):
    im=image(f'phone-{name}.png',300);col=i%3;row=i//3
    board.paste(im,(col*300+(300-im.width)//2,row*330+30))
    draw.text((col*300+10,row*330+8),f'Phone · {name}',font=small,fill='#D9E8F1')
board.save(HERE/'animation-phone-clips.png')

sequence=[]
for name in ['place','idle','work','move','hit','resolve']:
    files=sorted(FRAMES.glob('film-'+name+'-*.png'))
    assert files,name
    for file in files:
        im=image(file.name,640)
        frame=Image.new('RGB',(660,340),(21,35,45));frame.paste(im,((660-im.width)//2,38))
        d=ImageDraw.Draw(frame);label={'move':'Hover movement','work':'Work · six radial recoils','place':'Place · cube assembly','resolve':'Resolve · cube disintegration'}.get(name,name.title())
        d.text((18,9),label,font=font,fill='#D9E8F1')
        sequence.append(frame)
sequence[0].save(HERE/'linter-animation-preview.gif',save_all=True,append_images=sequence[1:],duration=42,loop=0,optimize=False,disposal=2)
print('Created contact sheets and real-runtime animation preview.')
