"""Spaghetti Code: six chaotic curved strands with a readable warning badge.
Editable production recipe; the shared guarded pipeline owns runtime export.
"""
import bpy, bmesh, math, json, os, numpy as np
from pathlib import Path
from mathutils import Vector, Matrix

OUT=Path(os.environ['ASSET_BUILD_DIR'])
M=json.loads(Path(os.environ['ASSET_MANIFEST']).read_text(encoding='utf-8-sig'))
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1;scene.render.fps=24
def linear(h):
    c=[int(h.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c)+(1,)
colors={k:linear(v) for k,v in M['palette']['colors'].items()}
ids={k:i+1 for i,k in enumerate(colors)}
verts=[];faces=[];roles=[];parts=[];paths=[];path_roles=[]
turn=Matrix.Rotation(math.radians(-22),3,'Y')@Matrix.Rotation(math.radians(32),3,'Z')@Matrix.Rotation(math.radians(22),3,'X')
def scramble(v,axis,offset):
    x,y,z=.90*(turn@v)
    a=.70*math.sin(3.8*z+offset*1.5+axis*.09)
    x,y=x*math.cos(a)-y*math.sin(a),x*math.sin(a)+y*math.cos(a)
    b=.65*math.sin(4.2*x+.65+axis*.12-offset)
    y,z=y*math.cos(b)-z*math.sin(b),y*math.sin(b)+z*math.cos(b)
    z+=.055*math.sin(6*x+3*y-.4)
    return Vector((x,y,z))

def strand(role,axis,offset):
    count=24
    # Rounded rectangular wraps surround the other two bundles; circular rings
    # would collide at the inner corners. Resample for even polygon spacing.
    def raw(t):
        c=math.cos(t);s=math.sin(t)
        a=.58*math.copysign(abs(c)**.5,c);b=.34*math.copysign(abs(s)**.5,s)
        if axis==0:return Vector((a,b,offset))
        if axis==1:return Vector((b,offset,a))
        return Vector((offset,a,b))
    dense=[scramble(raw(math.tau*i/2400),axis,offset) for i in range(2401)]
    lengths=[0.0]
    for a,b in zip(dense,dense[1:]):lengths.append(lengths[-1]+(b-a).length)
    points=[];k=0
    for i in range(count):
        distance=lengths[-1]*i/count
        while lengths[k+1]<distance:k+=1
        points.append(dense[k].lerp(dense[k+1],(distance-lengths[k])/(lengths[k+1]-lengths[k])))
    paths.append(points);path_roles.append(role)

def sweep(role,points,number):
    start=len(verts);count=len(points)
    # Re-sweep the final curve with a regular closed octagonal section.
    for i in range(count):
        p=points[i];tangent=(points[(i+1)%count]-points[(i-1)%count]).normalized()
        radial=p.normalized()
        u=(radial-tangent*radial.dot(tangent)).normalized();v=tangent.cross(u)
        for j in range(8):
            a=math.tau*j/8+math.pi/8
            verts.append(tuple(p+.0918*(u*math.cos(a)+v*math.sin(a))))
    for i in range(count):
        for j in range(8):
            faces.append((start+8*i+j,start+8*((i+1)%count)+j,start+8*((i+1)%count)+(j+1)%8,start+8*i+(j+1)%8));roles.append(role)
    parts.append({'name':role+'_woven_loop_'+str(number),'start':start,'count':count*8})

for axis,palette in [(0,('teal','lime')),(1,('lime','teal')),(2,('lime','teal'))]:
    for offset,role in zip((-.115,.115),palette):strand(role,axis,offset)

# Relax densely sampled strand contacts, keeping every path closed and smooth.
# Corrections are distributed to the actual authoring points, so the shipped
# polygonal sweep (rather than a higher-resolution proxy) gets the clearance.
pos=np.array(paths,dtype=float);target=pos.copy();n=pos.shape[1]
idx=np.arange(n*6);loopids=np.repeat(np.arange(6),n)
nextidx=(idx//n)*n+(idx+1)%n
fractions=np.tile(np.arange(4)/4,len(idx))
left=np.repeat(idx,4);right=np.repeat(nextidx,4)
sl=np.repeat(loopids,4)
sampleidx=np.tile(np.arange(n*4),6)
cyclic=np.minimum(abs(sampleidx[:,None]-sampleidx[None,:]),n*4-abs(sampleidx[:,None]-sampleidx[None,:]))
mask=(sl[:,None]!=sl[None,:]) | (cyclic>12)
for iteration in range(260):
    flat=pos.reshape((-1,3))
    samples=flat[left]*(1-fractions[:,None])+flat[right]*fractions[:,None]
    diff=samples[:,None,:]-samples[None,:,:]
    distance=np.linalg.norm(diff,axis=2)
    overlap=np.where(mask,np.maximum(.207-distance,0),0)
    force=(diff*(overlap/np.maximum(distance,1e-8))[:,:,None]).sum(axis=1)
    contacts=np.maximum((overlap>0).sum(axis=1),1)
    force=force/contacts[:,None]
    update=np.zeros_like(flat);weight=np.zeros(len(flat))
    np.add.at(update,left,force*(1-fractions[:,None]));np.add.at(update,right,force*fractions[:,None])
    np.add.at(weight,left,1-fractions);np.add.at(weight,right,fractions)
    pos+=.75*(update/weight[:,None]).reshape(pos.shape)
    if iteration<180:
        pos+=.018*(np.roll(pos,1,axis=1)+np.roll(pos,-1,axis=1)-2*pos)
        pos+=.0005*(target-pos)
print('CENTERLINE_CLEARANCE',float(distance[mask].min()))
for i,(points,role) in enumerate(zip(pos,path_roles)):sweep(role,[Vector(p) for p in points],i)
floor=min(v[2] for v in verts)
verts[:]=[(x,y,z-floor) for x,y,z in verts]
height=max(v[2] for v in verts)

# Badge mounted at the front and tilted upward for the isometric camera.
badge_center=Vector((0,min(v[1] for v in verts)-.025,height*.56))
badge_up=Vector((0,.30,.954)).normalized()
badge_out=Vector((0,-.954,.30)).normalized()
# The housing is tilted, so a frontmost-Y offset alone let its upper/back
# corners cut through strands. Separate the entire rear plane from the
# weave along the actual badge normal, with 20 mm of authored clearance.
badge_shift=max(Vector(v).dot(badge_out) for v in verts)+.073+.020-badge_center.dot(badge_out)
badge_center+=badge_out*badge_shift
def badgepoint(x,z,depth):
    return tuple(badge_center+Vector((x,0,0))+badge_up*z+badge_out*depth)
def solid_profile(name,outline,back,front,role):
    start=len(verts);n=len(outline)
    for d in (back,front):verts.extend(badgepoint(x,z,d) for x,z in outline)
    faces.extend([tuple(start+i for i in reversed(range(n))),tuple(start+n+i for i in range(n))]);roles.extend([role]*2)
    for i in range(n):faces.append((start+i,start+(i+1)%n,start+n+(i+1)%n,start+n+i));roles.append(role)
    parts.append({'name':name,'start':start,'count':2*n})

# A chamfered diamond, constructed as one continuous closed housing.
outline=[(-.022,-.219),(.022,-.219),(.219,-.022),(.219,.022),(.022,.219),(-.022,.219),(-.219,.022),(-.219,-.022)]
start=len(verts);n=len(outline)
for depth,scale in [(-.073,.91),(-.055,1),(.008,1),(.021,.91)]:
    verts.extend(badgepoint(x*scale,z*scale,depth) for x,z in outline)
faces.append(tuple(start+i for i in reversed(range(n))));roles.append('orange_edge')
for layer in range(3):
    for i in range(n):
        a=start+layer*n+i;b=start+layer*n+(i+1)%n
        faces.append((a,b,b+n,a+n));roles.append('orange' if layer==2 else 'orange_edge')
faces.append(tuple(start+3*n+i for i in range(n)));roles.append('orange')
parts.append({'name':'warning_diamond','start':start,'count':n*4})
# Punctuation is shallow closed geometry seated on the plate, with clear spacing.
solid_profile('exclamation_stem',[(-.023,-.033),(.023,-.033),(.035,.117),(.021,.134),(-.021,.134),(-.035,.117)],.020,.030,'ink')
solid_profile('exclamation_dot',[(.032*math.cos(math.tau*i/8),-.096+.032*math.sin(math.tau*i/8)) for i in range(8)],.020,.031,'ink')
# Short rear mounting boss penetrates the host strand inside the housing.
solid_profile('badge_mount',[(-.065,-.05),(.065,-.05),(.065,.05),(-.065,.05)],-.265-badge_shift,-.069,'orange_edge')

mesh=bpy.data.meshes.new('spaghetti_code_mesh');mesh.from_pydata(verts,[],faces);mesh.update()
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
obj=bpy.data.objects.new('spaghetti_code',mesh);scene.collection.objects.link(obj)
obj['part_ranges']=json.dumps(parts)
mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
mesh.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
for p,role in zip(mesh.polygons,roles):
    p.use_smooth=False
    for i in p.loop_indices:
        mesh.color_attributes['Color'].data[i].color=colors[role]
        mesh.attributes['_palette_role'].data[i].value=ids[role]
obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':ids}
mat=bpy.data.materials.new('spaghetti_matte_palette');mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.82
attr=mat.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='Color';mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color'])
mesh.materials.append(mat)
root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
root['asset']='problem_spaghetti_code_v01';root['forward']='+Z glTF / -Y Blender'
arm=bpy.data.armatures.new('spaghetti_skeleton');rig=bpy.data.objects.new('spaghetti_rig',arm);scene.collection.objects.link(rig);rig.parent=root
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
b=arm.edit_bones.new('knot');b.head=(0,0,0);b.tail=(0,0,.15)
bpy.ops.object.mode_set(mode='OBJECT')
obj.parent=rig;mod=obj.modifiers.new('knot_skin','ARMATURE');mod.object=rig
group=obj.vertex_groups.new(name='knot');group.add(list(range(len(verts))),1,'REPLACE')
for name,pos in [('anchor_ui',(0,0,height+.20)),('anchor_target',(0,0,height*.55))]:
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=root;o.location=pos
pb=rig.pose.bones['knot'];pb.rotation_mode='XYZ'
def reset():pb.location=(0,0,0);pb.rotation_euler=(0,0,0);pb.scale=(1,1,1)
def ground_pose():
    # Keep the woven body's lowest evaluated vertex on the road at every key.
    rot=pb.rotation_euler.to_matrix();s=pb.scale
    low=min((rot@Vector((x*s.x,y*s.y,z*s.z))).z for x,y,z in verts)
    # Bone local +Y is Blender world +Z.
    pb.location.y=-low
for clip,length in [('idle',48),('move',32),('hit',16),('resolve',28)]:
    rig.animation_data_create();action=bpy.data.actions.new(clip);rig.animation_data.action=action
    for f in range(1,length+2):
        reset();t=(f-1)/length;p=math.sin(math.tau*t)
        if clip=='idle':
            pb.scale=(1+.009*p,1-.009*p,1+.009*p)
        elif clip=='move':
            # Grounded squirm: the knot compresses and leans, badge remains forward.
            pb.rotation_euler.z=.065*p
            pb.rotation_euler.x=.045*math.sin(math.tau*t*2)
            pb.scale=(1+.027*p,1-.045*p,1+.020*p)
        elif clip=='hit':
            pulse=math.sin(math.pi*t)*(1-t)
            pb.rotation_euler.x=-.23*pulse;pb.rotation_euler.z=.13*pulse
            pb.scale=(1+.12*pulse,1-.15*pulse,1+.09*pulse)
        else:
            ease=t*t*(3-2*t);s=1-.94*ease
            pb.scale=(s,s,s);pb.rotation_euler.y=.65*ease
        # Use the actual bone basis for contact compensation.
        basis=arm.bones['knot'].matrix_local.to_3x3()
        deform=basis@pb.rotation_euler.to_matrix()@Matrix.Diagonal(pb.scale)@basis.inverted()
        low=min((deform@Vector(v)).z for v in verts)
        pb.location.y=-low
        for prop in ('location','rotation_euler','scale'):pb.keyframe_insert(data_path=prop,frame=f,group='knot')
    action.use_fake_user=True
    track=rig.animation_data.nla_tracks.new();track.name=clip
    strip=track.strips.new(clip,1,action);strip.name=clip;track.mute=True
rig.animation_data.action=None;reset();scene.frame_set(1);scene.frame_end=49
mesh.calc_loop_triangles();assert len(mesh.loop_triangles)<=M['budgets']['triangles'],len(mesh.loop_triangles)
# Authoring diagnostics: every solid has closed edges; counts are actual mesh stats.
bm=bmesh.new();bm.from_mesh(mesh)
assert all(e.is_manifold for e in bm.edges),'Open edge in a closed component'
bm.free()
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ['ASSET_SOURCE_NAME']))
print('SPAGHETTI_STATS',json.dumps({'triangles':len(mesh.loop_triangles),'vertices':len(mesh.vertices),'height':height,'bones':len(arm.bones),'dimensions':list(obj.dimensions)}))
