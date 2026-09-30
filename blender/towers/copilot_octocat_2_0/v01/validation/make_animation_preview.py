"""Review-only montage from actual Inspector frames; no replacement art."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
root=Path(__file__).resolve().parents[5]
folders=[root/'blender/towers'/n/'v01/validation/animation' for n in ['copilot_octocat_2_0','copilot_octocat_2_0_lowpoly']]
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',16)
frames=[]
for i in range(24):
 frame=Image.new('RGB',(640,372),(24,42,52));draw=ImageDraw.Draw(frame)
 for j,folder in enumerate(folders):
  image=Image.open(folder/f'walk-{i:02d}.png').convert('RGB').crop((230,105,600,500)).resize((320,342))
  frame.paste(image,(j*320,30));draw.text((j*320+18,7),['Octocat 2.0','Octocat 2.0 — low poly'][j],font=font,fill='#cce6eb')
 frames.append(frame)
frames[0].save(folders[0]/'walk-comparison.gif',save_all=True,append_images=frames[1:],duration=[40 if i%6==5 else 50 for i in range(24)],loop=0,optimize=False)
sheet=Image.new('RGB',(960,680),(24,42,52))
for row,folder in enumerate(folders):
 for col,(clip,p) in enumerate([('idle',40),('work',40),('hit',20)]):
  image=Image.open(folder/f'{clip}-{p}.png').convert('RGB').crop((230,105,600,500)).resize((320,312))
  sheet.paste(image,(col*320,row*340+28));ImageDraw.Draw(sheet).text((col*320+18,row*340+6),f'{"High" if row==0 else "Low"}: {clip}',font=font,fill='#cce6eb')
sheet.save(folders[0]/'acting-comparison.png')
