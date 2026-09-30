"""Boundary Watcher: traced front outline and fitted continuous bracket guards.
Blender -Y forward, +Z up; glTF +Z forward and +Y up.
"""
import bpy,bmesh,os,sys,json,math
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'_shared'))
from persona_quality import Maker,matrix,rounded
m=json.loads(Path(os.environ.get('ASSET_MANIFEST',HERE/'asset.json')).read_text(encoding='utf-8-sig'))
bpy.ops.wm.read_factory_settings(use_empty=True)
a=Maker(m)
BLOCKOUT=os.environ.get('TESTER_BLOCKOUT')=='1'

# Matched front landmarks from selected04, in metres. No generic sphere/head.
outer=[(0,1.59),(.43,1.55),(.72,1.43),(.90,1.23),(.98,.99),(.98,.64),(.86,.34),(.59,.12),(0,.025),(-.59,.12),(-.86,.34),(-.98,.64),(-.98,.99),(-.90,1.23),(-.72,1.43),(-.43,1.55)]
inner=[(0,1.25),(.37,1.245),(.63,1.20),(.76,1.10),(.825,.95),(.825,.63),(.72,.38),(.49,.23),(0,.16),(-.49,.23),(-.72,.38),(-.825,.63),(-.825,.95),(-.76,1.10),(-.63,1.20),(-.37,1.245)]
# Subdivide reference contour edges without changing their traced extrema.
def subdivide(p):
    return [q for i,p0 in enumerate(p) for q in [p0,tuple((p0[k]+p[(i+1)%len(p)][k])*.5 for k in range(2))]]
outer=subdivide(outer);inner=subdivide(inner)
def front_depth(x,z):
    # Broad convex cap in both axes; temples, forehead and jaw roll away from
    # the central display. This changes geometry, not just surface normals.
    return -.995+.29*(x/.98)**2+.20*((z-.83)/.83)**2
def display_depth(x,z):return front_depth(x,z)+.018
n=len(outer);v=[];f=[];roles=[]
for depth,sx,sz in [(-.61,1,1),(-.28,1.035,1.025),(.18,1.015,1.005),(.57,.91,.95),(.81,.64,.79),(.91,.27,.42)]:
    for x,z in outer:
        yy=front_depth(x,z) if depth<-.3 else depth
        v.append((x*sx,yy,(z-.82)*sz+.82))
for j in range(5):
    for i in range(n):
        q=(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i)
        f.append(q)
        z=sum(v[k][2] for k in q)/4
        roles.append('rear_region' if j>=2 else 'shell')
rear=len(v);v.append((0,.95,.82))
for i in range(n):
    f.append((5*n+i,5*n+(i+1)%n,rear));roles.append('rear_region')
# Continuous lip, then convex dark display. Edges shared with green shell.
previous=0
for t,offset in [(.42,-.025),(.82,-.025),(1,.018)]:
    start=len(v)
    for (xo,zo),(xi,zi) in zip(outer,inner):
        x=xo+(xi-xo)*t;z=zo+(zi-zo)*t
        v.append((x,front_depth(x,z)+offset,z))
    for i in range(n):
        f.append((previous+i,previous+(i+1)%n,start+(i+1)%n,start+i));roles.append('shell')
    previous=start
for scale in (.78,.54,.30,.12):
    start=len(v)
    for x,z in inner:
        x*=scale;z=(z-.70)*scale+.70
        v.append((x,display_depth(x,z),z))
    for i in range(n):
        f.append((previous+i,previous+(i+1)%n,start+(i+1)%n,start+i));roles.append('screen')
    previous=start
center=len(v);v.append((0,display_depth(0,.70),.70))
for i in range(n):
    f.append((previous+i,previous+(i+1)%n,center));roles.append('screen')
# Split color boundaries on the same shell at a horizontal seam. Avoid a rear
# triangle-fan color wedge or pixel-like stepped material boundary.
ff=[];rr=[]
def clip_height(poly,above):
    out=[]
    for k,p in enumerate(poly):
        q=poly[(k+1)%len(poly)]
        ip=p[2]>=.30 if above else p[2]<=.30
        iq=q[2]>=.30 if above else q[2]<=.30
        if ip:out.append(p)
        if ip!=iq:
            t=(.30-p[2])/(q[2]-p[2])
            out.append(tuple(p[j]+t*(q[j]-p[j]) for j in range(3)))
    return out
for face,role in zip(f,roles):
    if role!='rear_region':ff.append(face);rr.append(role);continue
    poly=[v[i] for i in face]
    if all(p[2]>=.30 for p in poly):ff.append(face);rr.append('shell');continue
    if all(p[2]<=.30 for p in poly):ff.append(face);rr.append('graphite');continue
    for above,color in [(True,'shell'),(False,'graphite')]:
        clipped=clip_height(poly,above)
        if len(clipped)>=3:
            start=len(v);v.extend(clipped);ff.append(tuple(range(start,start+len(clipped))));rr.append(color)
a.add('landmark_shell_lip_and_display',v,ff,rr,True)
# Broad centered crest: a single low trapezoid with a sloped rear.
v=[(-.25,-.73,1.53),(.25,-.73,1.53),(-.17,-.48,1.80),(.17,-.48,1.80),
   (-.16,.37,1.71),(.16,.37,1.71),(-.23,.56,1.48),(.23,.56,1.48)]
f=[(0,1,3,2),(2,3,5,4),(4,5,7,6),(0,2,4,6),(1,7,5,3),(0,6,7,1)]
a.add('single_crown_ridge',v,f,'shell')
# One continuous solid mitered bracket per side, bevel controlled at elbows.
for s in (-1,1):
    pts=[(s*1.015,1.46),(s*1.31,1.20),(s*1.31,.47),(s*1.015,.21)]
    width=.18
    left=[];right=[]
    for i,p in enumerate(pts):
        p=Vector(p)
        d1=(p-Vector(pts[i-1])).normalized() if i else (Vector(pts[1])-p).normalized()
        d2=(Vector(pts[i+1])-p).normalized() if i<len(pts)-1 else d1
        n1=Vector((-d1.y,d1.x));n2=Vector((-d2.y,d2.x))
        normal=(n1+n2).normalized()
        off=normal*(width/2/max(.35,normal.dot(n1)))
        left.append(tuple(p+off));right.append(tuple(p-off))
    # Original outline is a true open bracket, not intersecting bars.
    points=left+list(reversed(right));nn=len(points)
    gv=[(x,y,z) for y in (-.48,-.16) for x,z in points]
    gf=[tuple(range(nn-1,-1,-1)),tuple(nn+i for i in range(nn))]
    gf.extend((i,(i+1)%nn,nn+(i+1)%nn,nn+i) for i in range(nn))
    gm=bpy.data.meshes.new('guard_bevel_geometry');gm.from_pydata(gv,[],gf);gm.update()
    go=bpy.data.objects.new('guard_bevel',gm);bpy.context.collection.objects.link(go)
    bpy.context.view_layer.objects.active=go
    bevel=go.modifiers.new('Two-step guard corner radius','BEVEL');bevel.width=.028;bevel.segments=2
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    a.collect(go,'continuous_ivory_guard_'+str(s),'trim')
    # The middle of the guard is seated behind the ear housing. End clearance
    # remains open as in the selected reference; no visible connecting bars.
    a.box('guard_ear_contact_'+str(s),(s*1.17,-.19,.81),(.29,.16,.26),'trim',.012,1)
    # Inner ear module deliberately separate from outside bracket, oblique face.
    xf=matrix((s*1.055,-.375,.81),yaw=s*.60)
    p=[(-.16,.295),(-.105,.335),(.105,.30),(.17,.235),
       (.18,-.205),(.095,-.32),(-.105,-.32),(-.16,-.265)]
    if s<0:p=[(-x,z) for x,z in reversed(p)]
    # One seated housing with a continuous ivory bevel and a real recessed
    # graphite face. The rim and recess share vertices rather than stacking
    # flat plates, so the seat remains coherent from side and reverse views.
    ear_loops=[(.86,.91,.18),(1,1,.11),(1,1,-.005),
               (.86,.92,-.075),(.67,.75,-.075),(.61,.69,-.043)]
    en=len(p)
    ev=[(x*sx,y,z*sz) for sx,sz,y in ear_loops for x,z in p]
    ef=[tuple(range(en-1,-1,-1))];er=['trim']
    for j in range(len(ear_loops)-1):
        for i in range(en):
            ef.append((j*en+i,j*en+(i+1)%en,(j+1)*en+(i+1)%en,(j+1)*en+i))
            er.append('graphite' if j==4 else 'trim')
    ef.append(tuple((len(ear_loops)-1)*en+i for i in range(en)));er.append('graphite')
    a.add('beveled_recessed_ear_housing_'+str(s),ev,ef,er,xf=xf)
    if not BLOCKOUT:
        # Cyan stripe follows same fitted oblique plane as ear.
        q=matrix((s*1.055,-.375,.81),yaw=s*.60)
        stripe=rounded(.082,.35,.041,3)
        stripe_front=rounded(.068,.336,.034,3)
        a.loft('ear_cyan_strip_'+str(s),[(stripe,-.044),(stripe,-.051),(stripe_front,-.062)],'cyan',q)
# Hexagonal joined goggles, visible above separate eye display.
hexagon=[(-.24,.30),(.24,.30),(.40,0),(.24,-.30),(-.24,-.30),(-.40,0)]
# Rounded corner clips preserve six-sided identity while providing real edge
# transitions and a proper thick rim around the seated lens.
hexagon=[tuple(Vector(hexagon[i]).lerp(Vector(hexagon[(i+d)%6]),.085)) for i in range(6) for d in (-1,1)]
lens_ranges=[]
for s in (-1,1):
    xf=matrix((s*.425,-.985,1.145),pitch=-.14,yaw=s*.25)
    loops=[(.97,.17),(1,.125),(1,-.005),(.94,-.060),(.74,-.060),(.69,-.018),(.69,.15)]
    vv=[(x*sc,y,z*sc) for sc,y in loops for x,z in hexagon]
    nn=len(hexagon);ff=[(j*nn+i,j*nn+(i+1)%nn,((j+1)%len(loops))*nn+(i+1)%nn,((j+1)%len(loops))*nn+i) for j in range(len(loops)) for i in range(nn)]
    a.add('hexagonal_goggle_rim_'+str(s),vv,ff,'graphite',xf=xf)
    if True: # Solid lens volumes are part of the primary-form blockout.
        vv=[(x*.69*sc,y,z*.69*sc) for sc,y in [(1,-.017),(.72,-.062),(.32,-.083)] for x,z in hexagon]
        vv.append((0,-.090,0))
        ff=[tuple(range(nn-1,-1,-1))]
        for j in range(2):ff.extend((j*nn+i,j*nn+(i+1)%nn,(j+1)*nn+(i+1)%nn,(j+1)*nn+i) for i in range(nn))
        ff.extend((2*nn+i,2*nn+(i+1)%nn,3*nn) for i in range(nn))
        lens_ranges.append((len(a.v),len(vv),xf))
        a.add('inset_teal_lens_'+str(s),vv,ff,'lens',True,True,xf)
a.box('connected_goggle_bridge',(0,-1.00,1.15),(.19,.22,.18),'graphite',.028,2)
if not BLOCKOUT:
    for s in (-1,1):
        outline=rounded(.12,.305,.06,3);nn=len(outline)
        vv=[]
        for offset in (-.010,-.025):
            for x,z in outline:
                x+=s*.23;z+=.565;vv.append((x,display_depth(x,z)+offset,z))
        ff=[tuple(range(nn-1,-1,-1)),tuple(nn+i for i in range(nn))]
        ff.extend((i,(i+1)%nn,nn+(i+1)%nn,nn+i) for i in range(nn))
        a.add('curved_display_eye_'+str(s),vv,ff,'cyan',True,True)

output=os.environ.get('ASSET_BUILD_DIR',str(HERE))
source_name=os.environ.get('ASSET_SOURCE_NAME','copilot_tester_v01.blend')
a.finish(output,source_name)
mesh=bpy.data.objects['tester_model'].data
# Use the second material's restrained optical response on the curved display.
# Surface normals follow the authored convex glass instead of radial fan faces.
for poly in mesh.polygons:
    if abs(mesh.uv_layers.active.data[poly.loop_start].uv.x-18/32)<.001:
        poly.material_index=1
normals=[tuple(n.vector) for n in mesh.corner_normals]
body_start,body_count=next((start,count) for name,start,count in a.parts if name=='landmark_shell_lip_and_display')
for loop in mesh.loops:
    vi=loop.vertex_index
    if body_start<=vi<body_start+body_count:
        x,y,z=a.v[vi]
        if y<=front_depth(x,z)+.025:
            normals[loop.index]=tuple(Vector((.58*x/(.98*.98),-1,.40*(z-.83)/(.83*.83))).normalized())
    for start,count,xf in lens_ranges:
        if start<=vi<start+count:
            p=xf.inverted()@Vector(a.v[vi])
            normals[loop.index]=tuple((xf.to_3x3()@Vector((p.x*.95,-1,p.z*1.45))).normalized())
mesh.normals_split_custom_set(normals)
# Matte housing, gently polished opaque optics. Keep deliberate planar facets.
bs=bpy.data.materials['tester_palette'].node_tree.nodes.get('Principled BSDF')
bs.inputs['Roughness'].default_value=.64
bs.inputs['Specular IOR Level'].default_value=.22
bs=bpy.data.materials['tester_optics'].node_tree.nodes.get('Principled BSDF')
bs.inputs['Roughness'].default_value=.35
bs.inputs['Emission Strength'].default_value=.04
bpy.data.objects['root']['design']='Boundary Watcher concept04; continuous guards; traced compact shell; model only'
bpy.data.objects['anchor_action'].location=(0,-.85,.55)
bpy.data.objects['anchor_aura'].location=(0,0,.72)
bpy.ops.wm.save_as_mainfile(filepath=str(Path(output)/source_name))
mesh.calc_loop_triangles()
print('TESTER_TRIANGLES',len(mesh.loop_triangles),'BLOCKOUT',BLOCKOUT)
