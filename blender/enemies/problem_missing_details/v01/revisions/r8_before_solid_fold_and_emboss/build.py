"""Missing Details: folded note character. Shared pipeline owns guarded GLB delivery."""
import bpy, bmesh, math, json, os
from pathlib import Path
from mathutils import Vector

OUT=Path(os.environ['ASSET_BUILD_DIR'])
CONTRACT=json.loads(Path(os.environ['ASSET_MANIFEST']).read_text(encoding='utf-8-sig'))
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1;scene.render.fps=24
def linear(h):
    values=[int(h.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in values)+(1,)
COLORS={k:linear(v) for k,v in CONTRACT['palette']['colors'].items()}
ROLE_IDS={k:i+1 for i,k in enumerate(COLORS)}
verts=[];faces=[];roles=[];weights=[];parts=[]
def collect(o,name,role,bone):
    start=len(verts)
    verts.extend([tuple(o.matrix_world@v.co) for v in o.data.vertices]);weights.extend([bone]*len(o.data.vertices))
    for p in o.data.polygons:faces.append(tuple(start+i for i in p.vertices));roles.append(role)
    parts.append({'name':name,'bone':bone,'start':start,'count':len(o.data.vertices)})
    bpy.data.objects.remove(o,do_unlink=True)
def box(name,center,size,role,bone='paper',bevel=0,rotation=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=center)
    o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('soft_edge','BEVEL');mod.width=bevel;mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if rotation is not None:o.rotation_euler=rotation.to_euler()
    bpy.context.view_layer.update();collect(o,name,role,bone)
def hinge(name,center,radius,width,bone,role='joint'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=radius,depth=width,location=center,rotation=(0,math.pi/2,0))
    o=bpy.context.object;bpy.context.view_layer.update();collect(o,name,role,bone)

def ball_joint(name,center,radius,bone):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=radius,location=center)
    o=bpy.context.object;bpy.context.view_layer.update();collect(o,name,'joint',bone)
def link(name,a,b,width,depth,role,bone,bevel=.008):
    a,b=Vector(a),Vector(b);delta=b-a
    box(name,(a+b)/2,(width,depth,delta.length),role,bone,bevel,Vector((0,0,1)).rotation_difference(delta.normalized()))

def polygon(name,points,role,bone='paper'):
    start=len(verts);verts.extend(points);weights.extend([bone]*len(points))
    faces.append(tuple(start+i for i in range(len(points))));roles.append(role)
    parts.append({'name':name,'bone':bone,'start':start,'count':len(points)})

def prism(name,profile,front,back,role,bone='paper'):
    start=len(verts);n=len(profile)
    for y in (front,back):verts.extend([(x,y,z) for x,z in profile])
    weights.extend([bone]*(n*2))
    faces.extend([tuple(start+i for i in range(n)),tuple(start+n+i for i in reversed(range(n)))]);roles.extend([role,role])
    for i in range(n):
        faces.append((start+i,start+(i+1)%n,start+n+(i+1)%n,start+n+i));roles.append('paper_shade' if role=='paper' else role)
    parts.append({'name':name,'bone':bone,'start':start,'count':n*2})

root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
root['asset']='problem_missing_details_v01';root['forward']='+Z glTF / -Y Blender'
# Broad note with a cut top-right corner, and a real folded triangular flap.
profile=[(-.435,.355),(0,.335),(.435,.355),(.455,1.255),(.285,1.45),(-.445,1.45)]
note_front=len(faces)
prism('note_body',profile,-.10,.09,'paper')
# Open the front beneath the visor so the recessed eyes are real cavities.
# The note perimeter and visor perimeter have matching six-point winding.
visor_boundary=[(-.304,.505),(0,.477),(.304,.505),(.332,.735),(0,.655),(-.332,.735)]
hole_start=len(verts);verts.extend([(x,-.10,z) for x,z in visor_boundary]);weights.extend(['paper']*6)
parts[-1]['count']+=6
for i in range(6):
    quad=(i,(i+1)%6,hole_start+(i+1)%6,hole_start+i)
    if i==0:faces[note_front]=quad
    else:faces.append(quad);roles.append('paper')
    polygon('visor_edge',[(visor_boundary[i][0],-.10,visor_boundary[i][1]),(visor_boundary[(i+1)%6][0],-.10,visor_boundary[(i+1)%6][1]),(visor_boundary[(i+1)%6][0],-.106,visor_boundary[(i+1)%6][1]),(visor_boundary[i][0],-.106,visor_boundary[i][1])],'visor')
polygon('fold_face',[(.285,-.102,1.45),(.455,-.102,1.255),(.278,-.172,1.258)],'fold')
polygon('fold_thickness',[(.278,-.172,1.258),(.455,-.102,1.255),(.455,-.095,1.250),(.278,-.163,1.252)],'paper_shade')
polygon('fold_left',[(.285,-.102,1.45),(.278,-.172,1.258),(.278,-.163,1.252)],'paper_shade')
# The visor's V-shaped upper edge gives the reference its mischievous expression.
for s in (-1,1):
    # Each half of the visor is a ring around an actual eye opening.
    outer=[(s*.235,.671),(s*.132,.645),(s*.132,.525),(s*.235,.536)]
    inner=[(s*.214,.655),(s*.155,.640),(s*.155,.540),(s*.214,.547)]
    surround=[(s*.332,.735),(0,.655),(0,.477),(s*.304,.505)]
    for i in range(4):
        j=(i+1)%4
        polygon('visor',[(surround[i][0],-.106,surround[i][1]),(surround[j][0],-.106,surround[j][1]),(outer[j][0],-.106,outer[j][1]),(outer[i][0],-.106,outer[i][1])],'visor')
    # Mouth stays flush with the visor; walls and bevel lead 36 mm inward.
    start=len(verts)
    for outline,y in [(outer,-.106),(outer,-.090),(inner,-.070)]:
        verts.extend([(x,y,z) for x,z in outline])
    weights.extend(['paper']*12)
    for ring,role in [(0,'eye_edge'),(1,'eye')]:
        for i in range(4):
            a=start+ring*4+i;b=start+ring*4+(i+1)%4
            faces.append((a,b,b+4,a+4));roles.append(role)
    faces.append(tuple(start+8+i for i in range(4)));roles.append('eye_core')
    parts.append({'name':'recessed_eye','bone':'paper','start':start,'count':12})
# Convert bold font punctuation to editable geometry, with no runtime font dependency.
curve=bpy.data.curves.new('question_letter','FONT');curve.body='?';curve.size=1;curve.resolution_u=4
fontpath=Path('C:/Windows/Fonts/arialbd.ttf')
if fontpath.exists():curve.font=bpy.data.fonts.load(str(fontpath))
o=bpy.data.objects.new('question_mark',curve);scene.collection.objects.link(o)
bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH')
o=bpy.context.object;bpy.context.view_layer.update()
coords=[v.co.copy() for v in o.data.vertices];xmin=min(v.x for v in coords);xmax=max(v.x for v in coords);ymin=min(v.y for v in coords);ymax=max(v.y for v in coords)
for v in o.data.vertices:v.co=((v.co.x-(xmin+xmax)/2)*(.245/(xmax-xmin)),-.108,.86+(v.co.y-ymin)*(.355/(ymax-ymin)))
collect(o,'question_mark','ink','paper')
bones={'body':((0,0,.35),None),'paper':((0,0,.36),'body')}
# Individual narrow sockets connect inside the note. No broad bar crosses its hem.
for s,side in [(-1,'l'),(1,'r')]:
    upper='arm_'+side;fore='forearm_'+side
    shoulder=Vector((s*.530,0,.685));elbow=Vector((s*.563,-.007,.535));wrist=Vector((s*.581,-.024,.385))
    bones[upper]=(shoulder,'paper');bones[fore]=(elbow,upper)
    # One short axle enters the side of the upper-arm shell at its pivot.
    # The casing surrounds the pivot; there is no separate bar perched on top.
    hinge('shoulder_socket',(s*.477,0,.685),.024,.106,'paper')
    u=(elbow-shoulder).normalized();f=(wrist-elbow).normalized()
    link('upper_core',shoulder,elbow,.026,.028,'joint',upper,0)
    link('upper_arm',shoulder-u*.022,elbow-u*.034,.137,.156,'limb',upper,.025)
    # A single compact faceted ball replaces the intersecting angular hinge bars.
    ball_joint('elbow',elbow,.032,fore)
    link('fore_core',elbow,wrist,.026,.028,'joint',fore,0)
    link('forearm',elbow+f*.034,wrist+f*.028,.163,.178,'limb',fore,.027)
    hip=Vector((s*.268,.025,.318));knee=Vector((s*.268,.025,.1955));ankle=Vector((s*.268,.025,.073))
    thigh='thigh_'+side;shin='shin_'+side;foot='foot_'+side
    bones[thigh]=(hip,'body');bones[shin]=(knee,thigh);bones[foot]=(ankle,shin)
    box('hip_socket',(s*.268,.025,.350),(.048,.055,.064),'joint','body',.006)
    hinge('hip_pivot',hip,.025,.074,thigh)
    link('thigh_core',hip,knee,.039,.043,'joint',thigh,0)
    link('thigh',hip-Vector((0,0,.023)),knee+Vector((0,0,.020)),.097,.113,'limb_shade',thigh,.012)
    hinge('knee',knee,.021,.080,shin,'limb_shade')
    link('shin_core',knee,ankle,.039,.043,'joint',shin,0)
    link('shin',knee-Vector((0,0,.020)),ankle+Vector((0,0,.010)),.112,.133,'limb',shin,.017)
    box('foot',(s*.268,-.038,.059),(.196,.263,.118),'limb',foot,.024)

data=bpy.data.meshes.new('missing_details_mesh');data.from_pydata(verts,[],faces);data.update()
bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
obj=bpy.data.objects.new('missing_details',data);scene.collection.objects.link(obj);obj['part_ranges']=json.dumps(parts)
for name in sorted(set(weights)):
    g=obj.vertex_groups.new(name=name);g.add([i for i,w in enumerate(weights) if w==name],1,'REPLACE')
data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
for p,role in zip(data.polygons,roles):
    for li in p.loop_indices:
        data.color_attributes['Color'].data[li].color=COLORS[role]
        data.attributes['_palette_role'].data[li].value=ROLE_IDS[role]
obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':ROLE_IDS}
mat=bpy.data.materials.new('note_palette');mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.85
attr=mat.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='Color';mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color'])

# One embedded 16px emission mask. Red eye roles use the lit texel; all other
# faces sample black. Semantic colors stay in vertex Color for inspector edits.
uv=data.uv_layers.new(name='EmissionUV')
for p,role in zip(data.polygons,roles):
    for li in p.loop_indices:uv.data[li].uv=(.75,.5) if role in ('eye','eye_core') else (.25,.5)
im=bpy.data.images.new('eye_emission_mask',width=16,height=16,alpha=False)
pixels=[]
for y in range(16):
    for x in range(16):pixels.extend((1,.04,.09,1) if x>=8 else (0,0,0,1))
im.pixels=pixels;im.pack()
tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;tex.interpolation='Closest'
mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.7
data.materials.append(mat)

arm=bpy.data.armatures.new('missing_details_skeleton');rig=bpy.data.objects.new('missing_details_rig',arm);scene.collection.objects.link(rig);rig.parent=root
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,(pivot,parent) in bones.items():
    b=arm.edit_bones.new(name);b.head=pivot;b.tail=Vector(pivot)+Vector((0,0,.10))
    if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
obj.parent=rig;mod=obj.modifiers.new('rigid_skin','ARMATURE');mod.object=rig
for name,pos in [('anchor_ui',(0,0,1.66)),('anchor_target',(0,0,.94))]:
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=root;o.location=pos
def reset():
    for pb in rig.pose.bones:
        pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
for clip,length in [('idle',48),('move',32),('hit',16),('resolve',28),('sit_down',48),('seated',24)]:
    rig.animation_data_create();action=bpy.data.actions.new(clip);rig.animation_data.action=action
    for frame in range(1,length+2):
        reset();t=(frame-1)/length;p=math.sin(math.tau*t);body=rig.pose.bones['body'];paper=rig.pose.bones['paper']
        if clip=='idle':
            paper.rotation_euler.z=.024*p
            paper.rotation_euler.x=.015*math.sin(math.tau*t)
            for side,s in [('l',-1),('r',1)]:
                rig.pose.bones['arm_'+side].rotation_euler.y=s*.05*p
                rig.pose.bones['forearm_'+side].rotation_euler.x=.06*p
        elif clip=='move':
            body.location.y=-.018
            paper.rotation_euler.z=.035*p
            for side,offset in [('l',0),('r',math.pi)]:
                a=math.tau*t+offset
                # Constant-speed stance and sinusoidal swing; flat soles via 2-link IK.
                u=(t+offset/math.tau)%1
                if u<.5:dy=-.065+.260*u;lift=0
                else:dy=.065-.260*(u-.5);lift=.065*math.sin(math.tau*(u-.5))
                h=.318-.018-(.073+lift);bend=math.acos(min(.9999,math.hypot(dy,h)/.245));theta=math.atan2(dy,h)-bend
                rig.pose.bones['thigh_'+side].rotation_euler.x=theta
                rig.pose.bones['shin_'+side].rotation_euler.x=2*bend
                rig.pose.bones['foot_'+side].rotation_euler.x=-theta-2*bend
                rig.pose.bones['arm_'+side].rotation_euler.x=.35*math.cos(a)
                rig.pose.bones['forearm_'+side].rotation_euler.x=-.10-.12*math.cos(a)
        elif clip=='hit':
            pulse=math.sin(math.pi*t)*(1-t)
            paper.rotation_euler.x=-.28*pulse;paper.rotation_euler.z=.14*pulse
            for side in ('l','r'):rig.pose.bones['arm_'+side].rotation_euler.x=-.45*pulse
        elif clip in ('sit_down','seated'):
            # Low long-sit: thigh undersides and both soles support the held pose.
            # Ease to the seat over 1.5 seconds, then hold for half a second.
            u=min(1,t/.75) if clip=='sit_down' else 1
            ease=u*u*(3-2*u)
            hip_z=.318-(.318-.0485)*ease
            body.location.y=hip_z-.318
            # A small lift within the existing hip sockets clears the note hem.
            paper.location.y=.035*ease
            paper.rotation_euler.x=math.radians(3)*ease
            # Knee-forward IK: slide the flat feet out as the short legs unfold.
            h=hip_z-.073
            theta=-math.pi*.5*ease
            lower=-math.acos(max(-1,min(1,h/.1225-math.cos(theta))))
            for side in ('l','r'):
                rig.pose.bones['thigh_'+side].rotation_euler.x=theta
                rig.pose.bones['shin_'+side].rotation_euler.x=lower-theta
                rig.pose.bones['foot_'+side].rotation_euler.x=-lower
        else:
            ease=t*t*(3-2*t);scale=1-.94*ease
            body.scale=(scale,)*3
            # Collapse visually at the feet while preserving stationary root.
            body.location.y=-.35*(1-scale)
            paper.rotation_euler.z=.32*math.sin(math.pi*t)
            for side,s in [('l',-1),('r',1)]:rig.pose.bones['arm_'+side].rotation_euler.y=s*.7*ease
        for pb in rig.pose.bones:
            for prop in ('location','rotation_euler','scale'):pb.keyframe_insert(data_path=prop,frame=frame,group=pb.name)
    action.use_fake_user=True
    track=rig.animation_data.nla_tracks.new();track.name=clip;strip=track.strips.new(clip,1,action);strip.name=clip;track.mute=True
rig.animation_data.action=None;reset();scene.frame_set(1);scene.frame_end=49
data.calc_loop_triangles();assert len(data.loop_triangles)<=CONTRACT['budgets']['triangles'],len(data.loop_triangles)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ['ASSET_SOURCE_NAME']))
print('MISSING_DETAILS_STATS',json.dumps({'triangles':len(data.loop_triangles),'bones':len(arm.bones),'dimensions':list(obj.dimensions)}))
