import bpy,math,os,json,sys
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
# Reuse the resolved r7 body recipe only, preserving broad source volume.
body=(HERE/'body-r7.py').read_text().split('# Whole ivory brow-rim')[0]
sys.path.insert(0,str(HERE))
body=body.replace('from persona_quality import Maker,matrix,rounded','from persona_quality import matrix,rounded\nfrom analyst_palette import AnalystMaker as Maker')
body=body.replace("inner=[(0,1.28),(.35,1.285),(.65,1.22),(.84,1.08),(.94,.89)","inner=[(0,1.39),(.35,1.385),(.65,1.31),(.84,1.17),(.94,.96)")
body=body.replace("(-.94,.89),(-.84,1.08),(-.65,1.22),(-.35,1.285)","(-.94,.96),(-.84,1.17),(-.65,1.31),(-.35,1.385)")
body=body.replace("[(.55,-.024),(1,.015)]","[(.60,-.024),(.80,-.025),(1,.015)]")
body=body.replace("roles.append('shell')\n    prev=start","roles.append('trim' if t==1 else 'shell')\n    prev=start")
body=body.replace('z-.68','z-.76').replace('+.68','+.76').replace('front(0,.68)','front(0,.76)').replace(',.68))',',.76))')
# A convex vertical display profile rolls back into the brow and chin instead
# of reading as a tall flat plate. The lip and eyes share the same surface.
body=body.replace("def front(x,z):return -.94+.26*(x/1.105)**2+.22*((z-.82)/.90)**2", "def front(x,z):return -.94+.26*(x/1.105)**2+.60*((z-.72)/.90)**2")
body=body.replace('for scale in (.73,.44,.18):','for scale in (.90,.73,.44,.18):')
exec(compile(body,str(HERE/'body-r7.py'),'exec'),globals())
# Cut and close the old dome at a coherent fitted seat. Compressing its old
# sections makes a crimped edge; a geometric cut preserves a clean shell join.
bm=bmesh.new();tag=bm.faces.layers.int.new('palette_role')
body_roles=['shell','trim','screen']
verts=[bm.verts.new(p)for p in a.v]
for face,role in zip(a.f,a.r):
    q=bm.faces.new([verts[i]for i in face]);q[tag]=body_roles.index(role);q.smooth=True
result=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.000001,plane_co=(0,0,1.14),plane_no=(0,.05,1),clear_outer=True,clear_inner=False)
cut_edges=[e for e in result['geom_cut']if isinstance(e,bmesh.types.BMEdge) and e.is_boundary]
seat_segments=[[(v.co.x,v.co.y-.03)for v in e.verts]for e in cut_edges]
if cut_edges:
    for q in bmesh.ops.holes_fill(bm,edges=cut_edges,sides=0)['faces']:q[tag]=0;q.smooth=False
bm.verts.index_update();bm.faces.index_update()
a.v=[tuple(v.co)for v in bm.verts];a.f=[tuple(v.index for v in q.verts)for q in bm.faces]
a.r=[body_roles[q[tag]]for q in bm.faces];a.s=[q.smooth for q in bm.faces];a.mi=[0]*len(a.f)
a.parts=[('convex_shell_and_display',0,len(a.v))];bm.free()
for s in (-1,1):
    axis='right' if s>0 else 'left'
    xf=matrix((s*1.10,-.05,.85),axis)
    oval=[(.25*math.cos(math.tau*i/12),.43*math.sin(math.tau*i/12))for i in range(12)]
    a.loft('retained_ear_drum_'+str(s),[(oval,.06),(oval,-.10),([(x*.93,z*.94)for x,z in oval],-.18)],'shell_dark',xf)
    cap=[(.205*math.cos(math.tau*i/12),.325*math.sin(math.tau*i/12))for i in range(12)]
    a.loft('retained_chalk_ear_cap_'+str(s),[(cap,-.18),([(x*.90,z*.91)for x,z in cap],-.245),([(x*.40,z*.50)for x,z in cap],-.31)],'trim',xf)
    eye=rounded(.135,.34,.0675,3);nn=len(eye);vv=[]
    for offset in (0,-.022):
        for x,z in eye:
            x+=s*.29;z+=.76;vv.append((x,front(x,z)+offset,z))
    ff=[tuple(range(nn-1,-1,-1)),tuple(nn+i for i in range(nn))]+[(i,(i+1)%nn,nn+(i+1)%nn,nn+i)for i in range(nn)]
    a.add('display_eye_'+str(s),vv,ff,'cyan',True,True)
# Fitted cap: shared surface boundaries for panel colours and narrow centre seam.
angles=sorted(set([math.tau*i/32 for i in range(32)]+[math.pi/2-.025,math.pi/2+.025,3*math.pi/2-.025,3*math.pi/2+.025]))
cn=len(angles);cv=[];cf=[];cr=[]
levels=[(1,0),(.985,.16),(.87,.34),(.68,.51),(.42,.64),(.15,.71)]
for scale,lift in levels:
    for t in angles:cv.append((1.105*scale*math.cos(t),.03+.90*scale*math.sin(t),1.28-.045*scale*math.sin(t)+lift))
for j in range(len(levels)-1):
    for i,t in enumerate(angles):
        nxt=(i+1)%cn;nt=angles[nxt] if nxt else math.tau;mid=(t+nt)*.5
        cf.append((j*cn+i,j*cn+nxt,(j+1)*cn+nxt,(j+1)*cn+i))
        cr.append('detail' if abs(math.cos(mid))<.027 else 'trim' if math.cos(mid)>0 else 'hat')
pole=len(cv);cv.append((0,.03,2.01))
for i,t in enumerate(angles):
    nxt=(i+1)%cn;cf.append((5*cn+i,5*cn+nxt,pole));cr.append(cr[4*cn+i])
# Continuous shallow seating band closes the lower edge and covers the body seat.
band_start=len(cv)
def seat_radius(t):
    dx,dy=math.cos(t),math.sin(t);hits=[]
    for (ax,ay),(bx,by) in seat_segments:
        ex,ey=bx-ax,by-ay;den=dx*ey-dy*ex
        if abs(den)<1e-9:continue
        radius=(ax*ey-ay*ex)/den;u=(ax*dy-ay*dx)/den
        if radius>0 and -.00001<=u<=1.00001:hits.append(radius)
    return max(hits)
for scale in (1.10,.965):
    for t in angles:
        radius=seat_radius(t)*scale;x=radius*math.cos(t);y=.03+radius*math.sin(t)
        cv.append((x,y,1.14-.05*y-.020))
for i in range(cn):
    nxt=(i+1)%cn
    cf.append((i,nxt,band_start+nxt,band_start+i));cr.append('hat')
    cf.append((band_start+i,band_start+nxt,band_start+cn+nxt,band_start+cn+i));cr.append('hat')
cf.append(tuple(band_start+cn+i for i in range(cn-1,-1,-1)));cr.append('hat')
a.add('session_cap_panel_crown',cv,cf,cr,True)
# Curved brim with closed edges, real thickness and coherent top/underside.
bv=[];bf=[];br=[];bn=25
for depth in (0,-.045):
    for blend in (0,.5,1):
        for i in range(bn):
            t=-math.pi/2+math.pi*i/(bn-1)
            ix=1.10*math.sin(t);iy=.03-.90*math.cos(t);iz=1.28+.045*math.cos(t)
            ox=1.115*math.sin(t);oy=-.10-1.17*math.cos(t);oz=1.295-.095*math.cos(t)
            bv.append((ix+(ox-ix)*blend,iy+(oy-iy)*blend,iz+(oz-iz)*blend+depth))
for side in range(2):
    for j in range(2):
        for i in range(bn-1):
            o=side*3*bn+j*bn+i;bf.append((o,o+1,o+bn+1,o+bn));br.append('hat' if side==0 else 'detail')
for j in (0,2):
    for i in range(bn-1):
        o=j*bn+i;bf.append((o,o+1,o+1+3*bn,o+3*bn));br.append('detail' if j==0 else 'hat')
for i in (0,bn-1):
    for j in range(2):
        o=j*bn+i;bf.append((o,o+bn,o+bn+3*bn,o+3*bn));br.append('hat')
a.add('session_cap_rounded_brim',bv,bf,br,True)
a.disc('cap_top_button',(0,.03,2.012),.035,.022,'hat',axis='top',n=8)
# Positive Blender X is wearer-left/viewer-right in the registered front view.
pc=Vector((1.065,-.30,1.48));direction=Vector((.10,.04,1)).normalized()
def pencil_segment(name,z0,z1,r0,r1,role):
    start=pc+direction*z0;end=pc+direction*z1
    bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=r0,radius2=r1,depth=(end-start).length,location=(start+end)/2)
    o=bpy.context.object;o.rotation_euler=Vector((0,0,1)).rotation_difference(direction).to_euler();a.collect(o,name,role)
pencil_segment('pencil_yellow_shaft',-.19,.29,.043,.043,'pencil')
pencil_segment('pencil_wood_tip',.29,.375,.043,.015,'wood')
pencil_segment('pencil_graphite_point',.375,.40,.015,0,'graphite')
a.box('cap_pencil_holder',(1.038,-.30,1.475),(.18,.12,.105),'hat',.014,1)
output=os.environ.get('ASSET_BUILD_DIR',str(HERE));source=os.environ.get('ASSET_SOURCE_NAME','copilot_analyst_v01.blend')
a.finish(output,source)
mesh=bpy.data.objects['analyst_model'].data
normals=[tuple(n.vector)for n in mesh.corner_normals]
body_start,body_count=next((start,count)for name,start,count in a.parts if name=='convex_shell_and_display')
for loop in mesh.loops:
    vi=loop.vertex_index;x,y,z=a.v[vi]
    if body_start<=vi<body_start+body_count and y<=front(x,z)+.02:
        normals[loop.index]=tuple(Vector((.52*x/(1.105**2),-1,1.20*(z-.72)/(.90**2))).normalized())
mesh.normals_split_custom_set(normals)
bpy.data.objects['root']['design']='Requirements Analyst — selected Session Cap06 with small wearer-left pencil; model only'
bpy.data.materials['analyst_palette'].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.58
bpy.data.materials['analyst_optics'].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.45
bpy.ops.wm.save_as_mainfile(filepath=str(Path(output)/source))
