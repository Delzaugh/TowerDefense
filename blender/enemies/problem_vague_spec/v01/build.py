"""Vague Spec: thick curled parchment, graphic question mark, compact rigid rig.
Run initial authoring with the pipeline environment; use guarded --build thereafter.
"""
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
def link(name,a,b,width,depth,role,bone,bevel=.008):
    a,b=Vector(a),Vector(b);delta=b-a
    box(name,(a+b)/2,(width,depth,delta.length),role,bone,bevel,Vector((0,0,1)).rotation_difference(delta.normalized()))
def graphic(name,x,z,w,h,role,y=-.068):
    start=len(verts)
    verts.extend([(x-w/2,y,z-h/2),(x+w/2,y,z-h/2),(x+w/2,y,z+h/2),(x-w/2,y,z+h/2)])
    faces.append(tuple(start+i for i in range(4)));roles.append(role);weights.extend(['paper']*4)
def bracket():
    # One continuous T-shaped yoke, clear of the front curl; no stacked blocks.
    profile=[(-.28,.325),(.28,.325),(.28,.378),(.060,.378),(.060,.495),(-.060,.495),(-.060,.378),(-.28,.378)]
    start=len(verts);n=len(profile)
    for y in (.025,.085):verts.extend([(x,y,z) for x,z in profile])
    weights.extend(['body']*(n*2))
    faces.extend([tuple(start+i for i in range(n)),tuple(start+n+i for i in reversed(range(n)))]);roles.extend(['boot','boot'])
    for i in range(n):
        faces.append((start+i,start+(i+1)%n,start+n+(i+1)%n,start+n+i));roles.append('boot')
def ribbon(name,path):
    # One closed thick strip, including real spiral end cross sections.
    start=len(verts)
    for i,(y,z) in enumerate(path):
        prev=Vector(path[max(0,i-1)]);nxt=Vector(path[min(len(path)-1,i+1)])
        tangent=(nxt-prev).normalized();normal=Vector((-tangent.y,tangent.x))*.010
        for x in (-.355,.355):
            for side in (-1,1):verts.append((x,y+normal.x*side,z+normal.y*side))
    weights.extend(['paper']*(4*len(path)))
    for i in range(len(path)-1):
        a=start+4*i;b=a+4
        for ids,role in [((a,b,b+2,a+2),'paper'),((a+1,a+3,b+3,b+1),'paper_shade'),((a,a+1,b+1,b),'edge'),((a+2,b+2,b+3,a+3),'edge')]:
            faces.append(ids);roles.append(role)
    faces.extend([(start,start+2,start+3,start+1),tuple(start+4*(len(path)-1)+j for j in (0,1,3,2))]);roles.extend(['edge','edge'])
    parts.append({'name':name,'bone':'paper','start':start,'count':len(path)*4})

root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
root['asset']='problem_vague_spec_v01';root['forward']='+Z glTF / -Y Blender'
# The central sheet remains broad and clean. Its curls are continuous with it.
bottom=[]
for i in range(19):
    t=i/18;theta=-math.tau*.86*t;r=.070-.045*t
    bottom.append((-.125+r*math.cos(theta),.445+r*math.sin(theta)))
top=[]
for i in range(23):
    t=i/22;theta=math.pi-math.tau*.88*t;r=.115-.074*t
    top.append((.060+r*math.cos(theta),1.375+r*math.sin(theta)))
ribbon('continuous_parchment',list(reversed(bottom))+[(-.055,.63),(-.055,.90),(-.055,1.16)]+top)
# Bold angular punctuation, solid shallow inlay; no external font or alpha decal.
outline=[(-.115,1.190),(-.115,1.246),(-.066,1.294),(.065,1.294),(.117,1.245),(.117,1.169),(.044,1.112),(.033,1.090),(.033,1.042),(-.031,1.042),(-.031,1.117),(-.007,1.145),(.050,1.190),(.050,1.220),(.025,1.243),(-.025,1.243),(-.051,1.219),(-.051,1.190)]
data=bpy.data.meshes.new('question_outline');data.from_pydata([(x,-.068,z) for x,z in outline],[],[tuple(range(len(outline)))]);data.update()
o=bpy.data.objects.new('question_mark',data);scene.collection.objects.link(o)
collect(o,'question_mark','ink','paper')
graphic('question_dot',0,.984,.065,.065,'ink')
# Quiet document-interface details: header chrome and three unfilled checklist rows.
graphic('header_rule',0,1.334,.49,.012,'line')
for i in range(3):graphic('header_dot',-.235+i*.029,1.351,.015,.012,'line')
graphic('pending_chip',.218,1.352,.065,.018,'accent')
for i,(length,z) in enumerate([(.365,.852),(.33,.767),(.22,.682)]):
    graphic('incomplete_text_'+str(i),-.167+length/2,z,length,.033,'line')
    for x,zz,w,h in [(-.239,z+.021,.046,.008),(-.239,z-.021,.046,.008),(-.258,z,.008,.034),(-.220,z,.008,.034)]:
        graphic('empty_checkbox',x,zz,w,h,'line')
graphic('footer_rule',0,.582,.49,.008,'line')
graphic('footer_label',-.183,.553,.125,.016,'line')
graphic('footer_pending',.218,.553,.065,.016,'accent')

bones={'body':((0,0,.35),None),'paper':((0,.055,.495),'body')}
bracket()
hinge('waist_pivot',(0,.055,.495),.042,.155,'body')
for s in (-1,1):hinge('waist_cap',(s*.0775,.055,.495),.025,.006,'body','limb_light')
box('rear_socket',(0,-.012,.551),(.18,.067,.156),'limb','paper',.007)
for s,side in [(-1,'l'),(1,'r')]:
    upper='arm_'+side;fore='forearm_'+side
    shoulder=Vector((s*.403,-.047,1.017));elbow=Vector((s*.503,-.033,.868));wrist=Vector((s*.542,-.058,.665))
    bones[upper]=(shoulder,'paper');bones[fore]=(elbow,upper)
    box('edge_socket',(s*.343,-.047,1.017),(.064,.067,.116),'limb_light','paper',.006)
    hinge('shoulder',shoulder,.040,.078,upper)
    hinge('shoulder_cap',shoulder+Vector((s*.039,0,0)),.024,.006,upper,'limb_light')
    u=(elbow-shoulder).normalized()
    link('upper_arm',shoulder+u*.030,elbow-u*.028,.067,.075,'joint',upper,.005)
    hinge('elbow',elbow,.044,.116,fore)
    direction=(wrist-elbow).normalized()
    link('cuff',elbow+direction*.025,elbow+direction*.095,.132,.132,'limb_light',fore,.008)
    link('forearm',elbow+direction*.090,wrist,.125,.137,'limb',fore,.008)
    link('mitten',wrist-direction*.020,wrist+direction*.05,.150,.155,'boot',fore,.006)
    rot=Vector((0,0,1)).rotation_difference(direction)
    panel=(elbow+wrist)/2+rot@Vector((0,-.072,-.014))
    box('forearm_inset',panel,(.065,.006,.088),'boot',fore,0,rot)
    box('forearm_marker',panel+rot@Vector((0,-.004,.025)),(.040,.003,.014),'accent',fore,0,rot)
    hip=(s*.228,.025,.345);knee=(s*.228,.025,.209);ankle=(s*.228,.025,.073)
    thigh='thigh_'+side;shin='shin_'+side;foot='foot_'+side
    bones[thigh]=(hip,'body');bones[shin]=(knee,thigh);bones[foot]=(ankle,shin)
    link('thigh',hip,knee,.105,.122,'joint',thigh,0)
    link('shin',knee,ankle,.127,.139,'limb',shin,.008)
    box('boot',(s*.228,-.022,.059),(.177,.235,.118),'boot',foot,.009)
    box('toe_panel',(s*.228,-.142,.063),(.114,.006,.035),'limb',foot,0)

data=bpy.data.meshes.new('vague_spec_mesh');data.from_pydata(verts,[],faces);data.update()
bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
obj=bpy.data.objects.new('vague_spec',data);scene.collection.objects.link(obj);obj['part_ranges']=json.dumps(parts)
for name in sorted(set(weights)):
    g=obj.vertex_groups.new(name=name);g.add([i for i,w in enumerate(weights) if w==name],1,'REPLACE')
data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
for p,role in zip(data.polygons,roles):
    for li in p.loop_indices:
        data.color_attributes['Color'].data[li].color=COLORS[role]
        data.attributes['_palette_role'].data[li].value=ROLE_IDS[role]
obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':ROLE_IDS}
mat=bpy.data.materials.new('parchment_palette');mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.85
attr=mat.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='Color';mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color'])
data.materials.append(mat)
arm=bpy.data.armatures.new('vague_spec_skeleton');rig=bpy.data.objects.new('vague_spec_rig',arm);scene.collection.objects.link(rig);rig.parent=root
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
for clip,length in [('idle',48),('move',32),('hit',16),('resolve',28)]:
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
                h=.345-.018-(.073+lift);bend=math.acos(min(.9999,math.hypot(dy,h)/.272));theta=math.atan2(dy,h)-bend
                rig.pose.bones['thigh_'+side].rotation_euler.x=theta
                rig.pose.bones['shin_'+side].rotation_euler.x=2*bend
                rig.pose.bones['foot_'+side].rotation_euler.x=-theta-2*bend
                rig.pose.bones['arm_'+side].rotation_euler.x=.35*math.cos(a)
                rig.pose.bones['forearm_'+side].rotation_euler.x=-.10-.12*math.cos(a)
        elif clip=='hit':
            pulse=math.sin(math.pi*t)*(1-t)
            paper.rotation_euler.x=-.28*pulse;paper.rotation_euler.z=.14*pulse
            for side in ('l','r'):rig.pose.bones['arm_'+side].rotation_euler.x=-.45*pulse
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
print('VAGUE_SPEC_STATS',json.dumps({'triangles':len(data.loop_triangles),'bones':len(arm.bones),'dimensions':list(obj.dimensions)}))
