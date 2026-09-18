"""Lag Spike: original concept adaptation. Shared pipeline owns GLB export.

Initial authoring uses ASSET_BUILD_DIR; subsequent builds use the guarded
asset.mjs export problem_lag_spike --build command to preserve manual edits.
"""
import bpy, bmesh, math, json, os
from pathlib import Path
from mathutils import Vector

OUT=Path(os.environ['ASSET_BUILD_DIR'])
CONTRACT=json.loads(Path(os.environ['ASSET_MANIFEST']).read_text(encoding='utf-8-sig'))
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
scene.render.fps=24
def linear(h):
    values=[int(h.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in values)+(1,)
COLORS={k:linear(v) for k,v in CONTRACT['palette']['colors'].items()}
ROLE_IDS={k:i+1 for i,k in enumerate(COLORS)}
verts=[];faces=[];roles=[];weights=[];parts=[]

def collect(o,name,role,bone):
    start=len(verts)
    verts.extend([tuple(o.matrix_world@v.co) for v in o.data.vertices]);weights.extend([bone]*len(o.data.vertices))
    for p in o.data.polygons:
        faces.append(tuple(start+i for i in p.vertices));roles.append(role)
    parts.append({'name':name,'bone':bone,'start':start,'count':len(o.data.vertices)})
    bpy.data.objects.remove(o,do_unlink=True)

def box(name,center,size,role,bone='body',bevel=0,tilt=0,rotation=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=center)
    o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('small_edge_bevel','BEVEL');mod.width=bevel;mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    o.rotation_euler.x=tilt
    if rotation is not None:o.rotation_euler=rotation.to_euler()
    bpy.context.view_layer.update()
    collect(o,name,role,bone)

def hinge(name,center,radius,width,bone):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=radius,depth=width,location=center,rotation=(0,math.pi/2,0))
    o=bpy.context.object;bpy.context.view_layer.update();collect(o,name,'joint',bone)

def streak(x,start,length,z,bone,core):
    # A single closed prism with shared color-band boundaries, no overlapping boxes.
    first=len(verts)
    for y in (start,start+length*.22,start+length*.52,start+length):
        verts.extend([(x-.0425,y,z-.0235),(x+.0425,y,z-.0235),(x+.0425,y,z+.0235),(x-.0425,y,z+.0235)])
    weights.extend([bone]*16)
    faces.append(tuple(first+j for j in (3,2,1,0)));roles.append(core)
    for k,role in enumerate((core,'blue','blue_dark')):
        for j in range(4):
            faces.append((first+k*4+j,first+k*4+(j+1)%4,first+(k+1)*4+(j+1)%4,first+(k+1)*4+j));roles.append(role)
    faces.append(tuple(first+j for j in (12,13,14,15)));roles.append('blue_dark')
    parts.append({'name':'streak','bone':bone,'start':first,'count':16})

def link(name,a,b,width,depth,role,bone,bevel=.008):
    a,b=Vector(a),Vector(b)
    delta=b-a
    box(name,(a+b)/2,(width,depth,delta.length),role,bone,bevel,rotation=Vector((0,0,1)).rotation_difference(delta.normalized()))

root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
root['asset']='problem_lag_spike_v01';root['forward']='+Z glTF / -Y Blender'
root['design']='Cube-headed violet enemy with cyan eyes and staggered glitch fragments'

# Quiet large planes with small edge catches. No busy panel decals.
box('pelvis',(0,0,.565),(.34,.25,.14),'body_dark',bevel=.009)
box('torso',(0,0,.795),(.39,.29,.39),'body',bevel=.016)
box('neck',(0,0,1.03),(.17,.17,.10),'joint',bevel=0)
box('cube_head',(0,-.018,1.285),(.51,.46,.51),'head','head',.018)
for s in (-1,1):
    box('eye_socket',(s*.125,-.253,1.272),(.126,.017,.151),'body_dark','head',0)
    box('cyan_eye',(s*.125,-.265,1.276),(.096,.013,.124),'cyan','head',0)

bones={'body':((0,0,.56),None),'head':((0,0,1.025),'body')}
for s,side in [(-1,'l'),(1,'r')]:
    shoulder=Vector((s*.280,0,.948));elbow=Vector((s*.338,-.005,.718));wrist=Vector((s*.382,-.050,.505))
    upper='arm_'+side;fore='forearm_'+side
    bones[upper]=(shoulder,'body');bones[fore]=(elbow,upper)
    u=(elbow-shoulder).normalized();f=(wrist-elbow).normalized()
    # Narrow X-axis axles sit inside the joint; shell ends stop before the pivot.
    hinge('shoulder_hinge',(s*.252,0,.948),.045,.140,upper)
    link('upper_inner',shoulder,elbow,.065,.070,'joint',upper,bevel=0)
    link('upper_arm',shoulder+u*.053,elbow-u*.055,.145,.155,'limb',upper)
    hinge('elbow_hinge',elbow,.044,.140,fore)
    link('fore_inner',elbow,wrist,.065,.070,'joint',fore,bevel=0)
    link('forearm',elbow+f*.055,wrist+f*.004,.145,.155,'head',fore)
    box('hand',wrist+f*.05,(.170,.180,.105),'body_dark',fore,.009,rotation=Vector((0,0,1)).rotation_difference(f))
    hip=(s*.135,0,.565);knee=(s*.135,0,.315);ankle=(s*.135,0,.065)
    thigh='thigh_'+side;shin='shin_'+side;foot='foot_'+side
    bones[thigh]=(hip,'body');bones[shin]=(knee,thigh);bones[foot]=(ankle,shin)
    box('thigh',(s*.135,0,.437),(.164,.19,.26),'limb',thigh,.008)
    box('knee',knee,(.15,.164,.11),'joint',shin,.005)
    box('shin',(s*.135,.005,.209),(.168,.181,.24),'head',shin,.008)
    box('foot',(s*.135,-.060,.065),(.204,.31,.13),'body_dark',foot,.008)

# Close silhouette echoes: each row starts beside its local body contour.
# Head echoes follow the head; torso rows start just behind the back; limb
# rows pass outside the arm sweep. Tail length pulses about the leading tip.
trail_layout=[
    (.285,.020,.30,.40,'body'),
    (.525,.015,.53,.46,'body'),
    (.105,.175,.75,.51,'body'),
    (.480,.025,.92,.43,'body'),
    (.305,.070,1.085,.48,'head'),
    (.305,.045,1.295,.57,'head'),
]
for i in range(12):
    side=-1 if i%2==0 else 1;row=i//2
    width,start,z,length,parent=trail_layout[row];x=side*width
    start+=.012 if side>0 else 0
    length*=.88 if side>0 else 1
    y=start+length*.5
    b='glitch_'+str(i);bones[b]=((x,start,z),parent)
    streak(x,start,length,z,b,'cyan' if i%3 else 'ice')
    if row in (2,4,5):
        box('broken_crossbar',(x+side*.145,y+.025,z+.007),(.16,.065,.053),'blue' if i%3 else 'ice',b)

data=bpy.data.meshes.new('lag_spike_mesh');data.from_pydata(verts,[],faces);data.update()
bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
obj=bpy.data.objects.new('lag_spike',data);scene.collection.objects.link(obj)
obj['part_ranges']=json.dumps(parts)
for name in sorted(set(weights)):
    g=obj.vertex_groups.new(name=name);g.add([i for i,w in enumerate(weights) if w==name],1,'REPLACE')
data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
for p,role in zip(data.polygons,roles):
    for li in p.loop_indices:
        data.color_attributes['Color'].data[li].color=COLORS[role]
        data.attributes['_palette_role'].data[li].value=ROLE_IDS[role]
obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':ROLE_IDS}
mat=bpy.data.materials.new('lag_spike_palette');mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.78
attr=mat.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='Color'
mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color'])
# Keep the palette matte and dark: glTF's uniform emissive factor would wash
# out the charcoal body. Cyan readability comes from its vertex base color;
# any dynamic glow/bloom belongs to the presentation layer.
bs.inputs['Emission Strength'].default_value=0
data.materials.append(mat)

arm=bpy.data.armatures.new('lag_spike_skeleton');rig=bpy.data.objects.new('lag_spike_rig',arm)
scene.collection.objects.link(rig);rig.parent=root
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,(pivot,parent) in bones.items():
    b=arm.edit_bones.new(name);b.head=pivot;b.tail=Vector(pivot)+Vector((0,0,.10))
    if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
obj.parent=rig;mod=obj.modifiers.new('rigid_skin','ARMATURE');mod.object=rig
for name,pos in [('anchor_ui',(0,0,1.70)),('anchor_target',(0,0,.80))]:
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=root;o.location=pos

def reset():
    for pb in rig.pose.bones:
        pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
def legs(phase,lift=.085):
    # Analytic two-link IK keeps feet flat, planted during stance, and above ground.
    # Foot is a rigid box; ankle height equals its rest pivot's ground clearance.
    for side,offset in [('l',0),('r',math.pi)]:
        a=phase+offset;dy=.115*math.cos(a);dz=.065+lift*max(0,math.sin(a))
        h=.565-dz;dist=min(.4999,math.hypot(dy,h));bend=math.acos(dist/.5)
        theta=math.atan2(dy,h)-bend
        rig.pose.bones['thigh_'+side].rotation_euler.x=theta
        rig.pose.bones['shin_'+side].rotation_euler.x=2*bend
        rig.pose.bones['foot_'+side].rotation_euler.x=-theta-2*bend
        # Slightly lower the hip to keep the full stance reach inside chain length.

def head_lag(frame,keys):
    """Piecewise offsets: deliberate holds and short catch-up corrections.

    Key tuples are (frame, upward metres, rearward metres).
    Local Y is Blender up and local Z is Blender forward. No lateral lag.
    """
    for a,b in zip(keys,keys[1:]):
        if a[0]<=frame<=b[0]:
            t=(frame-a[0])/(b[0]-a[0])
            up,back=[a[j]+(b[j]-a[j])*t for j in range(1,3)]
            head=rig.pose.bones['head']
            head.location=(0,up,-back)
            head.rotation_euler.y=0
            return

IDLE_HEAD=[
    (1,0,0),(14,0,0),
    (16,.035,.065),(21,.035,.065),
    (22,.025,.035),(23,.025,.035),
    (24,.012,-.008),(26,0,0),
    (49,0,0),
]
MOVE_HEAD=[
    (1,0,0),(4,0,0),
    (7,.055,.155),(11,.055,.155),
    (12,.038,.09),(13,.038,.09),
    (14,.016,-.025),(16,0,0),
    (19,0,0),(22,.045,.13),
    (26,.045,.13),
    (27,.030,.06),(28,.015,-.02),
    (30,0,0),(33,0,0),
]

for clip,length in [('idle',48),('move',32),('hit',12),('resolve',24)]:
    rig.animation_data_create();action=bpy.data.actions.new(clip);rig.animation_data.action=action
    for frame in range(1,length+2):
        reset();t=(frame-1)/length;body=rig.pose.bones['body']
        if clip=='idle':
            head_lag(frame,IDLE_HEAD)
        elif clip=='move':
            # Two short pose holds per cycle give a lagging, catch-up cadence.
            k=t*2;cycle=int(k);f=k-cycle
            warped=(f/.34*.42 if f<.34 else .42 if f<.48 else .42+(f-.48)/.38*.58 if f<.86 else 1)
            phase=(cycle+warped)*math.pi
            # Lower the body by 25 mm and solve against the lowered hip.
            body.location.y=-.025
            for side,offset in [('l',0),('r',math.pi)]:
                a=phase+offset;dy=.115*math.cos(a);dz=.065+.095*max(0,math.sin(a))
                h=.540-dz;dist=math.hypot(dy,h);bend=math.acos(min(.9999,dist/.5));theta=math.atan2(dy,h)-bend
                rig.pose.bones['thigh_'+side].rotation_euler.x=theta
                rig.pose.bones['shin_'+side].rotation_euler.x=2*bend
                rig.pose.bones['foot_'+side].rotation_euler.x=-theta-2*bend
                rig.pose.bones['arm_'+side].rotation_euler.x=-.55*math.cos(a)
                rig.pose.bones['forearm_'+side].rotation_euler.x=-.30-.25*max(0,math.cos(a))
            head_lag(frame,MOVE_HEAD)
            rig.pose.bones['head'].rotation_euler.x=.04
        elif clip=='hit':
            p=math.sin(math.pi*t)*(1-t)
            rig.pose.bones['head'].rotation_euler.x=-.27*p
            rig.pose.bones['head'].location.z=-.085*p
            for side in ('l','r'):rig.pose.bones['arm_'+side].rotation_euler.x=.40*p
        else:
            p=t*t*(3-2*t);body.scale=(1-.94*p,)*3;body.location.y=-.52*p
            rig.pose.bones['head'].location.y=.5*p;rig.pose.bones['head'].rotation_euler.z=.45*p
            for side,s in [('l',-1),('r',1)]:
                rig.pose.bones['arm_'+side].rotation_euler.z=s*.9*p
                rig.pose.bones['thigh_'+side].rotation_euler.z=s*.35*p
        for i in range(12):
            pb=rig.pose.bones['glitch_'+str(i)]
            if clip in ('idle','move'):
                lag=.5-.5*math.cos(math.tau*t*(2 if clip=='move' else 1)+i*1.7)
                # The leading cyan edge remains beside the character while the
                # afterimage stretches and catches up at staggered times.
                pb.location.z=-lag*(.012 if clip=='move' else .003)
                pb.scale.z=1+(.38 if clip=='move' else .07)*lag
            elif clip=='resolve':
                pb.location.x=(-1 if i%2==0 else 1)*.8*t
                pb.location.z=-.8*t;pb.scale=(1-t*.98,)*3
        for pb in rig.pose.bones:
            for prop in ('location','rotation_euler','scale'):pb.keyframe_insert(data_path=prop,frame=frame,group=pb.name)
    action.use_fake_user=True
    if clip in ('idle','move'):
        # Linear interpolation keeps held offsets exact and avoids Bezier
        # overshoot during the one/two-frame catch-up movements.
        for layer in action.layers:
            for action_strip in layer.strips:
                for channelbag in action_strip.channelbags:
                    for curve in channelbag.fcurves:
                        if 'pose.bones["head"]' in curve.data_path:
                            for key in curve.keyframe_points:key.interpolation='LINEAR'
    track=rig.animation_data.nla_tracks.new();track.name=clip
    strip=track.strips.new(clip,1,action);strip.name=clip;track.mute=True
rig.animation_data.action=None;reset();scene.frame_set(1);scene.frame_end=33
data.calc_loop_triangles();assert len(data.loop_triangles)<=CONTRACT['budgets']['triangles'],len(data.loop_triangles)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ['ASSET_SOURCE_NAME']))
print('LAG_SPIKE_STATS',json.dumps({'triangles':len(data.loop_triangles),'bones':len(arm.bones),'dimensions':list(obj.dimensions)}))

