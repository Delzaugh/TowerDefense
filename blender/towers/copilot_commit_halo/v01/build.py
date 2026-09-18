"""Commit Halo: editable low-poly architect, vertex palette, compact skin and clips.
The shared pipeline exclusively owns export and canonical-file promotion.
"""
import bpy, bmesh, math, json, os
from pathlib import Path
from mathutils import Vector

OUT=Path(os.environ['ASSET_BUILD_DIR'])
M=json.loads(Path(os.environ['ASSET_MANIFEST']).read_text(encoding='utf-8-sig'))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1;scene.render.fps=24
verts=[];faces=[];roles=[];weights=[];parts=[]
def mesh(name,vs,fs,role,bone='body',face_roles=None):
    start=len(verts);verts.extend(vs);weights.extend([bone]*len(vs))
    faces.extend([tuple(start+i for i in f) for f in fs])
    roles.extend(face_roles or [role]*len(fs))
    parts.append(dict(name=name,start=start,count=len(vs),bone=bone))
def collect(o,name,role,bone):
    bpy.context.view_layer.update()
    mesh(name,[tuple(o.matrix_world@v.co) for v in o.data.vertices],[tuple(p.vertices) for p in o.data.polygons],role,bone)
    bpy.data.objects.remove(o,do_unlink=True)
def box(name,c,size,role,bone='body',bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=c);o=bpy.context.object;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('edge_chamfer','BEVEL');m.width=bevel;m.segments=1
        bpy.ops.object.modifier_apply(modifier=m.name)
    collect(o,name,role,bone)
def ellipsoid(name,c,r,role,bone='body',segments=10,rings=5):
    vs=[(c[0],c[1],c[2]-r[2])]
    for j in range(1,rings):
        p=-math.pi/2+math.pi*j/rings
        for i in range(segments):
            t=math.tau*i/segments
            vs.append((c[0]+r[0]*math.cos(p)*math.cos(t),c[1]+r[1]*math.cos(p)*math.sin(t),c[2]+r[2]*math.sin(p)))
    vs.append((c[0],c[1],c[2]+r[2]));fs=[]
    for i in range(segments):fs.append((0,1+(i+1)%segments,1+i))
    for j in range(rings-2):
        for i in range(segments):
            a=1+j*segments+i;b=1+j*segments+(i+1)%segments;fs.append((a,b,b+segments,a+segments))
    for i in range(segments):fs.append((len(vs)-1,1+(rings-2)*segments+i,1+(rings-2)*segments+(i+1)%segments))
    mesh(name,vs,fs,role,bone)
def loft(name,sections,role,bone='body',n=8,phase=math.pi/8):
    # Horizontal elliptical rings form a continuous closed shell.
    vs=[]
    for x,y,z,rx,ry in sections:
        for i in range(n):
            a=math.tau*i/n+phase;vs.append((x+rx*math.cos(a),y+ry*math.sin(a),z))
    fs=[tuple(reversed(range(n)))]
    for j in range(len(sections)-1):
        for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    fs.append(tuple((len(sections)-1)*n+i for i in range(n)))
    mesh(name,vs,fs,role,bone)
def prism(name,profile,front,back,role,bone='body'):
    n=len(profile);vs=[(x,y,z) for y in (front,back) for x,z in profile]
    fs=[tuple(range(n)),tuple(reversed(range(n,n*2)))]
    fs.extend([(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)])
    mesh(name,vs,fs,role,bone)
def rod(name,a,b,r,role,bone='head',n=6):
    a,b=Vector(a),Vector(b);d=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=n,radius1=r,radius2=r,depth=d.length,location=(a+b)/2)
    o=bpy.context.object;o.rotation_mode='QUATERNION';o.rotation_quaternion=Vector((0,0,1)).rotation_difference(d.normalized())
    collect(o,name,role,bone)
def band(name,c,rin,rout,depth,role,bone='halo',n=40):
    # One closed annular solid; each ring shares boundaries with its neighbors.
    vs=[]
    for y,r in [(c[1]-depth/2,rout),(c[1]-depth/2,rin),(c[1]+depth/2,rout),(c[1]+depth/2,rin)]:
        vs.extend([(c[0]+r*math.cos(math.tau*i/n),y,c[2]+r*math.sin(math.tau*i/n)) for i in range(n)])
    fs=[];rr=[]
    for i in range(n):
        j=(i+1)%n
        for a,b,k in [(0,1,role),(2,0,'gold_light' if role=='gold' else role),(1,3,'gold_shade' if role=='gold' else role),(3,2,role)]:
            fs.append((a*n+i,a*n+j,b*n+j,b*n+i));rr.append(k)
    mesh(name,vs,fs,role,bone,rr)

root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
root['asset']='copilot_commit_halo_v01';root['forward']='+Z glTF / -Y Blender'
bones={'base':((0,0,0),None),'body':((0,0,1.39),'base'),'head':((0,0,2.10),'body'),'halo':((0,0,2.07),'base'),'orbit':((0,0,2.07),'halo')}
# No pedestal: the completed character and rig are lowered by the old sole
# height below, preserving proportions while placing both soles at ground.
for s,side in [(-1,'l'),(1,'r')]:
    shoe_start=len(verts)
    outline=[(-.12,.16),(.12,.16),(.16,.07),(.17,-.19),(.12,-.33),(.05,-.36),(-.07,-.36),(-.14,-.29),(-.17,-.16),(-.155,.065)]
    vs=[];fs=[];rr=[];n=len(outline)
    for scale,z in [(.96,.29),(1,.34)]:vs.extend([(s*.29+x*scale,y,z) for x,y in outline])
    fs.extend([tuple(reversed(range(n))),tuple(n+i for i in range(n))]);rr.extend(['ivory_light','ivory_light'])
    for i in range(n):fs.append((i,(i+1)%n,(i+1)%n+n,i+n));rr.append('ivory_light')
    mesh('sneaker_sole_'+side,vs,fs,'ivory_light','base',rr)
    vs=[]
    for layer in range(3):
        for x,y in outline:
            scale=[.97,.87,.54][layer];z=.34 if layer==0 else (.405+.055*(y+.36)/.52) if layer==1 else (.425+.095*(y+.36)/.52)
            vs.append((s*.29+x*scale,y if layer==0 else y*.92+.02 if layer==1 else y*.68+.025,z))
    fs=[tuple(reversed(range(n)))]
    for j in range(2):
        for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    fs.append(tuple(2*n+i for i in range(n)))
    mesh('sneaker_upper_'+side,vs,fs,'charcoal','base')
    # Broad inset tongue and two lace strokes follow the sloping vamp.
    for y in (-.12,-.065):
        z=.486+.16*y
        mesh('shoe_lace_'+side,[(s*.29-.052,y-.008,z-.0013),(s*.29+.052,y-.008,z-.0013),(s*.29+.052,y+.008,z+.0013),(s*.29-.052,y+.008,z+.0013)],[(0,1,2,3)],'ivory_light','base')
    # Scale the complete sneaker around its ankle and ground contact, so
    # upper, sole and laces retain their fit without the oversized footprint.
    for i in range(shoe_start,len(verts)):
        x,y,z=verts[i]
        verts[i]=(s*.29+(x-s*.29)*.80,.025+(y-.025)*.76,.29+(z-.29)*.85)
    loft('trousers_'+side,[(s*.29,.025,.459,.098,.098),(s*.26,.045,.68,.16,.16),(s*.145,.025,1.27,.11,.11)],'charcoal','base')
# Open casual jacket: a real open-front shell with thickness and two free hems.
# The blue shirt sits underneath; there is no closed sweater-like front.
angles=[-65,-30,0,30,60,90,120,150,180,210,245]
sections=[(1.17,.30,.195),(1.45,.285,.19),(1.83,.34,.195),(1.98,.27,.145)]
n=len(angles);rows=len(sections);vs=[]
for inset in (0,.022):
    vs.extend([((rx-inset)*math.cos(math.radians(a)),.01+(ry-inset)*math.sin(math.radians(a)),z) for z,rx,ry in sections for a in angles])
offset=n*rows;fs=[];rr=[]
for j in range(rows-1):
    for i in range(n-1):
        a=j*n+i;b=a+1;c=b+n;d=a+n
        fs.extend([(a,b,c,d),(a+offset,d+offset,c+offset,b+offset)]);rr.extend(['ivory','cloth_trim'])
for j in range(rows-1):
    for i in (0,n-1):
        a=j*n+i;b=a+n;fs.append((a,b,b+offset,a+offset));rr.append('ivory_light')
for j in (0,rows-1):
    for i in range(n-1):
        a=j*n+i;b=a+1;fs.append((a,a+offset,b+offset,b));rr.append('ivory_light')
mesh('open_jacket',vs,fs,'ivory','body',rr)
loft('tshirt',[(0,0,1.18,.22,.15),(0,0,1.45,.24,.155),(0,0,1.83,.285,.16),(0,0,1.98,.20,.12)],'shirt','body',12,0)
loft('shirt_neck',[(0,0,1.98,.145,.12),(0,0,2.04,.135,.115)],'shirt','body',12,0)
# Small folded spread collar makes the garment read as an open jacket.
for s in (-1,1):
    collar=[(s*.08,-.11,2.045),(s*.175,-.115,2.015),(s*.22,-.215,1.90),(s*.135,-.226,1.93)]
    mesh('jacket_collar',collar+[(x,y+.015,z-.006) for x,y,z in collar],[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],'ivory_light')
loft('neck',[(0,0,1.97,.12,.115),(0,0,2.19,.115,.11)],'skin','head',8)
# Asymmetric casual pose: left arm hangs relaxed, right palm is open upward.
for s,side in [(-1,'l'),(1,'r')]:
    bn='arm_'+side;bones[bn]=((s*.30,0,1.91),'body')
    ellipsoid('shoulder_seat_'+side,(s*.30,0,1.89),(.125,.12,.135),'ivory',bn,10,5)
    positions=[(-.30,0,1.91),(-.385,.018,1.67),(-.415,.01,1.47),(-.445,-.025,1.26)] if side=='l' else [(.30,0,1.91),(.405,.015,1.72),(.435,-.07,1.60),(.44,-.38,1.76)]
    centers=[Vector(c) for c in positions]
    radii=[.12,.112,.105,.09];vs=[];n=10
    for k,c in enumerate(centers):
        d=(centers[min(k+1,3)]-centers[max(0,k-1)]).normalized();u=Vector((0,1,0));v=d.cross(u).normalized();u=v.cross(d).normalized()
        for i in range(n):
            a=math.tau*i/n;vs.append(tuple(c+radii[k]*(math.cos(a)*u+math.sin(a)*v)))
    end=centers[-1];d=(end-centers[-2]).normalized();u=Vector((0,1,0));v=d.cross(u).normalized();u=v.cross(d).normalized()
    for c,r in [(end,.072),(end-d*.055,.06)]:
        for i in range(n):
            a=math.tau*i/n;vs.append(tuple(c+r*(math.cos(a)*u+math.sin(a)*v)))
    fs=[tuple(reversed(range(n)))];fr=['ivory']
    for k in range(5):
        for i in range(n):fs.append((k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i));fr.append('ivory' if k<2 else 'cloth_trim' if k<4 else 'shirt')
    fs.append(tuple(5*n+i for i in range(n)));fr.append('charcoal')
    mesh('fabric_sleeve_'+side,vs,fs,'ivory',bn,fr)
    if side=='l':
        rod('wrist_l',end-d*.035,(-.445,-.042,1.19),.06,'skin',bn,8)
        ellipsoid('relaxed_hand',(-.445,-.049,1.145),(.076,.060,.105),'skin',bn,8,5)
        rod('relaxed_thumb',(-.393,-.064,1.19),(-.372,-.07,1.12),.026,'skin',bn,6)
    else:
        # Turn the palm and fingers toward the space in front of her chest.
        # The wrist remains seated in the re-aimed forearm sleeve.
        def holding_point(p):
            q=Vector(p)-Vector((.735,-.235,1.76));a=math.radians(-70)
            return end+Vector((math.cos(a)*q.x-math.sin(a)*q.y,math.sin(a)*q.x+math.cos(a)*q.y,q.z))
        rod('wrist_r',end-d*.035,holding_point((.79,-.275,1.785)),.055,'skin',bn,8)
        hand_start=len(verts)
        ellipsoid('open_palm',(.853,-.285,1.782),(.092,.076,.033),'skin',bn,10,5)
        for k,(y,length) in enumerate([(-.339,.075),(-.303,.103),(-.267,.09),(-.231,.065)]):
            rod('open_finger_'+str(k),(.90,y,1.786),(.90+length,y-.005,1.815),.017,'skin',bn,6)
        rod('open_thumb',(.825,-.34,1.786),(.87,-.392,1.81),.023,'skin',bn,7)
        # Correct palm-up handedness: thumb lies on the outward edge, with
        # the index-to-little-finger order mirrored together with the thumb.
        for i in range(hand_start,len(verts)):
            x,y,z=verts[i];verts[i]=tuple(holding_point((x,-.57-y,z)))
# Head planes are deliberately larger than fine facial features.
ellipsoid('face',(0,-.035,2.363),(.255,.218,.326),'skin','head',16,9)
for s in (-1,1):ellipsoid('ear',(s*.247,-.005,2.35),(.054,.062,.083),'skin','head',8,4)
# Reference-inspired wavy lob: dark center part, broad curtain bangs,
# warmer face-framing lengths and softly scalloped chin-length ends.
n=18;vs=[]
for j in range(5):
    for i in range(n):
        t=math.tau*i/n;front=max(0,-math.sin(t))
        if j==0:z=2.12+.525*front+.018*math.cos(3*t);rx=.285;ry=.242
        elif j==1:z=2.36+.305*front;rx=.338;ry=.28
        elif j==2:z=2.575+.11*front;rx=.29;ry=.252
        elif j==3:z=2.723;rx=.174;ry=.155
        else:z=2.773;rx=.029;ry=.025
        vs.append((rx*math.cos(t),.025+ry*math.sin(t),z))
fs=[];rr=[]
for j in range(4):
    for i in range(n):
        fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
        rr.append('hair_mid' if j==0 else 'hair_light' if j==1 else 'hair')
fs.extend([tuple(reversed(range(n))),tuple(4*n+i for i in range(n))]);rr.extend(['hair_mid','hair'])
mesh('wavy_bob_shell',vs,fs,'hair','head',rr)
# Two broad swept curtains start apart at the crown, expose the forehead,
# and bend out-in-out along the cheek. Highlights follow each whole lock.
for s in (-1,1):
    path=[(.034,-.145,2.735,.024,.028),(.102,-.205,2.655,.053,.042),(.187,-.220,2.55,.068,.045),(.285,-.176,2.435,.067,.049),(.25,-.134,2.32,.066,.052),(.30,-.125,2.205,.072,.05),(.269,-.12,2.12,.035,.038)]
    vs=[];n=8
    for k,(x,y,z,rx,ry) in enumerate(path):
        if s<0 and k>3:x+=.012;z-=.012
        for i in range(n):
            a=math.tau*i/n;vs.append((s*x+rx*math.cos(a),y+ry*math.sin(a),z))
    fs=[tuple(reversed(range(n)))];rr=['hair']
    for j in range(len(path)-1):
        for i in range(n):
            fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
            rr.append('hair' if j==0 else 'hair_light' if j==1 else 'hair_highlight' if i in (4,5,6) else 'hair_mid')
    fs.append(tuple((len(path)-1)*n+i for i in range(n)));rr.append('hair_highlight')
    mesh('curtain_bang_'+str(s),vs,fs,'hair','head',rr)
# Four broader rear waves break up the smooth cap without tiny strand noise.
for s in (-1,1):
    for k in range(2):
        x=s*(.262 if k==0 else .135);y=.115 if k==0 else .235
        f0=len(faces)
        loft('back_wave',[(x+s*.016,y,2.105+.012*k,.042,.055),(x+s*.028,y+.014,2.235,.069,.08),(x+s*.014,y,2.405,.074,.082),(x-s*.018,y-.02,2.57,.045,.052)],'hair_light','head',6,0)
        for fi in range(f0,min(f0+13,len(faces))):roles[fi]='hair_mid'
# Unobstructed eyes and eyebrows replace all glasses geometry.
for s in (-1,1):
    ellipsoid('eye_white',(s*.106,-.235,2.393),(.043,.018,.031),'ivory_light','head',8,4)
    ellipsoid('pupil',(s*.106,-.253,2.393),(.018,.008,.023),'frames','head',6,3)
    prism('eyebrow',[(s*.065,2.443),(s*.14,2.445),(s*.143,2.458),(s*.066,2.457)],-.224,-.213,'hair','head')
ellipsoid('nose',(0,-.26,2.324),(.041,.050,.043),'skin','head',6,4)
prism('smile',[(-.055,2.263),(0,2.251),(.055,2.263),(.034,2.243),(-.029,2.24)],-.248,-.239,'lip','head')
# Segmented horizontal orbital guides surround the shoulders, never the head.
for k in range(3):
    a0=math.pi/6+k*math.tau/3+.30;vs=[];segments=5
    for j in range(segments+1):
        a=a0+j*.82/segments
        for r,z in [(.84,2.045),(.89,2.045),(.89,2.095),(.84,2.095)]:vs.append((r*math.cos(a),r*math.sin(a),z))
    fs=[(3,2,1,0)];rr=['cyan']
    for j in range(segments):
        for i in range(4):fs.append((j*4+i,j*4+(i+1)%4,(j+1)*4+(i+1)%4,(j+1)*4+i));rr.append('cyan' if i==2 else 'stone_dark')
    fs.append(tuple(segments*4+i for i in range(4)));rr.append('cyan')
    mesh('orbital_guide_'+str(k),vs,fs,'stone_dark','orbit',rr)
for i,a in enumerate([math.pi/6,5*math.pi/6,3*math.pi/2]):
    bn='node_'+str(i+1);c=(1.20*math.cos(a),1.20*math.sin(a),2.07);bones[bn]=(c,'orbit')
    x,y,z=c
    # Each drone is now a free-standing extruded </> glyph, without a tile.
    # Each chevron is a single mitered outline, with a clear gap to the slash.
    left=[(-.12,.165),(-.27,0),(-.12,-.165),(-.075,-.12),(-.187,0),(-.075,.12)]
    right=[(-u,v) for u,v in reversed(left)]
    slash=[(-.065,-.175),(-.006,-.175),(.065,.175),(.006,.175)]
    for label,outline,role in [('less',left,'gold'),('slash',slash,'code_slash'),('greater',right,'gold')]:
        prism('code_'+str(i+1)+'_'+label,[(x+u,z+v) for u,v in outline],y-.042,y+.042,role,bn)

ground_offset=.29
verts=[(x,y,z-ground_offset) for x,y,z in verts]
bones={name:((x,y,z-ground_offset if name!='base' else z),parent) for name,((x,y,z),parent) in bones.items()}
data=bpy.data.meshes.new('commit_halo_mesh');data.from_pydata(verts,[],faces);data.update()
bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
obj=bpy.data.objects.new('commit_halo',data);scene.collection.objects.link(obj);obj['part_ranges']=json.dumps(parts)
for name in sorted(set(weights)):
    g=obj.vertex_groups.new(name=name);g.add([i for i,w in enumerate(weights) if w==name],1,'REPLACE')
def linear(h):
    cs=[int(h.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in cs)+(1,)
colors={k:linear(v) for k,v in M['palette']['colors'].items()};ids={k:i+1 for i,k in enumerate(colors)}
data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER');data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
for p,r in zip(data.polygons,roles):
    for li in p.loop_indices:data.color_attributes['Color'].data[li].color=colors[r];data.attributes['_palette_role'].data[li].value=ids[r]
obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':ids}
mat=bpy.data.materials.new('architect_palette');mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.78
attr=mat.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='Color';mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color']);data.materials.append(mat)
gold=mat.copy();gold.name='commit_gold';gbs=gold.node_tree.nodes.get('Principled BSDF')
gbs.inputs['Roughness'].default_value=.48;gbs.inputs['Metallic'].default_value=.12
gattr=next(n for n in gold.node_tree.nodes if n.type=='VERTEX_COLOR')
gold.node_tree.links.new(gattr.outputs['Color'],gbs.inputs['Emission Color']);gbs.inputs['Emission Strength'].default_value=.10
data.materials.append(gold)
cyan=mat.copy();cyan.name='interface_cyan';cbs=cyan.node_tree.nodes.get('Principled BSDF');cbs.inputs['Roughness'].default_value=.5
cattr=next(n for n in cyan.node_tree.nodes if n.type=='VERTEX_COLOR');cyan.node_tree.links.new(cattr.outputs['Color'],cbs.inputs['Emission Color']);cbs.inputs['Emission Strength'].default_value=.10
data.materials.append(cyan)
for p,r in zip(data.polygons,roles):p.material_index=1 if r.startswith('gold') else 2 if r in ('cyan','code_slash') else 0
arm=bpy.data.armatures.new('commit_halo_skeleton');rig=bpy.data.objects.new('commit_halo_rig',arm);scene.collection.objects.link(rig);rig.parent=root
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,(pivot,parent) in bones.items():
    b=arm.edit_bones.new(name);b.head=pivot;b.tail=Vector(pivot)+Vector((0,0,.12))
    if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');obj.parent=rig;mod=obj.modifiers.new('skin','ARMATURE');mod.object=rig
for name,p in [('anchor_ui',(0,0,2.98)),('anchor_action',(0,-.39,1.85)),('anchor_target',(0,0,1.7))]:
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=root;o.location=(p[0],p[1],p[2]-ground_offset)
def reset():
    for pb in rig.pose.bones:pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
for clip,length in [('idle',144),('work',72)]:
    rig.animation_data_create();action=bpy.data.actions.new(clip);rig.animation_data.action=action
    for frame in range(1,length+2):
        reset();t=(frame-1)/length;p=math.sin(math.tau*t)
        rig.pose.bones['body'].rotation_euler.x=.008*p
        rig.pose.bones['head'].rotation_euler.y=.025*p
        rig.pose.bones['arm_l'].rotation_euler.z=.014*p
        rig.pose.bones['arm_r'].rotation_euler.z=(.012 if clip=='idle' else .065)*p
        orbit=rig.pose.bones['orbit'];orbit.rotation_euler.y=math.tau*t
        # Guides and glyph locations share the animated orbit bone. Child
        # counter-rotation keeps each </> readable as the group travels.
        for i in range(3):rig.pose.bones['node_'+str(i+1)].rotation_euler.y=-math.tau*t
        for pb in rig.pose.bones:
            for prop in ('location','rotation_euler','scale'):pb.keyframe_insert(data_path=prop,frame=frame,group=pb.name)
    action.use_fake_user=True;track=rig.animation_data.nla_tracks.new();track.name=clip
    strip=track.strips.new(clip,1,action);strip.name=clip;track.mute=True
rig.animation_data.action=None;reset();scene.frame_set(1);scene.frame_end=145
data.calc_loop_triangles();print('COMMIT_HALO_STATS',json.dumps({'triangles':len(data.loop_triangles),'bones':len(arm.bones)}))
assert len(data.loop_triangles)<=M['budgets']['triangles'],len(data.loop_triangles)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
# Each material has its own mesh node, retaining palette metadata directly on
# imported meshes instead of a multi-primitive glTF container group.
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
for part in list(bpy.context.selected_objects):
    if part.type!='MESH':continue
    used=part.data.materials[part.data.polygons[0].material_index]
    part.data.materials.clear();part.data.materials.append(used)
    for p in part.data.polygons:p.material_index=0
    part.name='commit_gold' if used==gold else 'commit_interfaces' if used==cyan else 'commit_architect'
    part['palette_roles']={'attribute':'_palette_role','scale':1,'roles':ids}
    if 'part_ranges' in part:del part['part_ranges']
bpy.context.preferences.filepaths.save_version=0
OUT.mkdir(parents=True,exist_ok=True);bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ['ASSET_SOURCE_NAME']))

