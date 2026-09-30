from pathlib import Path
import urllib.request,re,json,hashlib
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2]/'docs/research/github-offices-2026-09-30'
def get(u):return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=45).read()
h=get('https://www.tonytimetables.com/art-direction/').decode()
(root/'work/art-direction.html').write_text(h,encoding='utf8')
urls=[]
for u in re.findall(r'https://images.squarespace-cdn.com/[^\s"<>]+',h):
 u=u.replace('&amp;','&').split('?')[0]
 if any(k in u.lower() for k in ['office-saskia','office-hobbs','sf-cafe','artist_parnter','office-anna','office-casseras','office-edwards']) and u not in urls:urls.append(u)
entries=[]
for i,u in enumerate(urls):
 b=get(u+'?format=1600w');name='art-direction-'+str(i+1).zfill(2)+'.jpg';p=root/'images'/name;p.write_bytes(b)
 im=Image.open(p);entries.append({'file':name,'url':u,'width':im.width,'height':im.height,'sha256':hashlib.sha256(b).hexdigest(),'use':'Mural design reference only, never runtime texture','source':'https://www.tonytimetables.com/art-direction/'})
(root/'work/mural-references.json').write_text(json.dumps(entries,indent=2))
board=Image.new('RGB',(1600,340*((len(entries)+3)//4)),'#eee');d=ImageDraw.Draw(board)
for i,e in enumerate(entries):
 im=Image.open(root/'images'/e['file']);im.thumbnail((390,285));x=(i%4)*400;y=(i//4)*340;board.paste(im,(x+(400-im.width)//2,y));d.text((x+10,y+295),e['file']+' '+e['url'].split('/')[-1][:38],fill='#111')
board.save(root/'work/mural-reference-board.jpg')
print(json.dumps(entries,indent=2))
