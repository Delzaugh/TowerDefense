"""Compose measured six-shooter concept sheets from one isolated Blender scene."""
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
RENDERS = HERE / 'renders'
TEMPLATE = Path.home() / '.codex/skills/model-spec-sheet-skill/assets/model-spec-sheet-template.png'
USER = Path.home() / '.codex/generated_images/01a0b178-5e05-7502-8e7f-91669ea050d0/exec-67ea368d-cb14-4c68-bae0-3d5df3b5e1ce.png'
FONT = 'C:/Windows/Fonts/segoeui.ttf'
BOLD = 'C:/Windows/Fonts/segoeuib.ttf'
NAVY = (22, 41, 61)
NAVY2 = (28, 52, 74)
WHITE = (236, 243, 250)
MUTED = (174, 200, 219)
CYAN = (51, 217, 235)
LIME = (215, 237, 20)

def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)

def render(name):
    im = Image.open(RENDERS / (name + '.png')).convert('RGBA')
    return im.crop(im.getchannel('A').getbbox())

def place(canvas, im, box, scale=0.96):
    x0,y0,x1,y1 = box
    maxw, maxh = int((x1-x0)*scale), int((y1-y0)*scale)
    im = im.copy()
    ratio = min(maxw/im.width, maxh/im.height)
    im = im.resize((max(1,round(im.width*ratio)),max(1,round(im.height*ratio))),Image.Resampling.LANCZOS)
    x = int((x0+x1-im.width)/2)
    y = int((y0+y1-im.height)/2)
    canvas.alpha_composite(im,(x,y))
    return (x,y,im.width,im.height)

def write(draw, xy, value, size=30, color=WHITE, bold=False, anchor=None):
    draw.text(xy, value, font=font(size,bold), fill=color, anchor=anchor)

def title(canvas, heading, subtitle):
    d=ImageDraw.Draw(canvas)
    write(d,(76,58),heading,66,WHITE,True)
    write(d,(78,136),subtitle,31,MUTED)
    d.line((76,191,2996,191),fill=(69,100,126),width=2)

def card(draw, box, fill=(26,47,69)):
    draw.rounded_rectangle(box,radius=22,fill=fill,outline=(73,104,127),width=2)

def make_coverage():
    s=1600; c=s//2
    im=Image.new('RGBA',(s,s),(20,39,58,255))
    d=ImageDraw.Draw(im,'RGBA')
    # Six mathematically exact, edge-adjacent 60-degree horizontal sectors.
    for i in range(6):
        a0=-90+i*60; a1=a0+60
        col=(43,196,222,56) if i%2==0 else (214,234,25,42)
        d.pieslice((c-667,c-667,c+667,c+667),a0,a1,fill=col)
    d.ellipse((c-509,c-509,c+509,c+509),fill=(20,39,58,255))
    d.ellipse((c-667,c-667,c+667,c+667),outline=(107,167,192,255),width=4)
    d.ellipse((c-509,c-509,c+509,c+509),outline=(107,167,192,255),width=4)
    for i in range(6):
        theta=math.radians(i*60)
        x=c+667*math.sin(theta); y=c-667*math.cos(theta)
        d.line((c,c,x,y),fill=(104,157,180,130),width=3)
    top=render('top').rotate(180,expand=True)
    place(im,top,(c-459,c-459,c+459,c+459),0.94)
    d=ImageDraw.Draw(im)
    for i in range(6):
        az=30+60*i
        theta=math.radians(az)
        x=c+573*math.sin(theta); y=c-573*math.cos(theta)
        d.ellipse((x-13,y-13,x+13,y+13),fill=CYAN)
        lx=c+738*math.sin(theta);ly=c-738*math.cos(theta)
        write(d,(lx,ly),f'S{i+1}  {az}°',29,WHITE,True,'mm')
    write(d,(c,23),'FRONT  /  0°',31,WHITE,True,'mt')
    write(d,(c,1539),'6 × 60°  =  360°',38,WHITE,True,'mb')
    im.convert('RGB').save(HERE/'linter-coverage-plan.png',optimize=True)
    return im

def make_spec():
    sheet=Image.open(TEMPLATE).convert('RGBA')
    assert sheet.size==(1536,1024)
    # Clear only the header placeholders while preserving the template gradient.
    anchor=[sheet.getpixel((x,105)) for x in range(1536)]
    reference=[sheet.getpixel((800,y)) for y in range(106)]
    bottom=reference[105]
    for y in range(106):
        delta=[reference[y][k]-bottom[k] for k in range(3)]
        for x,base in enumerate(anchor):
            sheet.putpixel((x,y),tuple(max(0,min(255,base[k]+delta[k])) for k in range(3))+(255,))
    d=ImageDraw.Draw(sheet)
    write(d,(42,17),'Linter Agent',40,WHITE,True)
    write(d,(42,68),'Six radial rule shooters  |  360° plan coverage',22,(213,225,238))
    write(d,(1508,29),'Tower concept',18,WHITE,False,'rt')
    views=[(46,'front'),(289,'front_left'),(533,'left'),(775,'back'),(1018,'back_right'),(1263,'right')]
    for px,name in views:
        place(sheet,render(name),(px+8,213,px+218,386),1.0)
    # Supplied gameplay panel is an illustrative scale context; shooter count is unreadable at this size.
    old=Image.open(USER).convert('RGBA')
    sheet.alpha_composite(old.crop((31,534,485,933)),(31,534))
    place(sheet,render('wireframe'),(520,604,783,868),0.97)
    d=ImageDraw.Draw(sheet)
    write(d,(517,890),'Concept mesh topology',16,WHITE)
    # The palette is generated from the concept scene's documented swatches.
    manifest=json.loads((ROOT/'blender/towers/linter_agent/v01/asset.json').read_text(encoding='utf-8-sig'))
    roles=manifest['texturePalettes'][0]['roles']
    colors=[tuple(int(roles[name]['color'].lstrip('#')[j:j+2],16) for j in (0,2,4)) for name in roles]
    for i,color in enumerate(colors):
        d.rectangle((855+i*32,700,885+i*32,731),fill=color)
    write(d,(855,626),'Concept palette',18,WHITE)
    write(d,(855,655),'32 × 4 px  |  UV0 in study mesh',16,(204,222,238))
    write(d,(855,763),'* study mesh only; not runtime',16,(204,222,238))
    write(d,(855,790),'Six-pod runtime UV pending',16,(204,222,238))
    # Replace model-info dashes and palette placeholders from the original template.
    for y in range(578,697):
        d.line((1300,y,1488,y),fill=sheet.getpixel((1480,y)),width=1)
    for y,value in zip((581,605,630,655,680),('2,364*','1,252*','32 × 4*','2*','≤ 4,000 tris')):
        write(d,(1310,y),value,17,WHITE)
    for i,color in enumerate([(215,237,20),(51,62,72),(8,29,41),(246,246,236),(45,214,231)]):
        x=1192+62*i
        d.rounded_rectangle((x+2,767,x+40,806),radius=3,fill=color)
    for y in range(876,945):
        d.line((1191,y,1487,y),fill=sheet.getpixel((1482,y)),width=1)
    for y,note in zip((877,901,925),('6 shooters  ·  60° apart','60° sector each (±30°)','360° horizontal coverage')):
        write(d,(1192,y),note,16,WHITE)
    sheet.convert('RGB').save(HERE/'linter-spec-sheet.png',optimize=True)

def make_six_angles():
    im=Image.new('RGBA',(3072,2048),NAVY+(255,))
    d=ImageDraw.Draw(im)
    names=[('front','Front'),('front_left','Front-Left'),('left','Left'),('back','Back'),('back_right','Back-Right'),('right','Right')]
    for i,(name,label) in enumerate(names):
        col=i%3;row=i//3;x0=col*1024;y0=row*1024
        if col:d.line((x0,0,x0,2048),fill=(60,89,113),width=2)
        if row:d.line((0,y0,3072,y0),fill=(60,89,113),width=2)
        place(im,render(name),(x0+90,y0+120,x0+934,y0+840),1)
        write(d,(x0+512,y0+907),label,36,WHITE,False,'mm')
    im.convert('RGB').save(HERE/'linter-six-angle-sheet.png',optimize=True)

def make_anatomy():
    im=Image.new('RGBA',(3072,2048),NAVY+(255,))
    title(im,'LINTER AGENT  /  EXTERNAL ANATOMY','Six-shooter concept study · visible construction only')
    d=ImageDraw.Draw(im)
    card(d,(75,230,1940,1960))
    hero=place(im,render('front_left'),(220,355,1780,1660),1)
    card(d,(1990,230,2995,1060))
    card(d,(1990,1090,2995,1960))
    place(im,render('front'),(2090,300,2895,900),0.96)
    place(im,render('top').rotate(180,expand=True),(2090,1170,2895,1775),0.95)
    d=ImageDraw.Draw(im)
    write(d,(2065,261),'FRONT  /  FACE CLEARANCE',26,WHITE,True)
    write(d,(2065,1120),'TOP  /  SIX PODS',26,WHITE,True)
    write(d,(85,1850),'Illustrative anatomy from the isolated concept mesh. Rear surfaces are proposed.',25,MUTED)
    def leader(num,label,tx,ty,px,py):
        d.line((tx+44,ty+20,px,py),fill=CYAN,width=3)
        d.ellipse((px-7,py-7,px+7,py+7),fill=CYAN)
        d.ellipse((tx,ty,tx+40,ty+40),fill=CYAN)
        write(d,(tx+20,ty+20),str(num),21,NAVY,True,'mm')
        write(d,(tx+52,ty+1),label,26,WHITE,True)
    leader(1,'Octagonal lime shell',135,330,780,875)
    leader(2,'Dark inset crown',1230,330,990,666)
    leader(3,'Seated visor + cyan inlays',115,1660,1435,995)
    leader(4,'Face status marks',1030,1660,1360,1240)
    leader(5,'Radial shooter pod',117,1450,505,1180)
    leader(6,'Dark lower chassis',1240,1460,855,1280)
    im.convert('RGB').save(HERE/'linter-anatomy-sheet.png',optimize=True)

def mask_at_size(name,size=(420,420)):
    rgba=render(name)
    rgba.thumbnail(size,Image.Resampling.LANCZOS)
    return rgba

def make_shape():
    im=Image.new('RGB',(3072,2048),(245,246,244))
    d=ImageDraw.Draw(im)
    write(d,(74,45),'LINTER AGENT  /  SHAPE STUDY',60,(28,42,53),True)
    write(d,(76,130),'Six matched views · upper silhouettes · lower construction contours',28,(73,88,97))
    names=[('front','Front'),('front_left','Front-Left'),('left','Left'),('back','Back'),('back_right','Back-Right'),('right','Right')]
    for i,(name,label) in enumerate(names):
        x=52+i*500
        rgba=mask_at_size(name,(450,450))
        mask=rgba.getchannel('A')
        # Solid black upper row: recesses remain opaque.
        block=Image.new('RGB',rgba.size,(0,0,0))
        im.paste(block,(x+(450-rgba.width)//2,285+(450-rgba.height)//2),mask)
        # White lower contour silhouette with a strong outline and sparse main edges.
        cx=x+(450-rgba.width)//2;cy=1150+(450-rgba.height)//2
        im.paste((255,255,255),(cx,cy,cx+rgba.width,cy+rgba.height),mask)
        outline=mask.filter(ImageFilter.MaxFilter(9))
        edge=ImageOps.invert(mask.filter(ImageFilter.MinFilter(7)))
        outer=ImageChops.multiply(outline,edge)
        line=Image.new('RGB',rgba.size,(20,29,35))
        im.paste(line,(cx,cy),outer)
        gray=ImageOps.grayscale(rgba.convert('RGB'))
        inner=gray.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v>54 else 0)
        inner=ImageChops.multiply(inner,mask)
        im.paste((104,113,119),(cx,cy,cx+rgba.width,cy+rgba.height),inner)
        write(d,(x+225,760),label,25,(45,55,62),False,'mm')
        write(d,(x+225,1630),label,25,(45,55,62),False,'mm')
    write(d,(74,220),'SILHOUETTES',27,(39,54,62),True)
    write(d,(74,1080),'CONTOURS',27,(39,54,62),True)
    im.save(HERE/'linter-shape-study.png',optimize=True)

def make_shooter_detail(coverage):
    im=Image.new('RGBA',(3072,2048),NAVY+(255,))
    title(im,'LINTER AGENT  /  SHOOTER POD','Six identical radial units · one 60° horizontal sector per shooter')
    d=ImageDraw.Draw(im)
    card(d,(76,230,1410,1510));card(d,(1460,230,2996,1965));card(d,(76,1540,1410,1965))
    place(im,render('shooter_three_quarter'),(180,330,1300,1350),0.95)
    place(im,render('shooter_front'),(210,1560,770,1915),0.95)
    place(im,render('front_left'),(810,1560,1320,1915),0.95)
    place(im,coverage,(1490,275,2970,1880),0.99)
    d=ImageDraw.Draw(im)
    write(d,(154,260),'ISOLATED HOUSING',28,WHITE,True)
    write(d,(115,1564),'FACE',23,WHITE,True)
    write(d,(829,1564),'FITTED CONTEXT',23,WHITE,True)
    write(d,(154,1375),'Lime rim · dark recessed port · shared side-wall depth',27,WHITE)
    write(d,(154,1425),'Radial mount is conceptual; no hidden fasteners specified.',23,MUTED)
    im.convert('RGB').save(HERE/'linter-accessory-shooter.png',optimize=True)

def make_visor_detail():
    im=Image.new('RGBA',(3072,2048),NAVY+(255,))
    title(im,'LINTER AGENT  /  VISOR','Continuous fitted brow with two tapered cyan eye inlays')
    d=ImageDraw.Draw(im)
    card(d,(76,230,1930,1320));card(d,(76,1350,1930,1965));card(d,(1980,230,2996,1965))
    place(im,render('visor_three_quarter'),(190,350,1815,1190),0.9)
    place(im,render('visor_front'),(190,1440,1815,1880),0.95)
    place(im,render('front_left'),(2040,380,2940,1560),0.95)
    d=ImageDraw.Draw(im)
    write(d,(150,268),'ISOLATED THREE-QUARTER',27,WHITE,True)
    write(d,(150,1375),'FRONT  /  TWO INLAYS',27,WHITE,True)
    write(d,(2030,268),'FITTED CONTEXT',27,WHITE,True)
    write(d,(2020,1720),'Seated in front shell band',24,WHITE)
    write(d,(2020,1770),'No separate strap or lens mount inferred',21,MUTED)
    im.convert('RGB').save(HERE/'linter-accessory-visor.png',optimize=True)

if __name__=='__main__':
    from PIL import ImageChops
    coverage=make_coverage()
    make_spec();make_six_angles();make_anatomy();make_shape();make_shooter_detail(coverage);make_visor_detail()
    print('Created seven PNGs in',HERE)
