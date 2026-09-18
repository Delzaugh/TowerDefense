"""Golden Compiler. Isolated procedural source; shared pipeline owns GLB export."""
import bpy, bmesh, math, json, os
from pathlib import Path
from mathutils import Vector, Matrix

OUT=Path(os.environ['ASSET_BUILD_DIR']); OUT.mkdir(parents=True,exist_ok=True)
M=json.loads(Path(os.environ['ASSET_MANIFEST']).read_text(encoding='utf-8-sig'))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene; scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=1; scene.render.fps=24
def linear(h):
    cs=[int(h.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in cs)+(1,)
colors={k:linear(v) for k,v in M['palette']['colors'].items()}; ids={k:i+1 for i,k in enumerate(colors)}
V=[]; F=[]; R=[]; W=[]; P=[]; HAND_XFORMS={}
def geometry(name,vs,fs,role,bone='fixed',weights=None):
    start=len(V);V.extend([tuple(v) for v in vs]);F.extend([tuple(start+i for i in f) for f in fs])
    R.extend(role if isinstance(role,list) else [role]*len(fs)); W.extend(weights or [{bone:1} for v in vs])
    P.append({'name':name,'start':start,'count':len(vs)})
def collect(o,name,role,bone):
    bpy.context.view_layer.update()
    points=[o.matrix_world@v.co for v in o.data.vertices]
    if bone in HAND_XFORMS:
        pivot,turn=HAND_XFORMS[bone];points=[pivot+turn@(p-pivot) for p in points]
    geometry(name,points,[tuple(p.vertices) for p in o.data.polygons],role,bone)
    bpy.data.objects.remove(o,do_unlink=True)
def box(name,p,size,role,bone='fixed',bevel=0,rotation=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('edge','BEVEL');mod.width=bevel;mod.segments=1;bpy.ops.object.modifier_apply(modifier=mod.name)
    if rotation is not None:o.rotation_euler=rotation.to_euler() if hasattr(rotation,'to_euler') else rotation
    collect(o,name,role,bone)
def link(name,a,b,width,depth,role,bone,bevel=0):
    a,b=Vector(a),Vector(b);d=b-a
    box(name,(a+b)/2,(width,depth,d.length),role,bone,bevel,Vector((0,0,1)).rotation_difference(d.normalized()))
OCT=[(-.65,-1),(.65,-1),(1,-.55),(1,.55),(.65,1),(-.65,1),(-1,.55),(-1,-.55)]
def loft(name,rings,role,bone='fixed',ring_weights=None):
    vs=[];ws=[]
    for i,(x,y,z,w,d) in enumerate(rings):
        vs.extend([(x+a*w,y+b*d,z) for a,b in OCT]);ws.extend([ring_weights[i] if ring_weights else {bone:1}]*8)
    fs=[tuple(range(7,-1,-1))]
    for j in range(len(rings)-1):
        for k in range(8):fs.append((j*8+k,j*8+(k+1)%8,(j+1)*8+(k+1)%8,(j+1)*8+k))
    fs.append(tuple((len(rings)-1)*8+k for k in range(8)))
    geometry(name,vs,fs,role,bone,ws)
def panel(name,outline,y,thickness,role,bone='spine'):
    n=len(outline);vs=[(x,y,z) for x,z in outline]+[(x,y+thickness,z) for x,z in outline]
    fs=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    geometry(name,vs,fs,role,bone)
def cylinder(name,radius,z,depth,role):
    bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=radius,depth=depth,location=(0,0,z),rotation=(0,0,math.pi/12))
    collect(bpy.context.object,name,role,'fixed')

root=bpy.data.objects.new('root',None);scene.collection.objects.link(root);root['asset']='golden_compiler_v01'
root['forward']='+Z glTF / -Y Blender';root['aura']='Separate presentation effect; see aura_spec.json'
root['presentation_effect']={'type':'golden_flame','anchor':'anchor_aura','width':2.75,'height':3.8,'profile':M['presentation']['profile'],'depth':.60,'capsules':{str(i):{'a':a,'b':b,'radius':r} for i,(a,b,r) in enumerate(M['presentation']['capsules'])}}
# Free-standing character. Authored body coordinates are grounded below before rigging.
for s in (-1,1):
    x=s*.32
    box('boot_sole',(x,-.07,.257),(.37,.55,.074),'sole',bevel=.025)
    loft('boot',[(x,-.07,.292,.18,.257),(x,-.07,.39,.18,.25),(x,.015,.53,.145,.155)],'boot')
    loft('trouser_leg',[(x,.015,.46,.133,.144),(s*.315,.02,.61,.151,.151),(s*.28,.015,.92,.14,.16),(s*.20,.005,1.30,.145,.16),(s*.18,0,1.42,.145,.15)],'trousers')
    box('boot_cuff',(x,.01,.49),(.30,.325,.065),'charcoal')
loft('pelvis',[(0,0,1.20,.32,.175),(0,0,1.44,.31,.18)],'charcoal')
loft('shirt',[(0,0,1.35,.30,.19),(0,0,1.62,.31,.195),(0,0,2.02,.35,.20),(0,0,2.17,.245,.15)],'charcoal','spine')
box('waist_band',(0,-.20,1.435),(.37,.022,.050),'boot','spine')
# Open one-piece coat. Two continuous skins share rim edges; no coplanar trim.
arc=[math.radians(40+280*i/12) for i in range(13)];levels=[(.64,.60,.31),(1.34,.40,.245),(1.93,.445,.29),(2.11,.475,.245),(2.17,.215,.175)]
vs=[];ws=[]
for inner in (False,True):
    for z,w,d in levels:
        for a in arc:
            vs.append((math.sin(a)*(w-(.035 if inner else 0)),-math.cos(a)*(d-(.035 if inner else 0)),z))
            t=min(1,max(0,(z-1.30)/.35));ws.append({'fixed':1-t,'spine':t})
fs=[];rr=[];n=13;layer=n*len(levels)
for side in range(2):
    for j in range(len(levels)-1):
        for k in range(n-1):
            ix=side*layer+j*n+k;f=(ix,ix+1,ix+1+n,ix+n);fs.append(f if side==0 else f[::-1]);rr.append('coat' if side==0 else 'coat_shadow')
for j in (0,len(levels)-1):
    for k in range(n-1):
        i=j*n+k;fs.append((i,i+1,i+1+layer,i+layer));rr.append('coat_light')
for k in (0,n-1):
    for j in range(len(levels)-1):
        i=j*n+k;fs.append((i,i+n,i+n+layer,i+layer));rr.append('coat_light')
geometry('continuous_open_coat',vs,fs,rr,weights=ws)
# Broad folded lapels; sit along the actual front openings.
for s in (-1,1):
    panel('lapel',[(s*.105,1.82),(s*.31,2.05),(s*.235,2.19),(s*.145,2.15),(s*.175,2.02)],-.278,.050,'coat_light')
loft('neck',[(0,0,2.13,.12,.115),(0,0,2.42,.125,.125)],'skin','head')
# Low open collar clears the shortened head, including head tilt in the work clip.
av=[math.radians(58+244*i/8) for i in range(9)];vs=[]
for z,r in [(2.12,.225),(2.19,.255),(2.19,.214),(2.12,.186)]:
    vs.extend([(math.sin(a)*r,-math.cos(a)*r*.77,z) for a in av])
fs=[]
for j in range(4):
    for k in range(8):fs.append((j*9+k,j*9+k+1,((j+1)%4)*9+k+1,((j+1)%4)*9+k))
fs.extend([(0,9,18,27),(8,35,26,17)])
geometry('stand_collar',vs,fs,'coat_light','spine')

bones={'fixed':((0,0,.2),None),'spine':((0,0,1.36),'fixed'),'head':((0,0,2.24),'spine')}
# Continuous cloth sleeve through each elbow, with blended weights at the bend.
for s,side in [(-1,'l'),(1,'r')]:
    shoulder=Vector((s*.40,0,2.075))
    elbow=Vector((-.66,-.08,1.775) if s<0 else (.575,.025,1.72))
    wrist=Vector((-.90,-.365,1.965) if s<0 else (.675,-.065,1.385))
    upper='arm_'+side; fore='fore_'+side; hand='hand_'+side
    bones[upper]=(shoulder,'spine');bones[fore]=(elbow,upper);bones[hand]=(wrist,fore)
    u=(elbow-shoulder).normalized();f=(wrist-elbow).normalized()
    if side=='r':HAND_XFORMS['hand_r']=(wrist,Matrix.Rotation(math.pi,3,f))
    centers=[shoulder-u*.065,shoulder+u*.08,elbow-u*.065,elbow+f*.055,wrist-f*.028]
    radii=[.172,.186,.158,.161,.166];sv=[];sw=[]
    for j,(c,r) in enumerate(zip(centers,radii)):
        tangent=u if j<2 else (u+f).normalized() if j==2 else f
        quat=Vector((0,0,1)).rotation_difference(tangent)
        for k in range(8):
            a=math.tau*k/8;sv.append(c+quat@Vector((r*math.cos(a),r*math.sin(a),0)))
            sw.append({upper:1} if j<2 else {upper:.5,fore:.5} if j==2 else {fore:1})
    sf=[tuple(range(7,-1,-1))]
    for j in range(4):
        for k in range(8):sf.append((j*8+k,j*8+(k+1)%8,(j+1)*8+(k+1)%8,(j+1)*8+k))
    sf.append(tuple(32+k for k in range(8)))
    geometry('continuous_sleeve_'+side,sv,sf,'coat',weights=sw)
    link('dark_cuff',wrist-f*.045,wrist+f*.042,.239,.239,'boot',hand)
    if s<0:
        box('open_palm',(-.955,-.42,2.006),(.237,.22,.092),'boot',hand,.025)
        # Four upturned fingers, two-segment solid profiles; readable cupped hand.
        for i in range(4):
            x=-1.042+i*.059
            link('finger', (x,-.495,2.01),(x,-.578,2.067),.048,.055,'boot',hand,.008)
            link('fingertip',(x,-.578,2.067),(x,-.567,2.117-(.012 if i in (0,3) else 0)),.047,.053,'boot',hand,.005)
        # Supinated anatomical right hand: thumb is lateral, away from the torso.
        # Preserve the upward palm and wrist seat; the old thumb made this a left hand.
        link('thumb',(-1.052,-.405,2.025),(-1.093,-.474,2.092),.068,.072,'boot',hand,.01)
    else:
        box('fist',(.701,-.086,1.294),(.235,.232,.235),'boot',hand,.034,rotation=(0,-.1,-.13))
        box('thumb',(.605,-.187,1.324),(.093,.084,.15),'sole',hand,.018,rotation=(0,-.15,-.15))

# Mature faceted face, with front surface -Y and deliberate cheek/jaw planes.
# Shared skull/scalp boundary closes the roots without a separate intersecting cap.
# Stubble is a colour region on the actual jaw surface, never a projecting beard plate.
head_rings=[(0,-.016,2.36,.145,.16),(0,-.018,2.45,.225,.213),(0,-.015,2.54,.2434,.2255),(0,-.01,2.68,.272,.245),(0,-.002,2.78,.267,.237),(0,.005,2.86,.263,.23),(0,.012,2.965,.19,.16)]
head_vs=[]
for j,(x,y,z,w,d) in enumerate(head_rings):
    for k,(a,b) in enumerate(OCT):
        dz=([.005,.005,.040,0,0,0,0,.040][k] if j==2 else 0)
        head_vs.append((x+a*w,y+b*d,z+dz))
head_fs=[tuple(range(7,-1,-1))];head_roles=['skin_shadow']
for j in range(len(head_rings)-1):
    for k in range(8):
        head_fs.append((j*8+k,j*8+(k+1)%8,(j+1)*8+(k+1)%8,(j+1)*8+k))
        head_roles.append(('beard_shadow' if j==0 else 'beard') if j<2 and k in (0,1,2,6,7) else 'hair_shadow' if j>=4 else 'skin')
head_fs.append(tuple((len(head_rings)-1)*8+k for k in range(8)));head_roles.append('hair_shadow')
geometry('head',head_vs,head_fs,head_roles,'head')
for s in (-1,1):
    loft('ear',[(s*.273,0,2.535,.049,.057),(s*.282,-.015,2.66,.065,.064),(s*.266,0,2.72,.044,.04)],'skin_shadow','head')
    # Eyes are narrow trapezoids with higher outer corners, golden angled brows.
    outline=[(s*.045,2.683),(s*.189,2.707),(s*.184,2.636),(s*.060,2.632)]
    panel('eye_white',outline,-.258,.016,'white','head')
    panel('teal_iris',[(s*.091,2.679),(s*.140,2.687),(s*.138,2.638),(s*.091,2.637)],-.277,.013,'eye','head')
    panel('pupil',[(s*.111,2.679),(s*.127,2.681),(s*.127,2.643),(s*.111,2.643)],-.291,.006,'charcoal','head')
    panel('brow',[(s*.035,2.705),(s*.205,2.755),(s*.21,2.719),(s*.044,2.677)],-.278,.036,'hair_shadow','head')
    panel('cheek_plane',[(s*.165,2.59),(s*.235,2.617),(s*.212,2.53),(s*.15,2.515)],-.235,.017,'skin_light','head')
# Solid nose has a seated root and a forward tip.
geometry('nose',[(-.042,-.25,2.71),(.042,-.25,2.71),(-.055,-.256,2.574),(.055,-.256,2.574),(0,-.366,2.585),(0,-.284,2.722)],[(0,1,5),(0,5,4,2),(5,1,3,4),(2,4,3),(0,2,3,1)],'skin_light','head')
# Restrained mouth crease seated against the stubbled face, without a thick moustache.
panel('mouth',[(-.073,2.514),(.068,2.521),(.057,2.509),(-.063,2.503)],-.242,.005,'charcoal','head')
# Overlapping swept locks grow out of a compact scalp, with staggered roots and tips.
def tuft(name,base,mid,tip,width,depth,role):
    base,mid,tip=map(Vector,(base,mid,tip));vs=[]
    # A narrow front ridge and curved taper read as hair instead of square crown teeth.
    sections=[(base,width,depth),(base.lerp(mid,.62),width*.88,depth*.88),(mid,width*.55,depth*.57)]
    for c,w,d in sections:
        vs.extend([c+Vector((-w,0,0)),c+Vector((0,-d,-.035)),c+Vector((w,0,0)),c+Vector((0,d,0))])
    vs.append(tip);fs=[(3,2,1,0)]
    for j in range(2):fs.extend([(j*4+k,j*4+(k+1)%4,(j+1)*4+(k+1)%4,(j+1)*4+k) for k in range(4)])
    fs.extend([(8+k,8+(k+1)%4,12) for k in range(4)])
    geometry(name,vs,fs,['hair_shadow']+([role,'hair_light','hair','hair_shadow']*3),'head')
tuft('high_swept_lock',(-.035,.045,2.92),(.015,.17,3.26),(.13,.28,3.50),.18,.18,'hair')
tuft('left_swept_lock',(-.14,.015,2.87),(-.235,.12,3.14),(-.29,.29,3.38),.17,.155,'hair')
tuft('right_swept_lock',(.145,.08,2.87),(.255,.225,3.11),(.34,.38,3.29),.15,.15,'hair')
tuft('temple_left',(-.23,-.015,2.745),(-.34,.07,2.94),(-.43,.245,3.13),.115,.13,'hair')
tuft('temple_right',(.23,.00,2.77),(.34,.10,2.97),(.44,.30,3.15),.115,.14,'hair')
tuft('nape_left',(-.13,.19,2.78),(-.19,.31,2.98),(-.24,.49,3.19),.16,.145,'hair')
tuft('nape_right',(.10,.20,2.79),(.17,.34,3.04),(.235,.50,3.25),.16,.145,'hair')
tuft('front_main_lock',(-.095,-.19,2.79),(-.11,-.18,3.095),(-.025,.055,3.365),.16,.13,'hair')
tuft('front_parted_lock',(.14,-.17,2.81),(.20,-.14,3.035),(.31,.05,3.23),.14,.12,'hair')
tuft('front_left_lock',(-.225,-.10,2.75),(-.30,-.10,2.945),(-.375,.055,3.105),.105,.105,'hair')
# Small downward forelock gives the hairline a real V rather than a flat helmet edge.
geometry('widow_peak',[(-.145,-.225,2.937),(.07,-.228,2.956),(-.032,-.263,2.793),(-.034,-.29,2.94)],[(0,1,3),(0,3,2),(3,1,2),(1,0,2)],['hair','hair_light','hair_shadow','hair'],'head')

bones['core']=((-.955,-.44,2.48),'hand_l')
# Three closed, extruded glyph outlines. The chevrons are coherent mitered
# shapes, not intersecting bars; the slash has consistent stroke and spacing.
chevron=[(-.29,0),(-.132,.155),(-.090,.108),(-.207,0),(-.090,-.108),(-.132,-.155)]
for name,sign in [('code_left',1),('code_right',-1)]:
    outline=[(-.955+sign*x,2.48+z) for x,z in chevron]
    panel(name,outline,-.466,.052,['core_light','gold']+['gold']*6,'core')
panel('code_slash',[(-1.015,2.33),(-.960,2.33),(-.883,2.63),(-.938,2.63)],-.466,.052,['core_light','gold']+['gold']*4,'core')

# Remove the former pedestal height from geometry and bone rest positions together.
GROUND_OFFSET=.22
# Seat the head closer to the shoulders; shorten the neck without shrinking the face.
HEAD_DROP=.13
for part in P:
    for i in range(part['start'],part['start']+part['count']):
        if W[i].get('head',0)==1:
            x,y,z=V[i]
            drop=HEAD_DROP*max(0,min(1,(z-2.13)/.29)) if part['name']=='neck' else HEAD_DROP
            V[i]=(x,y,z-drop)
p,parent=bones['head'];bones['head']=((p[0],p[1],p[2]-HEAD_DROP),parent)
V=[(x,y,z-GROUND_OFFSET) for x,y,z in V]
bones={name:((p[0],p[1],p[2]-GROUND_OFFSET),parent) for name,(p,parent) in bones.items()}
data=bpy.data.meshes.new('golden_compiler_mesh');data.from_pydata(V,[],F);data.update()
bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
obj=bpy.data.objects.new('golden_compiler',data);scene.collection.objects.link(obj);obj['part_ranges']=json.dumps(P)
for name in bones:
    group=obj.vertex_groups.new(name=name)
    for i,ws in enumerate(W):
        if ws.get(name,0)>0:group.add([i],ws[name],'REPLACE')
data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER');data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
for p,role in zip(data.polygons,R):
    for li in p.loop_indices:
        data.color_attributes['Color'].data[li].color=colors[role];data.attributes['_palette_role'].data[li].value=ids[role]
    p.material_index=1 if role in ('gold','core_light') else 2 if role in ('hair','hair_light','hair_shadow') else 0
obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':ids}
data['palette_roles']={'attribute':'_palette_role','scale':1,'roles':ids}
for name,emission in [('compiler_matte',0),('compiler_energy',.8),('compiler_golden_hair',.30)]:
    mat=bpy.data.materials.new(name);mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.78
    attr=mat.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='Color';mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color'])
    bs.inputs['Emission Color'].default_value=linear('#FFD14C');bs.inputs['Emission Strength'].default_value=emission;data.materials.append(mat)
arm=bpy.data.armatures.new('compiler_skeleton');rig=bpy.data.objects.new('compiler_rig',arm);scene.collection.objects.link(rig);rig.parent=root
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,(pivot,parent) in bones.items():
    b=arm.edit_bones.new(name);b.head=pivot;b.tail=Vector(pivot)+Vector((0,0,.13))
    if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');obj.parent=rig;mod=obj.modifiers.new('compiler_skin','ARMATURE');mod.object=rig
for name,pos in [('anchor_ui',(0,0,3.55-GROUND_OFFSET-HEAD_DROP)),('anchor_aura',(0,0,0)),('anchor_action',(-.955,-.44,2.48-GROUND_OFFSET))]:
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o)
    if name=='anchor_action':
        o.parent=rig;o.parent_type='BONE';o.parent_bone='core';o.matrix_world=Matrix.Translation(Vector(pos))
    else:o.parent=root;o.location=pos
def reset():
    for pb in rig.pose.bones:pb.rotation_mode='XYZ';pb.location=(0,0,0);pb.rotation_euler=(0,0,0);pb.scale=(1,1,1)
for clip,length in [('idle',48),('work',36)]:
    rig.animation_data_create();action=bpy.data.actions.new(clip);rig.animation_data.action=action
    for frame in range(1,length+2):
        reset();t=(frame-1)/length;wave=.5-.5*math.cos(math.tau*t);pb=rig.pose.bones
        pb['spine'].scale.y=1+.009*wave;pb['head'].rotation_euler.x=.015*math.sin(math.tau*t)
        pb['core'].location.y=.028*wave;pb['core'].rotation_euler.y=.14*math.sin(math.tau*t)
        if clip=='work':
            pb['arm_l'].rotation_euler.z=-.045*wave;pb['fore_l'].rotation_euler.x=-.085*wave
            pb['hand_l'].rotation_euler.x=.045*wave;pb['core'].scale=(1+.075*wave,)*3
            pb['head'].rotation_euler.z=-.07*wave;pb['fore_r'].rotation_euler.x=-.04*wave
        for p in pb:
            for prop in ('location','rotation_euler','scale'):p.keyframe_insert(data_path=prop,frame=frame,group=p.name)
    action.use_fake_user=True;track=rig.animation_data.nla_tracks.new();track.name=clip;strip=track.strips.new(clip,1,action);strip.name=clip;track.mute=True
rig.animation_data.action=None;reset();scene.frame_set(1);scene.frame_end=49
data.calc_loop_triangles();triangles=len(data.loop_triangles)
assert triangles<=M['budgets']['triangles'],triangles
# Editable silhouette envelope reference, excluded from production root.
aura=bpy.data.collections.new('PRESENTATION_ONLY_AURA');scene.collection.children.link(aura)
profile=[Vector(p) for p in M['presentation']['profile']]
area=sum(profile[i].x*profile[(i+1)%len(profile)].y-profile[(i+1)%len(profile)].x*profile[i].y for i in range(len(profile)))
if area<0:profile.reverse()
vs=[];fs=[];n=len(profile)
for inset,depth in [(.11,.60),(.035,.46),(0,0),(.035,-.43),(.11,-.58)]:
    for i,p in enumerate(profile):
        a=(p-profile[(i-1)%n]).normalized();b=(profile[(i+1)%n]-p).normalized()
        normal=Vector((a.y+b.y,-a.x-b.x)).normalized();offset=inset/max(.5,normal.dot(Vector((b.y,-b.x))))
        q=p-normal*offset;vs.append((q.x,-depth,q.y))
for j in range(4):
    for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
fs.extend([tuple(range(n-1,-1,-1)),tuple(4*n+i for i in range(n))])
mesh=bpy.data.meshes.new('aura_silhouette_envelope');mesh.from_pydata(vs,[],fs)
mat=bpy.data.materials.new('aura_preview_gold');mat.diffuse_color=(*linear('#FFD34E')[:3],.18);mesh.materials.append(mat)
envelope=bpy.data.objects.new('aura_silhouette_reference',mesh);aura.objects.link(envelope);envelope.display_type='WIRE'
aura.hide_viewport=True;aura.hide_render=True
scene.world=bpy.data.worlds.new('compiler_studio_world');scene.world.color=(.12,.12,.12)
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ['ASSET_SOURCE_NAME']))
print('GOLDEN_COMPILER_STATS',json.dumps({'triangles':triangles,'bones':len(bones),'vertices':len(V)}))
