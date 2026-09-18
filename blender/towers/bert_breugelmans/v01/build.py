"""Bert Breugelmans: bespoke Cohesion Pack character. Shared pipeline owns export."""
import bpy, bmesh, math, json, os
from pathlib import Path
from mathutils import Vector, Quaternion

OUT=Path(os.environ['ASSET_BUILD_DIR'])
M=json.loads(Path(os.environ['ASSET_MANIFEST']).read_text(encoding='utf-8-sig'))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=1; scene.render.fps=24
verts=[];faces=[];roles=[];weights=[];smooth=[];parts=[]

def mesh(name,vs,fs,role,bone='body',soft=False,face_roles=None,ws=None):
    start=len(verts);verts.extend(vs);weights.extend(ws or [{bone:1} for v in vs])
    faces.extend([tuple(start+i for i in f) for f in fs]);roles.extend(face_roles or [role]*len(fs));smooth.extend([soft]*len(fs))
    parts.append({'name':name,'start':start,'count':len(vs)})

def collect(o,name,role,bone,soft=False):
    bpy.context.view_layer.update()
    mesh(name,[tuple(o.matrix_world@v.co) for v in o.data.vertices],[tuple(p.vertices) for p in o.data.polygons],role,bone,soft)
    bpy.data.objects.remove(o,do_unlink=True)

def box(name,c,size,role,bone='body',bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=c);o=bpy.context.object;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('edge_chamfer','BEVEL');m.width=bevel;m.segments=1;bpy.ops.object.modifier_apply(modifier=m.name)
    collect(o,name,role,bone)

def ellipsoid(name,c,r,role,bone='head',n=10,rings=5,soft=True):
    vs=[(c[0],c[1],c[2]-r[2])]
    for j in range(1,rings):
        p=-math.pi/2+math.pi*j/rings
        for i in range(n):
            t=math.tau*i/n;vs.append((c[0]+r[0]*math.cos(p)*math.cos(t),c[1]+r[1]*math.cos(p)*math.sin(t),c[2]+r[2]*math.sin(p)))
    vs.append((c[0],c[1],c[2]+r[2]));fs=[]
    for i in range(n):fs.append((0,1+(i+1)%n,1+i))
    for j in range(rings-2):
        for i in range(n):
            a=1+j*n+i;b=1+j*n+(i+1)%n;fs.append((a,b,b+n,a+n))
    for i in range(n):fs.append((len(vs)-1,1+(rings-2)*n+i,1+(rings-2)*n+(i+1)%n))
    mesh(name,vs,fs,role,bone,soft)

def loft(name,sections,role,bone='body',n=10,soft=True):
    vs=[]
    for x,y,z,rx,ry in sections:
        for i in range(n):
            a=math.tau*i/n;vs.append((x+rx*math.cos(a),y+ry*math.sin(a),z))
    fs=[tuple(reversed(range(n)))]
    for j in range(len(sections)-1):
        for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    fs.append(tuple((len(sections)-1)*n+i for i in range(n)))
    mesh(name,vs,fs,role,bone,soft)

def prism(name,profile,front,back,role,bone='body'):
    n=len(profile);vs=[(x,y,z) for y in (front,back) for x,z in profile]
    fs=[tuple(range(n)),tuple(reversed(range(n,n*2)))];fs.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n))
    mesh(name,vs,fs,role,bone)

def tube(name,path,radii,role,bone='head',n=6,soft=True,ws=None):
    path=[Vector(p) for p in path];vs=[]
    for j,c in enumerate(path):
        tangent=(path[min(j+1,len(path)-1)]-path[max(0,j-1)]).normalized()
        axis=Vector((0,1,0));u=tangent.cross(axis).normalized()
        if u.length<.1:u=tangent.cross(Vector((1,0,0))).normalized()
        v=tangent.cross(u).normalized();r=radii[j]
        if isinstance(r,(float,int)):r=(r,r)
        for i in range(n):
            a=math.tau*i/n;vs.append(tuple(c+u*r[0]*math.cos(a)+v*r[1]*math.sin(a)))
    fs=[tuple(reversed(range(n)))]
    for j in range(len(path)-1):
        for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    fs.append(tuple((len(path)-1)*n+i for i in range(n)))
    mesh(name,vs,fs,role,bone,soft,ws=[w for w in ws for i in range(n)] if ws else None)

root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
root['asset']='bert_breugelmans_v01';root['forward']='+Z glTF / -Y Blender'
bones={'base':((0,0,0),None),'pelvis':((0,0,1.34),'base'),'body':((0,0,1.35),'pelvis'),'head':((0,0,2.18),'body')}
leg_rest={}

# Tailored trouser legs and separate properly grounded shoes.
for s,side in [(-1,'l'),(1,'r')]:
    x=s*.255
    hip=Vector((s*.23,0,1.34));knee=Vector((s*.245,-.025,.77));ankle=Vector((x,.035,.21))
    leg_rest[side]=(hip,knee,ankle)
    bones['thigh_'+side]=(tuple(hip),'pelvis');bones['shin_'+side]=(tuple(knee),'thigh_'+side);bones['foot_'+side]=(tuple(ankle),'shin_'+side)
    outline=[(-.15,.16),(.15,.16),(.18,.04),(.185,-.22),(.13,-.36),(-.10,-.38),(-.18,-.27),(-.18,-.02)]
    vs=[(x+u*.88,.035+(v-.035)*.80,z) for z in (0,.050) for u,v in outline];n=len(outline)
    fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh('leather_sole_'+side,vs,fs,'sole','foot_'+side)
    vs=[]
    for k in range(3):
        for i,(u,v) in enumerate(outline):
            if k==2:
                a=math.radians(135)-math.tau*i/n
                vs.append((x+.150*math.cos(a),.155*math.sin(a),.265))
            else:vs.append((x+u*[.96*.88,.93*.88][k],.035+(v-.035)*.80,[.045,.130][k]+(.018*(v+.38) if k==1 else 0)))
    fs=[tuple(reversed(range(n)))]
    for k in range(2):
        for i in range(n):fs.append((k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i))
    fs.append(tuple(2*n+i for i in range(n)))
    shoe_ws=[{'foot_'+side:1} for _ in range(2*n)]+[{'shin_'+side:1} for _ in range(n)]
    mesh('leather_upper_'+side,vs,fs,'shoe','foot_'+side,True,ws=shoe_ws)
    leg_start=len(verts)
    loft('trousers_'+side,[(x,0,.19,.142,.145),(x,0,.32,.148,.151),(s*.235,0,.77,.157,.155),(s*.23,0,1.22,.188,.19),(s*.205,0,1.40,.19,.205)],'pants','base',8)
    loft('cuff_'+side,[(x,0,.225,.151,.156),(x,0,.295,.155,.157)],'pants','base',8,False)
    for i in range(leg_start,len(verts)):
        z=verts[i][2];upper=max(0,min(1,(z-.64)/.26));pelvic=max(0,min(1,(z-1.20)/.20))
        weights[i]={name:value for name,value in {'shin_'+side:1-upper,'thigh_'+side:upper*(1-pelvic),'pelvis':upper*pelvic}.items() if value>0}
loft('hips',[(0,0,1.235,.12,.155),(0,0,1.35,.37,.205),(0,0,1.42,.39,.225)],'pants','pelvis',10)
loft('belt',[(0,0,1.345,.39,.231),(0,0,1.425,.391,.232)],'sole','body',12,False)
box('buckle',(0,-.238,1.385),(.115,.025,.067),'buckle',bevel=.009)
box('buckle_inset',(0,-.255,1.385),(.071,.009,.031),'sole')

# Continuous shirt shell with a genuine open V-shaped neckline.
n=12;vs=[]
for j,(z,rx,ry) in enumerate([(1.41,.392,.24),(1.57,.423,.27),(1.92,.438,.259),(2.055,.435,.23),(2.145,.19,.16)]):
    for i in range(n):
        a=math.tau*i/n;front=max(0,-math.sin(a))
        zz=z-(.18*front**6 if j==4 else 0)
        vs.append((rx*math.cos(a),ry*math.sin(a),zz))
fs=[tuple(reversed(range(n)))]
for j in range(4):
    for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
mesh('open_collar_shirt',vs,fs,'navy','body',True)
import importlib.util
neck_spec=importlib.util.spec_from_file_location('bert_neck',Path(__file__).with_name('neck.py'))
neck_module=importlib.util.module_from_spec(neck_spec);neck_spec.loader.exec_module(neck_module)
neck_vertices,neck_faces,neck_weights=neck_module.geometry()
mesh('fitted_neck_chest',neck_vertices,neck_faces,'skin','head',True,ws=neck_weights)
for s in (-1,1):
    # Thick folded fabric leaves follow the sloped shoulder rather than float in front.
    p=[(s*.018,-.168,1.978),(s*.164,-.095,2.164),(s*.282,-.174,2.075),(s*.185,-.257,1.945)]
    vs=p+[(x,y+.026,z-.012) for x,y,z in p]
    mesh('collar_leaf',vs,[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],'collar')
box('shirt_placket',(0,-.269,1.715),(.035,.018,.39),'collar',bevel=.008)
for z in (1.56,1.72,1.88):ellipsoid('shirt_button',(0,-.286,z),(.018,.012,.018),'buckle','body',6,3)

# Five physically tapered tiers, with narrow reveals and a supported amber apex.
pack_start=len(verts)
def pack_fit(point):
    # 10% smaller about the base; lean the apex 8 degrees away from the head.
    x,y,z=point;scale=.90;tilt=math.radians(8)
    dy=(y-.43)*scale;dz=(z-1.64)*scale
    return (x*scale,.43+dy*math.cos(tilt)+dz*math.sin(tilt),1.64-dy*math.sin(tilt)+dz*math.cos(tilt))
def tier(name,z0,z1,w0,w1,d0,d1,role):
    y=.43;vs=[]
    # Clipped rectangle corners are shared boundaries around each solid tier.
    for z,w,d in [(z0,w0,d0),(z0+.025,w0+.01,d0+.01),(z1-.025,w1+.01,d1+.01),(z1,w1,d1)]:
        cut=.035
        vs.extend([(x,y+v,z) for x,v in [(-w+cut,-d),(w-cut,-d),(w,-d+cut),(w,d-cut),(w-cut,d),(-w+cut,d),(-w,d-cut),(-w,-d+cut)]])
    fs=[tuple(reversed(range(8)))]
    for j in range(3):
        for i in range(8):fs.append((j*8+i,j*8+(i+1)%8,(j+1)*8+(i+1)%8,(j+1)*8+i))
    fs.append(tuple(24+i for i in range(8)));mesh(name,vs,fs,role,'body')
tier('01_trust',1.64,2.16,.62,.53,.28,.245,'trust_green')
tier('02_constructive_conflict',2.18,2.49,.48,.389,.228,.197,'conflict_blue')
tier('03_commitment',2.51,2.79,.352,.274,.182,.147,'commitment_yellow')
tier('04_accountability',2.81,3.06,.24,.158,.129,.086,'accountability_gray')
# Apex wedge is closed, seated on the fourth tier, visibly triangular in every turnaround.
loft('05_shared_results',[(0,.43,3.08,.145,.092),(0,.43,3.34,.006,.006)],'results_orange','body',4,False)
# Flat, opaque lettering seated on the broad outward/back panel of the base.
# Each glyph is an actual cut outline, not a collection of overlapping bars.
glyphs={
 'T':[[(0,1),(.8,1),(.8,.8),(.5,.8),(.5,0),(.3,0),(.3,.8),(0,.8)]],
 'R':[[(0,0),(.2,0),(.2,.43),(.2,.6),(.2,.8),(.2,1),(0,1)],[(.2,1),(.64,1),(.8,.86),(.8,.55),(.58,.43),(.2,.43),(.2,.6),(.6,.6),(.6,.8),(.2,.8)],[(.37,.43),(.58,.43),(.85,0),(.64,0)]],
 'U':[[(0,1),(.2,1),(.2,.24),(.28,.18),(.52,.18),(.6,.24),(.6,1),(.8,1),(.8,.16),(.64,0),(.16,0),(0,.16)]],
 'S':[[ (.8,1),(0,1),(0,.4),(.6,.4),(.6,.2),(0,.2),(0,0),(.8,0),(.8,.6),(.2,.6),(.2,.8),(.8,.8)]]
}
for j,letter in enumerate('TRUST'):
    for outline in glyphs[letter]:
        points=[]
        for x,z in outline:
            z=1.805+z*.20
            # Back-view screen right is Blender -X. Follow the panel slope.
            points.append((.377-(j*.98+x)*.16,.43+.29-(z-1.665)*(.035/.47)+.0015,z))
        mesh('trust_label_'+str(j),points,[tuple(range(len(points)))],'label_ink','body')
for i in range(pack_start,len(verts)):verts[i]=pack_fit(verts[i])
# Continuous fitted straps retain the green-tier anchors and clear the arm route.
import importlib.util
strap_spec=importlib.util.spec_from_file_location('bert_straps',Path(__file__).with_name('straps.py'))
strap_module=importlib.util.module_from_spec(strap_spec);strap_spec.loader.exec_module(strap_module)
for s in (-1,1):
    vs,fs=strap_module.geometry(s);mesh('shoulder_strap',vs,fs,'teal')

# Broad mature head, integrated side/back hair cap and bold readable face.
loft('face',[(0,-.023,2.185,.15,.14),(0,-.035,2.245,.235,.20),(0,-.034,2.39,.30,.247),(0,-.024,2.62,.304,.244),(0,-.006,2.77,.251,.21),(0,.012,2.83,.12,.105)],'skin','head',16)
for s in (-1,1):
    # Continuous pinna: seated back, rolled helix rim, recessed concha and lobe.
    # The inner ear is a hollowed surface, not a second protruding ellipsoid.
    c=Vector((s*.329,-.033,2.485));normal=Vector((s*.80,-.60,0));across=Vector((s*.60,.80,0))
    vs=[];fs=[];rr=[];n=10
    for size,depth in [(.78,-.026),(1,.004),(.65,.027),(.40,.007)]:
        for i in range(n):
            a=math.tau*i/n;sy=math.sin(a);width=.056*(.86 if sy<0 else 1)
            p=c+across*(width*size*math.cos(a))+Vector((0,0,.090*size*sy))+normal*depth
            vs.append(tuple(p))
    for j in range(3):
        for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i));rr.append('skin')
    vs.extend([tuple(c-normal*.033),tuple(c+Vector((0,0,-.009)))])
    for i in range(n):
        fs.append((40,(i+1)%n,i));rr.append('skin')
        fs.append((41,30+i,30+(i+1)%n));rr.append('skin_shadow')
    mesh('sculpted_ear_'+str(s),vs,fs,'skin','head',True,rr)
    ellipsoid('eye_white',(s*.123,-.264,2.56),(.061,.021,.045),'white','head',10,4)
    ellipsoid('iris',(s*.119,-.286,2.558),(.027,.012,.036),'eye','head',8,4)
    ellipsoid('catchlight',(s*.119-.007,-.299,2.57),(.009,.004,.010),'white','head',6,3)
    tube('expressive_brow',[(s*.059,-.268,2.655),(s*.111,-.274,2.673),(s*.169,-.254,2.664),(s*.191,-.236,2.651)],[.018,.024,.022,.012],'beard',n=5)
# One continuous nose surface: recessed root, tapered bridge, soft rounded tip
# and underside. The back of the shell is seated within the face.
loft('continuous_nose',[(0,-.278,2.423,.035,.025),(0,-.301,2.44,.064,.044),(0,-.305,2.469,.072,.060),(0,-.292,2.495,.059,.057),(0,-.268,2.545,.038,.050),(0,-.251,2.590,.030,.028),(0,-.238,2.620,.023,.019)],'skin','head',12)
prism('smile',[(-.104,2.352),(-.06,2.316),(0,2.308),(.06,2.316),(.104,2.352),(.055,2.337),(-.055,2.337)],-.284,-.264,'beard','head')
prism('smile_teeth',[(-.072,2.341),(0,2.323),(.072,2.341),(.038,2.342),(-.038,2.342)],-.292,-.283,'white','head')
# Single continuous moustache on each side, with curled tips and no crossed rods.
for s in (-1,1):
    tube('handlebar_moustache',[(s*.015,-.299,2.412),(s*.072,-.306,2.400),(s*.142,-.287,2.379),(s*.204,-.251,2.391),(s*.232,-.225,2.438),(s*.221,-.229,2.463)],[.037,.049,.043,.029,.022,.006],'beard',n=7)
loft('pointed_goatee',[(0,-.202,2.171,.018,.013),(0,-.237,2.235,.082,.044),(0,-.248,2.300,.09,.035)],'beard','head',7)
prism('goatee_silver', [(-.017,2.276),(0,2.199),(.023,2.278)],-.286,-.27,'hair','head')
# Reference-led cropped sides, exposed forehead and a swept-back silver top.
# The cropped side shell seats a continuous combed top.
n=24;rings=5;vs=[]
for j in range(rings):
    for i in range(n):
        a=math.tau*i/n;front=max(0,-math.sin(a))
        b=min(1,front/.76);b=b*b*(3-2*b)
        if j==0:z=2.47+.30*b;rx=.325;ry=.292-.037*b
        elif j==1:z=2.695+.10*b;rx=.319;ry=.278-.043*b
        elif j==2:z=2.815;rx=.255;ry=.215
        elif j==3:z=2.863;rx=.16;ry=.14
        else:z=2.88;rx=.045;ry=.045
        vs.append((rx*math.cos(a),.02+ry*math.sin(a),z))
fs=[]
for j in range(rings-1):
    for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
fs.extend([tuple(reversed(range(n))),tuple((rings-1)*n+i for i in range(n))])
mesh('cropped_silver_sides',vs,fs,'hair','head',True)
# Shared vertices form shallow comb channels across one swept volume. The
# side-part travels back with the flow; perimeter and underside sit in the cap.
rows=[(-.245,.18,2.800,2.775),(-.217,.21,2.900,2.780),(-.15,.235,2.965,2.790),(-.06,.25,2.986,2.80),(.035,.248,2.960,2.80),(.12,.24,2.903,2.77),(.19,.21,2.835,2.72),(.235,.17,2.755,2.65),(.26,.09,2.675,2.61)]
vs=[];fs=[];cols=25
for j,(y,width,crest,edge) in enumerate(rows):
    flow=j/(len(rows)-1);shift=.032*math.sin(math.pi*flow)
    for i in range(cols):
        u=-1+2*i/(cols-1);x=width*u+shift
        mask=max(0,1-u*u);ramp=math.sin(math.pi*flow)**.5
        z=edge+(crest-edge)*mask**.65
        z+=.008*mask*ramp*math.cos(math.pi*6*u+.8*flow)
        z-=.024*mask*ramp*math.exp(-((u+.62)/.075)**2)
        z+=.013*mask*ramp*u
        vs.append((x,y+.035*u*u*(1-flow),z))
for j in range(len(rows)-1):
    for i in range(cols-1):
        a=j*cols+i;fs.append((a,a+1,a+1+cols,a+cols))
rim=list(range(cols))+[j*cols+cols-1 for j in range(1,len(rows))]+list(range((len(rows)-1)*cols+cols-2,(len(rows)-1)*cols-1,-1))+[j*cols for j in range(len(rows)-2,0,-1)]
bottom=[]
for index in rim:
    x,y,z=vs[index];bottom.append(len(vs));vs.append((x*.97,y,z-.035))
for i in range(len(rim)):
    k=(i+1)%len(rim);fs.append((rim[i],bottom[i],bottom[k],rim[k]))
fs.append(tuple(reversed(bottom)))
mesh('continuous_swept_top',vs,fs,'hair_light','head',True)

hand_rest_q={}
def hand_point(side,s,w,p):return Vector(w)+hand_rest_q[side]@(Vector(p)-Vector((s*.383,-.325,1.689)))
import importlib.util
hand_spec=importlib.util.spec_from_file_location('bert_hands',Path(__file__).with_name('hands.py'))
hand_module=importlib.util.module_from_spec(hand_spec);hand_spec.loader.exec_module(hand_module)
def sculpt_hand(side,s,w):
    vs,fs,ws=hand_module.geometry(side,s,w)
    mesh('connected_hand_'+side,vs,fs,'skin','hand_'+side,True,ws=ws)
# Connected sleeves, seated cuffs, continuous palms and articulated digits.
rest={}
for s,side in [(-1,'l'),(1,'r')]:
    a=Vector((s*.435,0,2.055));e=Vector((s*.605,-.020,1.745));w=Vector((s*.580,-.240,1.50));rest[side]=(a,e,w)
    # Neutral wrists: fingers follow the forearm down/forward, palms face inward.
    # This avoids the previous opposing wrist rolls and outward/upturned palms.
    hand_rest_q[side]=Quaternion((1,0,0),2.58)@Quaternion((0,0,1),-s*math.pi/2)
    bones['upper_'+side]=(tuple(a),'body');bones['fore_'+side]=(tuple(e),'upper_'+side);bones['hand_'+side]=(tuple(w),'fore_'+side)
    hand_pivots=hand_module.pivots(side,s,w)
    bones['fingers_'+side]=(hand_pivots['fingers_'+side],'hand_'+side)
    bones['digits_'+side]=(hand_pivots['digits_'+side],'fingers_'+side)
    bones['thumb_'+side]=(hand_pivots['thumb_'+side],'hand_'+side)
    un='upper_'+side;fn='fore_'+side;hn='hand_'+side
    path=[a+(e-a)*-.24,a+(e-a)*.15,a+(e-a)*.78,e,e+(w-e)*.30,e+(w-e)*.83,w]
    ws=[{'body':.9,un:.1},{'body':.55,un:.45},{un:.85,fn:.15},{un:.5,fn:.5},{un:.12,fn:.88},{fn:1},{fn:1}]
    tube('continuous_sleeve_'+side,path,[.080,.168,.141,.135,.117,.088,.077],'navy',un,n=10,ws=ws)
    direction=(w-e).normalized()
    tube('cuff_'+side,[w-direction*.041,w+direction*.007],[.090,.081],'collar',fn,n=10)
    sculpt_hand(side,s,w)

data=bpy.data.meshes.new('bert_mesh');data.from_pydata(verts,[],faces);data.update()
bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
obj=bpy.data.objects.new('bert_character',data);scene.collection.objects.link(obj);obj['part_ranges']=json.dumps(parts)
for name in bones:
    g=obj.vertex_groups.new(name=name)
    for i,w in enumerate(weights):
        if name in w:g.add([i],w[name],'REPLACE')
def linear(h):
    cs=[int(h.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in cs)+(1,)
colors={k:linear(v) for k,v in M['palette']['colors'].items()};ids={k:i+1 for i,k in enumerate(colors)}
data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER');data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
for p,r,soft in zip(data.polygons,roles,smooth):
    p.use_smooth=soft
    for li in p.loop_indices:data.color_attributes['Color'].data[li].color=colors[r];data.attributes['_palette_role'].data[li].value=ids[r]
for name,rough in [('bert_clothing',.84),('bert_skin',.76),('bert_hair',.87),('cohesion_pack',.65)]:
    mat=bpy.data.materials.new(name);mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=rough
    attr=mat.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='Color';mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color']);data.materials.append(mat)
for p,r in zip(data.polygons,roles):p.material_index=3 if r in ('teal','trust_green','conflict_blue','commitment_yellow','accountability_gray','results_orange','label_ink') else 2 if r in ('hair','hair_light','hair_dark','beard','beard_light') else 1 if r.startswith('skin') or r in ('white','eye') else 0
arm=bpy.data.armatures.new('bert_skeleton');rig=bpy.data.objects.new('bert_rig',arm);scene.collection.objects.link(rig);rig.parent=root
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,(pivot,parent) in bones.items():
    b=arm.edit_bones.new(name);b.head=pivot;b.tail=Vector(pivot)+Vector((0,.12,0))
    if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');obj.parent=rig;mod=obj.modifiers.new('skin','ARMATURE');mod.object=rig
for name,p in [('anchor_ui',(0,0,3.33)),('anchor_action',(0,-.60,1.85)),('anchor_target',(0,0,1.8))]:
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=root;o.location=p

def reset():
    for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
def turn(name,axis,angle):rig.pose.bones[name].rotation_quaternion=Quaternion(axis,angle)
def arm_pose(side,target,hand_q=None,blend=1,pole_hint=None):
    # Analytic two-bone IK retains forearm/upper-arm lengths and the connected elbow.
    a,e,w=rest[side];s=-1 if side=='l' else 1;target=Vector(target);d=target-a;L=d.length;u=d.normalized();l1=(e-a).length;l2=(w-e).length
    L=min(L,l1+l2-.001);target=a+u*L;x=(l1*l1-l2*l2+L*L)/(2*L);h=math.sqrt(max(0,l1*l1-x*x))
    rest_axis=(w-a).normalized();pole=(e-a)-rest_axis*(e-a).dot(rest_axis)
    if pole_hint is not None:pole=pole.normalized().lerp(Vector(pole_hint).normalized(),blend)
    pole=(pole-u*pole.dot(u)).normalized();enew=a+u*x+pole*h
    q1=(e-a).rotation_difference(enew-a);q2=(w-e).rotation_difference(target-enew)
    rig.pose.bones['upper_'+side].rotation_quaternion=q1;rig.pose.bones['fore_'+side].rotation_quaternion=q1.inverted()@q2
    q0=hand_rest_q[side];delta=q0.slerp(hand_q or q0,blend)@q0.inverted()
    rig.pose.bones['hand_'+side].rotation_quaternion=q2.inverted()@delta
def digit_pose(side,proximal,distal,thumb):
    q=hand_rest_q[side]
    turn('fingers_'+side,q@Vector((1,0,0)),proximal)
    turn('digits_'+side,q@Vector((1,0,0)),distal)
    turn('thumb_'+side,q@Vector((0,1,0)),thumb)
def mix(a,b,t):return Vector(a).lerp(Vector(b),t)
def ease(t):return .5-.5*math.cos(math.pi*max(0,min(1,t)))
for clip,length in [('idle',60)]:
    rig.animation_data_create();action=bpy.data.actions.new(clip);rig.animation_data.action=action
    for frame in range(1,length+2):
        reset();t=(frame-1)/length;p=math.sin(math.tau*t)
        turn('body',(1,0,0),.009*math.sin(math.tau*t));turn('head',(0,0,1),.014*p)
        # Endpoints match the neutral, inward-facing hand pose.
        for pb in rig.pose.bones:
            for prop in ('location','rotation_quaternion','scale'):pb.keyframe_insert(data_path=prop,frame=frame-1 if clip=='move' else frame,group=pb.name)
    action.use_fake_user=True;track=rig.animation_data.nla_tracks.new();track.name=clip;strip=track.strips.new(clip,0 if clip=='move' else 1,action);strip.name=clip;track.mute=True
import importlib.util
proportion_spec=importlib.util.spec_from_file_location('bert_proportions',Path(__file__).with_name('proportions.py'))
proportion_module=importlib.util.module_from_spec(proportion_spec);proportion_spec.loader.exec_module(proportion_module)
proportion_module.apply(rig)
move_spec=importlib.util.spec_from_file_location('bert_move',Path(__file__).with_name('move.py'))
move_module=importlib.util.module_from_spec(move_spec);move_spec.loader.exec_module(move_module)
move_module.author(rig)
celebrate_spec=importlib.util.spec_from_file_location('bert_celebrate',Path(__file__).with_name('celebrate.py'))
celebrate_module=importlib.util.module_from_spec(celebrate_spec);celebrate_spec.loader.exec_module(celebrate_module)
celebrate_module.author(rig)
work_spec=importlib.util.spec_from_file_location('bert_work',Path(__file__).with_name('work.py'))
work_module=importlib.util.module_from_spec(work_spec);work_spec.loader.exec_module(work_module)
work_module.author(rig)
rig.animation_data.action=None;reset();scene.frame_set(1);scene.frame_end=120
data.calc_loop_triangles();print('BERT_STATS',json.dumps({'triangles':len(data.loop_triangles),'bones':len(arm.bones)}))
assert len(data.loop_triangles)<=M['budgets']['triangles'],len(data.loop_triangles)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
for part in list(bpy.context.selected_objects):
    if part.type!='MESH':continue
    used=part.data.materials[part.data.polygons[0].material_index];part.data.materials.clear();part.data.materials.append(used)
    for p in part.data.polygons:p.material_index=0
    part.name=used.name;part['palette_roles']={'attribute':'_palette_role','scale':1,'roles':ids}
    if 'part_ranges' in part:del part['part_ranges']
bpy.context.preferences.filepaths.save_version=0
OUT.mkdir(parents=True,exist_ok=True);bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ['ASSET_SOURCE_NAME']))
