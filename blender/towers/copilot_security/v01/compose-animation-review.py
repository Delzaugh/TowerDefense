"""Arrange unchanged Inspector captures into diagnostic contact sheets."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent/'validation/animation'
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',20)
small=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',16)
for clip in ['idle','work','move','place','hit','resolve']:
 board=Image.new('RGB',(1080,875),'#e8eff4');draw=ImageDraw.Draw(board);draw.text((18,10),clip.upper()+' — exported animation',fill='#172631',font=font)
 for i,p in enumerate([0,13,25,50,71,75,100]):
  im=Image.open(HERE/f'{clip}-{p:03}.png').convert('RGB');im.thumbnail((350,247))
  x=10+(i%3)*360;y=48+(i//3)*274;board.paste(im,(x,y));draw.text((x+8,y+247),f'{p}% of clip',fill='#172631',font=small)
 board.save(HERE/f'board-{clip}.png')
