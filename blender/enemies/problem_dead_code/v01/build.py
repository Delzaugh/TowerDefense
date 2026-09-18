"""Dead Code: rigid marker, true recessed panels, continuous beveled icons.
Initial authoring writes a source once; later builds use guarded --build.
"""
import bpy, bmesh, math, json, os
from pathlib import Path
OUT=Path(os.environ['ASSET_BUILD_DIR'])
M=json.loads(Path(os.environ['ASSET_MANIFEST']).read_text(encoding='utf-8-sig'))
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1;scene.render.fps=24
def linear(h):
    v=[int(h.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in v)+(1,)
colors={k:linear(v) for k,v in M['palette']['colors'].items()}
ids={k:i+1 for i,k in enumerate(colors)}
verts=[];faces=[];roles=[];parts=[]
def activate(o):
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
def normals(mesh):
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free();mesh.update()
def prism(name,outline,front,back,bevel=0):
    n=len(outline);vv=[(x,y,z) for y in (front,back) for x,z in outline]
    ff=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    ff += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vv,[],ff);normals(mesh)
    o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);activate(o)
    if bevel:
        mod=o.modifiers.new('single_step_chamfer','BEVEL');mod.width=bevel;mod.segments=1;bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def cut(o,cutter):
    activate(o);mod=o.modifiers.new('true_recess','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True);normals(o.data)
def collect(o,role,face_role=None):
    start=len(verts);verts.extend(tuple(v.co) for v in o.data.vertices)
    for p in o.data.polygons:
        faces.append(tuple(start+i for i in p.vertices));roles.append(face_role(p) if face_role else role)
    parts.append({'name':o.name,'start':start,'count':len(o.data.vertices)})
    bpy.data.objects.remove(o,do_unlink=True)
root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
root['asset']='problem_dead_code_v01';root['forward']='+Z glTF / -Y Blender'
# Tapered chamfered plinth, with the marker deeply seated into it.
base=prism('beveled_plinth',[(-.58,0),(.58,0),(.555,.18),(.505,.22),(-.505,.22),(-.555,.18)],-.25,.25,.017)
minz=min(v.co.z for v in base.data.vertices)
for v in base.data.vertices:v.co.z-=minz
collect(base,'shell',lambda p:'bevel' if p.normal.z>.5 else 'shell')
outline=[(-.50,.165),(.50,.165),(.455,1.13),(.365,1.205),(.265,1.40),(.215,1.45),(-.215,1.45),(-.265,1.40),(-.365,1.205),(-.455,1.13)]
body=prism('marker_shell',outline,-.16,.16,.035)
top=max(v.co.z for v in body.data.vertices)
for v in body.data.vertices:
    if v.co.z>1.30:v.co.z+=1.45-top
slot=[(-.295,.25),(.295,.25),(.315,.27),(.315,.365),(.295,.385),(-.295,.385),(-.315,.365),(-.315,.27)]
cut(body,prism('front_slot_cutter',slot,-.22,-.125,.008))
rear=[(-.255,.43),(.255,.43),(.295,.48),(.278,1.025),(.215,1.09),(-.215,1.09),(-.278,1.025),(-.295,.48)]
cut(body,prism('rear_panel_cutter',rear,.117,.22,.012))
def body_role(p):
    c=p.center
    if .245<c.z<.39 and abs(c.x)<.322 and c.y<-.12:return 'recess'
    # Test the complete face footprint, so the surrounding shell ngon cannot
    # inherit the inset color simply because its centroid lies in the opening.
    in_panel=all(abs(body.data.vertices[i].co.x)<.3001 and .425<body.data.vertices[i].co.z<1.095 for i in p.vertices)
    if in_panel and c.y>.112:return 'rear_inset'
    if p.normal.z>.25 and abs(p.normal.y)<.95:return 'bevel'
    return 'shell'
collect(body,'shell',body_role)
# One closed curly-brace outline, mirrored with consistent stroke and depth.
brace=[(.108,.250),(.026,.250),(-.020,.213),(-.020,.090),(-.070,.052),(-.070,-.018),(-.020,-.057),(-.020,-.207),(.025,-.250),(.108,-.250),(.108,-.174),(.065,-.160),(.065,-.026),(.022,.018),(.065,.061),(.065,.168),(.108,.182)]
for sign,name in [(-1,'brace_left'),(1,'brace_right')]:
    points=[(sign*(.335-x),.805+z) for x,z in brace]
    collect(prism(name,points,-.213,-.153,.010),'brace')
# One X outline avoids a center seam or overlap from crossed bars.
a,b,c=.178,.112,.066
cross=[(-a,-b),(-b,-a),(0,-c),(b,-a),(a,-b),(c,0),(a,b),(b,a),(0,c),(-b,a),(-a,b),(-c,0)]
collect(prism('continuous_cross',[(x,.805+z) for x,z in cross],-.222,-.153,.011),'cross')
# Gentle rearward rake continues through the slab and attached art.
for i,(x,y,z) in enumerate(verts):
    if i>=parts[0]['count']:verts[i]=(x,y+.050*max(0,z-.20),z)
mesh=bpy.data.meshes.new('dead_code_mesh');mesh.from_pydata(verts,[],faces);mesh.update();normals(mesh)
obj=bpy.data.objects.new('dead_code',mesh);scene.collection.objects.link(obj);obj['part_ranges']=json.dumps(parts)
mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER');mesh.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
for p,role in zip(mesh.polygons,roles):
    for li in p.loop_indices:
        mesh.color_attributes['Color'].data[li].color=colors[role];mesh.attributes['_palette_role'].data[li].value=ids[role]
obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':ids}
mat=bpy.data.materials.new('dead_code_palette');mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.86
attr=mat.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='Color';mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color']);mesh.materials.append(mat)
arm=bpy.data.armatures.new('dead_code_skeleton');rig=bpy.data.objects.new('dead_code_rig',arm);scene.collection.objects.link(rig);rig.parent=root
activate(rig);bpy.ops.object.mode_set(mode='EDIT');bone=arm.edit_bones.new('marker');bone.head=(0,0,0);bone.tail=(0,0,.35);bpy.ops.object.mode_set(mode='OBJECT')
group=obj.vertex_groups.new(name='marker');group.add(list(range(len(mesh.vertices))),1,'REPLACE')
obj.parent=rig;mod=obj.modifiers.new('rigid_skin','ARMATURE');mod.object=rig
for name,pos in [('anchor_ui',(0,0,1.62)),('anchor_target',(0,0,.805))]:
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=root;o.location=pos
pb=rig.pose.bones['marker'];pb.rotation_mode='XYZ';rest_inverse=arm.bones['marker'].matrix_local.inverted()
def reset():
    pb.location=(0,0,0);pb.rotation_euler=(0,0,0);pb.scale=(1,1,1)
for clip,length in [('idle',48),('move',36),('hit',18),('resolve',30)]:
    rig.animation_data_create();action=bpy.data.actions.new(clip);rig.animation_data.action=action
    for f in range(length+1):
        reset();t=f/length;wave=math.sin(math.tau*t);lift=0
        if clip=='idle':pb.rotation_euler.z=.006*wave
        elif clip=='move':
            # Continuous hover: never return to ground during the moving loop.
            pb.rotation_euler.z=.008*wave
            lift=.18+.022*wave
        elif clip=='hit':
            pulse=math.sin(3*math.pi*t)*(1-t)**2;pb.rotation_euler.x=-.16*pulse;pb.rotation_euler.z=.075*pulse
        else:
            ease=t*t*(3-2*t);pb.scale=(1-.965*ease,)*3;pb.rotation_euler.z=.20*math.sin(math.pi*t);pb.rotation_euler.x=-.09*math.sin(math.pi*t)
        bpy.context.view_layer.update();deform=pb.matrix@rest_inverse
        min_z=min((deform@v.co).z for v in mesh.vertices)
        # Bone local Y is Blender vertical Z. Ground support is exact at frames.
        pb.location.y=lift-min_z
        for prop in ('location','rotation_euler','scale'):pb.keyframe_insert(data_path=prop,frame=f if clip=='move' else f+1,group='marker')
    action.use_fake_user=True;track=rig.animation_data.nla_tracks.new();track.name=clip;strip=track.strips.new(clip,0 if clip=='move' else 1,action);strip.name=clip;track.mute=True
rig.animation_data.action=None;reset();scene.frame_set(0);scene.frame_end=49;bpy.context.view_layer.update()
mesh.calc_loop_triangles();assert len(mesh.loop_triangles)<=M['budgets']['triangles'],len(mesh.loop_triangles)
bm=bmesh.new();bm.from_mesh(mesh);assert all(e.is_manifold for e in bm.edges),'Closed solids must have manifold edges';bm.free()
activate(obj);bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ['ASSET_SOURCE_NAME']))
print('DEAD_CODE_STATS',json.dumps({'triangles':len(mesh.loop_triangles),'vertices':len(mesh.vertices),'bones':1,'dimensions_blender':list(obj.dimensions)}))
