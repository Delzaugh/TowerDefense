import bpy,bmesh,math,os,sys,json
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'_shared'))
from persona_quality import Maker,matrix,rounded
m=json.loads(Path(os.environ.get('ASSET_MANIFEST',HERE/'asset.json')).read_text(encoding='utf-8-sig'))
bpy.ops.wm.read_factory_settings(use_empty=True)
a=Maker(m)
# Landmark-based broad dome, cheek taper and rounded lower contact.
outer=[(0,1.73),(.40,1.68),(.73,1.54),(.97,1.31),(1.10,1.02),(1.105,.69),(.99,.39),(.70,.14),(0,.015),(-.70,.14),(-.99,.39),(-1.105,.69),(-1.10,1.02),(-.97,1.31),(-.73,1.54),(-.40,1.68)]
inner=[(0,1.28),(.35,1.285),(.65,1.22),(.84,1.08),(.94,.89),(.94,.64),(.82,.40),(.57,.22),(0,.13),(-.57,.22),(-.82,.40),(-.94,.64),(-.94,.89),(-.84,1.08),(-.65,1.22),(-.35,1.285)]
def subdiv(p):
    out=[]
    for i in range(len(p)):
        p0,p1,p2,p3=[p[(i+j)%len(p)]for j in (-1,0,1,2)]
        for t in (0,1/3,2/3):
            out.append(tuple(.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t)for k in range(2)))
    return out
outer=subdiv(outer);inner=subdiv(inner);n=len(outer)
def front(x,z):return -.94+.26*(x/1.105)**2+.22*((z-.82)/.90)**2
v=[];f=[];roles=[]
for j,(y,sx,sz) in enumerate([(0,1,1),(-.25,1.025,1.015),(.19,1.01,1.01),(.56,.90,.96),(.81,.65,.78),(.91,.30,.45)]):
    v.extend((x*sx,front(x,z) if j==0 else y,(z-.82)*sz+.82) for x,z in outer)
for j in range(5):
    for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i));roles.append('shell')
end=len(v);v.append((0,.96,.82))
for i in range(n):f.append((5*n+i,5*n+(i+1)%n,end));roles.append('shell')
prev=0
for t,off in [(.55,-.024),(1,.015)]:
    start=len(v)
    for (xo,zo),(xi,zi) in zip(outer,inner):
        x=xo+(xi-xo)*t;z=zo+(zi-zo)*t;v.append((x,front(x,z)+off,z))
    for i in range(n):f.append((prev+i,prev+(i+1)%n,start+(i+1)%n,start+i));roles.append('shell')
    prev=start
for scale in (.73,.44,.18):
    start=len(v)
    for x,z in inner:
        x*=scale;z=(z-.68)*scale+.68;v.append((x,front(x,z)+.015,z))
    for i in range(n):f.append((prev+i,prev+(i+1)%n,start+(i+1)%n,start+i));roles.append('screen')
    prev=start
end=len(v);v.append((0,front(0,.68)+.015,.68))
for i in range(n):f.append((prev+i,prev+(i+1)%n,end));roles.append('screen')
a.add('convex_shell_and_display',v,f,roles,True)
# Whole ivory brow-rim is a continuous annulus. Outer wing extensions are part
# of its outline; no overlapping feathers or disconnected tip plates.
N=24
lens_parts=[]
for s in (-1,1):
    cx=s*.50;cz=1.17;angle=math.radians(s*26)
    def optic_point(t,scale=1):
        x=.43*math.cos(t)*scale;z=.315*math.sin(t)*scale
        return (cx+x*math.cos(angle)-z*math.sin(angle),cz+x*math.sin(angle)+z*math.cos(angle))
    inside=[optic_point(math.tau*i/N,.88) for i in range(N)]
    outside=[]
    for i in range(N):
        t=math.tau*i/N;x,z=optic_point(t,1.19)
        # Broad rising outer edge with a solid point, right and left mirrored.
        side_angle=math.atan2(z-cz,s*(x-cx))
        bump=max(0,1-abs(side_angle-.78)/.75)**1.4
        x+=s*.25*bump;z+=.29*bump
        outside.append((x,z))
    vv=[]
    for kind,y in [('outer',-.82),('outer',-.99),('bevel',-1.055),('inner',-1.055),('inner',-.83)]:
        points=outside if kind=='outer' else inside if kind=='inner' else [(xo+(xi-xo)*.14,zo+(zi-zo)*.14)for(xo,zo),(xi,zi)in zip(outside,inside)]
        for x,z in points:vv.append((x,y+.11*(abs(x)-.50),z))
    ff=[(j*N+i,j*N+(i+1)%N,((j+1)%5)*N+(i+1)%N,((j+1)%5)*N+i) for j in range(5)for i in range(N)]
    a.add('continuous_owl_brow_rim_'+str(s),vv,ff,'trim')
    vv=[];rr=[]
    for scale,y in [(.88,-1.005),(.65,-1.040),(.35,-1.064)]:
        for i in range(N):
            x,z=optic_point(math.tau*i/N,scale);vv.append((x,y+.11*(abs(x)-.50),z))
    vv.append((cx,-1.075,cz));ff=[tuple(range(N-1,-1,-1))];rr=['lens']
    for j in range(2):
        for i in range(N):ff.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i));rr.append('lens')
    for i in range(N):ff.append((2*N+i,2*N+(i+1)%N,3*N));rr.append('lens')
    lens_parts.append((len(a.v),len(vv),cx,cz))
    a.add('opaque_analytical_lens_'+str(s),vv,ff,rr,True,True)
    # Deliberate opaque surface inlays follow the convex lens instead of a flat decal.
    def lens_y(x,z):
        dx=x-cx;dz=z-cz
        ux=dx*math.cos(angle)+dz*math.sin(angle)
        uz=-dx*math.sin(angle)+dz*math.cos(angle)
        radius=math.sqrt((ux/.43)**2+(uz/.315)**2)
        if radius<=.35:
            depth=-1.075+radius/.35*.011
        elif radius<=.65:
            depth=-1.064+(radius-.35)/.30*.024
        else:
            depth=-1.040+(radius-.65)/.23*.035
        return depth+.11*(abs(x)-.50)-.014
    def glyph_stroke(name,points,width):
        # Continuous mitered ribbon with a deliberate shallow surface clearance.
        left=[];right=[]
        for i,p in enumerate(points):
            p=Vector(p)
            before=(p-Vector(points[i-1])).normalized() if i else (Vector(points[1])-p).normalized()
            after=(Vector(points[i+1])-p).normalized() if i<len(points)-1 else before
            n1=Vector((-before.y,before.x));n2=Vector((-after.y,after.x))
            bis=(n1+n2).normalized();offset=bis*(width*.5/max(.35,bis.dot(n1)))
            left.append(p+offset);right.append(p-offset)
        vertices=[]
        for p,q in zip(left,right):
            for local in (p,q):
                x=cx+local.x;z=cz+local.y;vertices.append((x,lens_y(x,z),z))
        faces=[(2*i,2*i+1,2*i+3,2*i+2)for i in range(len(points)-1)]
        a.add(name,vertices,faces,'trim',False,True)
    if s<0:
        for ix in (-1,1):
            for iz in (-1,1):
                glyph_stroke('focus_corner_'+str(ix)+'_'+str(iz),[(ix*.095,iz*.125),(ix*.19,iz*.125),(ix*.19,iz*.045)],.025)
        glyph_stroke('focus_cross_horizontal',[(-.06,0),(.06,0)],.018)
        glyph_stroke('focus_cross_vertical',[(0,-.055),(0,.055)],.018)
    else:
        for i,height in enumerate((.10,.18,.27)):
            x=(i-1)*.10
            glyph_stroke('chart_column_'+str(i),[(x,-.125),(x,-.125+height)],.043)
        glyph_stroke('chart_baseline',[(x,-.145)for x in (-.17,-.085,0,.085,.17)],.023)
    # Fitted ear drum with real segmented thickness and faceted ivory cap.
    axis='right' if s>0 else 'left'
    xf=matrix((s*1.10,-.05,.85),axis)
    oval=[(.25*math.cos(math.tau*i/12),.43*math.sin(math.tau*i/12))for i in range(12)]
    a.loft('orange_ear_drum_'+str(s),[(oval,.06),(oval,-.10),([(x*.93,z*.94)for x,z in oval],-.18)],'shell_dark',xf)
    cap=[(.205*math.cos(math.tau*i/12),.325*math.sin(math.tau*i/12))for i in range(12)]
    a.loft('ivory_faceted_ear_cap_'+str(s),[(cap,-.18),([(x*.90,z*.91)for x,z in cap],-.245),([(x*.40,z*.50)for x,z in cap],-.31)],'trim',xf)
    # A continuous three-segment signal trace sits on the endcap's central seat.
    a.stroke('ear_signal_trace_'+str(s),[(-.115,-.035),(-.04,.07),(.035,-.035),(.115,.075)],.032,(s*1.414,-.05,.85),'lens',axis=axis,depth=.01)
    # Independent lower eye geometry follows the curved display.
    eye=rounded(.125,.29,.0625,3);nn=len(eye);vv=[]
    for offset in (0,-.017):
        for x,z in eye:
            x+=s*.25;z+=.52;vv.append((x,front(x,z)+offset,z))
    ff=[tuple(range(nn-1,-1,-1)),tuple(nn+i for i in range(nn))]+[(i,(i+1)%nn,nn+(i+1)%nn,nn+i)for i in range(nn)]
    a.add('display_eye_'+str(s),vv,ff,'cyan',True,True)
# Solid bridge continues down to an ivory diamond with recessed cyan insert.
a.box('solid_brow_bridge',(0,-.95,1.225),(.24,.22,.17),'trim',.025,2)
diamond=[(0,.21),(.16,.065),(0,-.20),(-.16,.065)]
xf=matrix((0,-1.075,1.035))
a.loft('ivory_bridge_diamond',[(diamond,.10),(diamond,-.01),([(x*.84,z*.86)for x,z in diamond],-.04)],'trim',xf)
a.loft('cyan_bridge_inset',[([(x*.63,z*.62)for x,z in diamond],-.045),([(x*.57,z*.57)for x,z in diamond],-.056)],'cyan',xf)
# Three rising data tabs fitted into the curved forehead above the central bridge.
for i,h in enumerate((.07,.105,.14)):
    x=(i-1)*.09;z=1.57+h*.5
    a.box('forehead_data_tab_'+str(i),(x,front(x,z)+.004,z),(.045,.022,h),'shell_dark',0)
output=os.environ.get('ASSET_BUILD_DIR',str(HERE));source=os.environ.get('ASSET_SOURCE_NAME','copilot_analyst_v01.blend')
a.finish(output,source)
mesh=bpy.data.objects['analyst_model'].data
normals=[tuple(n.vector)for n in mesh.corner_normals]
body_start,body_count=next((start,count)for name,start,count in a.parts if name=='convex_shell_and_display')
for loop in mesh.loops:
    vi=loop.vertex_index;x,y,z=a.v[vi]
    if body_start<=vi<body_start+body_count and y<=front(x,z)+.02:
        normals[loop.index]=tuple(Vector((.52*x/(1.105**2),-1,.44*(z-.82)/(.90**2))).normalized())
    for start,count,cx,cz in lens_parts:
        if start<=vi<start+count:
            normals[loop.index]=tuple(Vector(((x-cx)*.8,-1,(z-cz)*1.2)).normalized())
mesh.normals_split_custom_set(normals)
bpy.data.objects['root']['design']='Insight Owl: user requested analytical lens/ear features and pale teal palette; model only'
bpy.data.materials['analyst_palette'].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.58
bpy.data.materials['analyst_optics'].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.32
bpy.ops.wm.save_as_mainfile(filepath=str(Path(output)/source))
