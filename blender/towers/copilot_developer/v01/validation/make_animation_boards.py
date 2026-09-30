"""Assemble actual GLB review frames; never synthesize model imagery."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
p=Path(__file__).resolve().parent/'animation'
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
for group,names in [('loops',['idle','work','move']),('oneshots',['place','hit','resolve'])]:
    board=Image.new('RGB',(1500,900),'#dce5ed');draw=ImageDraw.Draw(board)
    for row,name in enumerate(names):
        for col,v in enumerate([0,250,500,700,1000]):
            im=Image.open(p/f'{name}-{v}.png').convert('RGB');im.thumbnail((300,267))
            board.paste(im,(col*300,row*300+26))
            draw.text((col*300+12,row*300+5),f'{name}  {v/10:g}%',font=font,fill='#16232d')
    board.save(p/f'{group}-board.png')
board=Image.new('RGB',(1170,430),'#dce5ed');draw=ImageDraw.Draw(board)
for col,name in enumerate(['idle','work','move','place','hit','resolve']):
    im=Image.open(p/f'phone-{name}.png').convert('RGB');im.thumbnail((195,780))
    board.paste(im,(col*195,35));draw.text((col*195+12,8),name,font=font,fill='#16232d')
board.save(p/'phone-board.png')
