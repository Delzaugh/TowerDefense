from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
p=Path(__file__).resolve().parent
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',19)
for group,names in [('loops',['idle','work','move']),('oneshots',['place','hit','resolve'])]:
    board=Image.new('RGB',(1500,900),'#dce5ed');draw=ImageDraw.Draw(board)
    for row,name in enumerate(names):
        for col,v in enumerate([0,250,500,700,1000]):
            im=Image.open(p/'animation'/f'{name}-{v}.png').convert('RGB');im.thumbnail((300,267))
            board.paste(im,(col*300,row*300+26));draw.text((col*300+12,row*300+5),f'{name} {v/10:g}%',font=font,fill='#16232d')
    board.save(p/'animation'/f'{group}-board.png')
board=Image.new('RGB',(1400,850),'#dce5ed');draw=ImageDraw.Draw(board)
for row,name in enumerate(['place','resolve']):
    for col,v in enumerate([0,28,52,76,100] if name=='place' else [0,24,48,72,100]):
        im=Image.open(p/'digital-resolve'/f'{name}-{v:03}.png').convert('RGB');im.thumbnail((280,370))
        board.paste(im,(col*280,row*425+32));draw.text((col*280+10,row*425+8),f'{name} {v}%',font=font,fill='#16232d')
board.save(p/'animation'/'effects-board.png')
for group,names in [('playback',['idle','work','move']),('phone',['idle','work','move','place','hit','resolve'])]:
    if group=='playback':
        board=Image.new('RGB',(1600,700),'#dce5ed');draw=ImageDraw.Draw(board)
        for row,name in enumerate(names):
            for col in range(8):
                im=Image.open(p/'animation'/f'play-{name}-{col}.png').convert('RGB');im.thumbnail((200,195))
                board.paste(im,(col*200,row*230+25));draw.text((col*200+8,row*230+3),name,font=font,fill='#16232d')
    else:
        board=Image.new('RGB',(1170,440),'#dce5ed');draw=ImageDraw.Draw(board)
        for col,name in enumerate(names):
            im=Image.open(p/'animation'/f'phone-{name}.png').convert('RGB');im.thumbnail((195,405))
            board.paste(im,(col*195,30));draw.text((col*195+8,5),name,font=font,fill='#16232d')
    board.save(p/'animation'/f'{group}-board.png')
