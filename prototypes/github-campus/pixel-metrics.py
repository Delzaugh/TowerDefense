from pathlib import Path
from PIL import Image,ImageStat
import json
folder=Path(__file__).resolve().parent/'artifacts'
rows=[]
for file in sorted(folder.glob('*.png')):
    im=Image.open(file).convert('RGB')
    w,h=im.size
    crop=im.crop((int(w*.22),int(h*.26),int(w*.83),int(h*.73)))
    stats=ImageStat.Stat(crop)
    colors=list(crop.resize((120,90)).get_flattened_data())
    quantized=len({tuple(int(c/20) for c in p) for p in colors})
    rows.append({'file':file.name,'size':[w,h],'center_crop_stddev':[round(v,2) for v in stats.stddev],'quantized_colors':quantized,'passed':max(stats.stddev)>10 and quantized>20})
result={'passed':all(r['passed'] for r in rows),'captures':rows}
(folder/'pixel-metrics.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))

