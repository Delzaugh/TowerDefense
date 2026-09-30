from PIL import Image
from pathlib import Path
p=Path(__file__).parent
im=Image.open(p/'concepts-raw.png').convert('RGBA')
t=Image.open('C:/Users/jonas/.codex/skills/tower-defense-concept-sheet/assets/concept-sheet-template.png').convert('RGBA')
for x0,x1 in [(31,555),(576,1101),(1121,1641)]:
    for y0,y1 in [(418,493),(812,891)]:
        im.paste(t.crop((x0,y0,x1,y1)),(x0,y0))
im.save(p/'concepts-clean.png')
