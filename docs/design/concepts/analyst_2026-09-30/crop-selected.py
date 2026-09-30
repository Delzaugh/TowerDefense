from pathlib import Path
from PIL import Image
p=Path(__file__).parent
im=Image.open(p/'concepts-raw.png')
im.crop((1160,150,1610,422)).save(p/'insight-owl-selected.png')
