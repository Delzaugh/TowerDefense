"""Read-only centre-plane contour measurement of the canonical GLB."""
import json, struct, hashlib, math
from pathlib import Path
HERE=Path(__file__).parent
ROOT=HERE.parents[3]
P=ROOT/'assets/runtime/towers/copilot_architect_v01.glb'
data=P.read_bytes();offset=12;binary=None;doc=None
while offset<len(data):
    length,kind=struct.unpack_from('<II',data,offset);chunk=data[offset+8:offset+8+length];offset+=8+length
    if kind==0x4E4F534A:doc=json.loads(chunk)
    if kind==0x004E4942:binary=chunk
def accessor(index):
    a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
    count={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
    fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']]
    size=struct.calcsize(fmt)*count;stride=v.get('byteStride',size)
    base=v.get('byteOffset',0)+a.get('byteOffset',0)
    return [struct.unpack_from('<'+fmt*count,binary,base+i*stride) for i in range(a['count'])]
def section(t,x):
    points=[]
    for p,q in zip(t,t[1:]+t[:1]):
        if abs(p[0]-x)<1e-7:points.append((p[2],p[1]))
        if (p[0]-x)*(q[0]-x)<-1e-12:
            r=(x-p[0])/(q[0]-p[0]);points.append((p[2]+r*(q[2]-p[2]),p[1]+r*(q[1]-p[1])))
    unique=[]
    for p in points:
        if not any(math.dist(p,q)<1e-6 for q in unique):unique.append(p)
    return unique[:2] if len(unique)>=2 else None
roles=['shell','trim','slate','screen','amber','cyan','shell_dark','detail']
sections={x:{r:[] for r in roles} for x in (0,.33,.86)}
for mesh in doc['meshes']:
    for prim in mesh['primitives']:
        pos=accessor(prim['attributes']['POSITION']);uv=accessor(prim['attributes']['TEXCOORD_0']);idx=[i[0] for i in accessor(prim['indices'])]
        for i in range(0,len(idx),3):
            ids=idx[i:i+3];t=[pos[k] for k in ids];role=roles[min(7,int(uv[ids[0]][0]*8))]
            for x in sections:
                seg=section(t,x)
                if seg:sections[x][role].append(seg)
def metrics(segs):
    pts=sorted(set((round(p[1],6),round(p[0],6)) for s in segs for p in s))
    lo,hi=pts[0],pts[-1];height=hi[0]-lo[0]
    ds=[(depth-(lo[1]+(hi[1]-lo[1])*(y-lo[0])/height),y,depth) for y,depth in pts]
    bulge,peak_y,peak_depth=max(ds)
    return {'height_m':height,'chord_bulge_m':bulge,'bulge_percent_of_height':100*bulge/height,'peak_height_m':peak_y,'peak_forward_depth_m':peak_depth,'bottom':[lo[0],lo[1]],'top':[hi[0],hi[1]],'samples':pts}
display_sections={x:[seg for seg in s['screen'] if min(p[0] for p in seg)>.65] for x,s in sections.items()}
report={'asset':'copilot_architect','revision':45,'sha256':hashlib.sha256(data).hexdigest(),'method':'Actual GLB triangle-plane intersections. Forward distance=glTF Z; height=glTF Y. Display measured separately from rear marks sharing its palette role. No perspective reconstruction from concept artwork.','sections':{str(x):metrics(s) for x,s in display_sections.items()},'findings':['Centre display has a shallow vertical bow; broad near-vertical middle remains.','Forehead bridge projects over the display rather than forming one continuous domed faceplate.','Chalk cheeks read as a near-vertical front border; lower frame and chin provide little overall roll-under.','Reference artwork suggests fuller crown/display/chin volume; exact concept depth cannot be recovered from its perspective image.'],'recommendation':'Replace the shared generic front parabola with separately controlled crown, display and jaw profiles; deepen display bulge to an initial 0.18–0.22 m study, roll the lower rim backward and refit bridge/eyes. This is a proposed study, not an exact reference measurement or an implemented change.'}
OUT=HERE/'validation/contour-evaluation-r45';OUT.mkdir(exist_ok=True)
(OUT/'measurements.json').write_text(json.dumps(report,indent=2)+'\n')
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000" viewBox="0 0 1400 1000"><rect width="1400" height="1000" fill="#102235"/><g font-family="Arial" fill="#e2edf0">']
def text(x,y,s,size=18,color='#e2edf0'):svg.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}">{s}</text>')
def lines(segs,color,mapfn,width=2,dash=''):
    for seg in segs:
        p,q=[mapfn(*v) for v in seg];svg.append(f'<path d="M{p[0]:.2f},{p[1]:.2f} L{q[0]:.2f},{q[1]:.2f}" stroke="{color}" stroke-width="{width}" fill="none" stroke-dasharray="{dash}"/>')
left=lambda d,h:(80+(d+1.12)*260,780-h*260)
right=lambda d,h:(880+(d-.65)*460,830-(h-.20)*460)
for mapfn,xmin,xmax,ymin,ymax in [(left,-1,1.4,0,2.2),(right,.65,1.25,.2,1.5)]:
    step=.2 if mapfn==left else .1
    for i in range(round((xmax-xmin)/step)+1):
        x=xmin+step*i;lines([[(x,ymin),(x,ymax)]],'#284358',mapfn,1);px,py=mapfn(x,ymin);text(px-10,py+24,f'{x:.1f}' if mapfn==left else f'{x:.2f}',13,'#abc2d2')
    for i in range(round((ymax-ymin)/step)+1):
        y=ymin+step*i;lines([[(xmin,y),(xmax,y)]],'#284358',mapfn,1);px,py=mapfn(xmin,y);text(px-35,py+5,f'{y:.1f}',13,'#abc2d2')
colors={'shell':'#738fd0','trim':'#e2edf0','screen':'#00e5ef','amber':'#f2b54d','cyan':'#00e5ef','shell_dark':'#8fa5cc'}
for role,segs in sections[0].items():
    if segs:lines(segs,colors.get(role,'#89a4b8'),left,3 if role=='screen' else 1.5)
for x in sections:
    lines(display_sections[x],{0:'#00e5ef',.33:'#82dadd',.86:'#89a4b8'}[x],right,3)
s=report['sections']['0'];lo=s['bottom'];hi=s['top'];ys=[lo[0]+(hi[0]-lo[0])*i/100 for i in range(101)]
target=[(lo[1]+(hi[1]-lo[1])*(y-lo[0])/(hi[0]-lo[0])+.20*4*((y-lo[0])/(hi[0]-lo[0]))*(1-(y-lo[0])/(hi[0]-lo[0])),y) for y in ys]
poly=' '.join(f'{x:.2f},{y:.2f}' for x,y in map(lambda p:right(*p),target));svg.append(f'<polyline points="{poly}" fill="none" stroke="#f2b54d" stroke-width="3" stroke-dasharray="7 5"/>')
text(60,62,'Architect — vertical contour evaluation',32)
text(60,105,f"Actual centre bulge: {s['chord_bulge_m']*100:.1f} cm over {s['height_m']:.2f} m — {s['bulge_percent_of_height']:.1f}% of display height",21,'#abc2d2')
text(80,170,'Whole centre section · equal scale',22);text(870,170,'Display sections · equal scale',22)
text(80,835,'Forward distance (m) →',18);text(870,875,'Forward distance (m) →',18)
for i,(label,color) in enumerate([('Centre','#00e5ef'),('Eye line: x=0.33 m','#82dadd'),('Outer display: x=0.86 m','#89a4b8'),('Proposed 0.20 m bow','#f2b54d')]):text(870,905+i*22,label,16,color)
text(60,930,'Measured from revision 45 GLB; height is above ground.',16,'#abc2d2')
text(60,960,'Dashed amber is a proposed contour study. Model remains unchanged.',16,'#abc2d2')
svg.append('</g></svg>');(OUT/'vertical-contours.svg').write_text('\n'.join(svg),encoding='utf-8')
print(json.dumps({x:{k:v for k,v in s.items() if k!='samples'} for x,s in report['sections'].items()},indent=2))
