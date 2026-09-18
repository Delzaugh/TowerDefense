"""Build Bug v01: original concept adaptation, single material/skin, metre scale.
Run with node tools/asset-pipeline/asset.mjs export problem_bug --build.
"""
from pathlib import Path
import bpy, math, json, bmesh, os
from mathutils import Vector

if not os.environ.get('ASSET_BUILD_DIR'):
    raise RuntimeError('Use node tools/asset-pipeline/asset.mjs export problem_bug --build; direct rebuilds bypass source protection.')
OUT = Path(os.environ['ASSET_BUILD_DIR'])
OUT.mkdir(parents=True, exist_ok=True)
CONTRACT=json.loads(Path(os.environ['ASSET_MANIFEST']).read_text(encoding='utf-8'))
# This script runs in a fresh background process; never edits the inspiration file.
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
scene.render.fps = 24

def linear(hexcolor):
    rgb = [int(hexcolor[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in rgb)+(1,)
COLORS = {k:linear(v.lstrip('#')) for k,v in CONTRACT['palette']['colors'].items()}
verts=[]; faces=[]; colors=[]; weights=[]; glows=[]; roles=[]
ROLE_IDS={name:i+1 for i,name in enumerate(COLORS)}
def mesh(vs, fs, color, bone='body', glow=0):
    start=len(verts); verts.extend(vs); weights.extend([bone]*len(vs))
    for i,f in enumerate(fs):
        role=color[i%len(color)] if isinstance(color,list) else color
        faces.append(tuple(start+j for j in f)); colors.append(COLORS[role]);glows.append(glow);roles.append(ROLE_IDS[role])

def ellipsoid(center, scale, color, bone='body', segments=12, rings=6):
    vs=[(center[0],center[1],center[2]+scale[2])]
    for j in range(1,rings):
        t=math.pi*j/rings
        for i in range(segments):
            a=2*math.pi*i/segments
            vs.append((center[0]+scale[0]*math.sin(t)*math.cos(a),center[1]+scale[1]*math.sin(t)*math.sin(a),center[2]+scale[2]*math.cos(t)))
    vs.append((center[0],center[1],center[2]-scale[2]));fs=[]
    for i in range(segments):fs.append((0,1+i,1+(i+1)%segments))
    for j in range(rings-2):
        for i in range(segments):
            a=1+j*segments+i;b=1+j*segments+(i+1)%segments;c=b+segments;d=a+segments
            fs.append((a,d,c,b))
    for i in range(segments):fs.append((len(vs)-1,1+(rings-2)*segments+(i+1)%segments,1+(rings-2)*segments+i))
    mesh(vs,fs,color,bone)

def beam(a,b,width,depth,color,bone='body',taper=.8,glow=0,lens=False,ground=False,bevel=False):
    a,b=Vector(a),Vector(b);z=(b-a).normalized();x=z.cross(Vector((0,0,1) if lens else (0,1,0)))
    if x.length<.01:x=z.cross(Vector((1,0,0)))
    x.normalize();y=z.cross(x).normalized()
    cross=[(-.32,-.5),(.32,-.5),(.5,-.32),(.5,.32),(.32,.5),(-.32,.5),(-.5,.32),(-.5,-.32)]
    rings=[(a,1),(b,taper)]
    if bevel:
        inset=min(.028,(b-a).length*.20)
        rings=[(a,.82),(a+z*inset,1),(b-z*inset,taper),(b,taper*.82)]
    vs=[tuple(p+x*u*width*s+y*v*depth*s) for p,s in rings for u,v in cross]
    end=(len(rings)-1)*8
    if ground:
        vs=[(v[0],v[1],max(0,v[2])) for v in vs]
        vs[end:]=[(v[0],v[1],0) for v in vs[end:]]
    fs=[tuple(reversed(range(8))),tuple(range(end,end+8))]+[(k*8+i,k*8+(i+1)%8,(k+1)*8+(i+1)%8,(k+1)*8+i) for k in range(len(rings)-1) for i in range(8)]
    mesh(vs,fs,color,bone,glow)

def layered_lens(center,normal,rings,ring_colors,bone,octagonal=False):
    """Concentric bevels use real geometry and the existing shared palette."""
    normal=Vector(normal).normalized();center=Vector(center)
    right=normal.cross(Vector((0,0,1))).normalized();up=right.cross(normal).normalized()
    cross=[(-.32,-.5),(.32,-.5),(.5,-.32),(.5,.32),(.32,.5),(-.32,.5),(-.5,.32),(-.5,-.32)] if not octagonal else [(math.cos(i*math.tau/8)*.5,math.sin(i*math.tau/8)*.5) for i in range(8)]
    vs=[tuple(center+normal*d+right*x*w+up*y*h) for d,w,h in rings for x,y in cross]
    fs=[tuple(reversed(range(8)))];cs=['edge']
    for k,color in enumerate(ring_colors):
        for i in range(8):fs.append((k*8+i,k*8+(i+1)%8,(k+1)*8+(i+1)%8,(k+1)*8+i));cs.append(color)
    fs.append(tuple(range(len(vs)-8,len(vs))));cs.append('red')
    mesh(vs,fs,cs,bone)

root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
root['asset']='problem_bug_v01';root['source_version']='v01'
root['forward']='+Z in glTF; -Y in Blender'
root['design']='Cobalt beetle; clear red eyes, antenna tips, dorsal seam and shoulder collars; aligned articulated legs'
root['revision']=CONTRACT['revision']

# One closed carapace: broad original facets, a supported irregular dorsal
# groove, integrated rolled edges and a continuous dark belly.
profiles=[(-.57,.36,1.00,.51,0),(-.37,.64,1.30,.48,0),(.02,.79,1.47,.47,.027),(.43,.76,1.42,.48,-.02),(.78,.53,1.18,.51,.018),(.97,.12,.80,.57,0)]
bottoms=[.430,.340,.260,.285,.365,.545]
vs=[];row_colors=None
for (y,w,top,low,jitter),bottom in zip(profiles,bottoms):
    # Traverse a whole cross-section clockwise from the red channel floor.
    # Each point's role describes the edge leading to the next point.
    right=[(.04,top,'shell')]
    for j in range(1,4):
        t=math.pi*.5*j/4
        right.append((.04+(w-.04)*math.sin(t),low+(top-low)*math.cos(t),'shell'))
    x3=.04+(w-.04)*math.sin(math.pi*3/8)
    right.extend([(x3*.18+w*.82+.004,low+(top-low)*math.cos(math.pi*3/8)*.18,'shell_dark'),
                  (w+.009,low+.006,'edge'),(w-.023,low-.035,'edge'),
                  (w*.70,bottom+.050,'edge'),(w*.35,bottom+.012,'edge')])
    row=[(-.026,top-.025,'red'),(.026,top-.025,'edge')]+right+[(0,bottom,'edge')]
    # Mirror the right section, including its material transitions.
    for i in reversed(range(len(right))):
        x,z,_=right[i]
        row.append((-x,z,right[i-1][2] if i else 'edge'))
    vs.extend([(jitter+x,y,z) for x,z,_ in row])
    row_colors=[role for x,z,role in row]
n=len(row_colors);fs=[];cs=[]
for k in range(len(profiles)-1):
    for j,role in enumerate(row_colors):
        a=k*n+j;b=(k+1)*n+j;c=(k+1)*n+(j+1)%n;d=k*n+(j+1)%n
        # Explicit diagonals retain predictable low-poly facets across rows.
        fs.extend([(a,b,c),(a,c,d)]);cs.extend([role,role])
fs.extend([tuple(reversed(range(n))),tuple(range((len(profiles)-1)*n,len(profiles)*n))])
cs.extend(['edge','edge'])
mesh(vs,fs,cs)
torso_vertex_count=len(verts)
# Check the actual authored topology before the separate articulated parts.
solid=bmesh.new();sv=[solid.verts.new(v) for v in vs]
for face in fs:solid.faces.new([sv[i] for i in face])
bmesh.ops.recalc_face_normals(solid,faces=list(solid.faces))
assert all(e.is_manifold for e in solid.edges),'Carapace must have no open edges'
assert solid.calc_volume()>0,'Carapace must enclose a positive volume'
print('CARAPACE_SOLID',json.dumps({'vertices':len(vs),'closed':True,'volume':solid.calc_volume(),'grooveDepth':.025,'grooveFloorWidth':.052}))
solid.free()
ellipsoid((0,-.66,.60),(.51,.40,.36),'face','head',segments=16,rings=8)

# Two oversized low-sided lens housings. No broad metallic or transparent surfaces.
for side in [-1,1]:
    center=Vector((side*.235,-.989,.665));normal=Vector((side*.23,-1,.1)).normalized()
    layered_lens(center,normal,[(.002,.231,.293),(.026,.235,.298),(.044,.180,.243),(.061,.153,.212)],['navy','edge','red_dark'],'head')

# Antennae are slightly mismatched as a readable, playful corruption cue.
antennae={}
for side,label in [(-1,'l'),(1,'r')]:
    a=(side*.26,-.73,.885);b=(side*.36,-.79,1.16);c=(side*(.48 if side<0 else .41),-.82,1.32 if side<0 else 1.27)
    bone='antenna_'+label;antennae[bone]=a
    ad=(Vector(b)-Vector(a)).normalized()
    beam(Vector(a)-ad*.055,Vector(a)+ad*.055,.148,.14,'shell_dark',bone,taper=.84)
    beam(a,b,.077,.084,'navy',bone,taper=.82)
    beam(b,c,.074,.08,'navy',bone,taper=.9)
    beam(c,tuple(Vector(c)+Vector((side*.025,-.016,.077))),.106,.11,'red',bone,taper=.8,glow=.25,bevel=True)

# Mount each shoulder inside the actual carapace boundary at its longitudinal row.
# The collar, upper link and bone share an axis; overlapping knee hubs close
# the differently angled upper/lower caps in both rest and animated poses.
def shoulder_x(y,side):
    for a,b in zip(profiles,profiles[1:]):
        if a[0]<=y<=b[0]:
            t=(y-a[0])/(b[0]-a[0]);w=a[1]*(1-t)+b[1]*t;j=a[4]*(1-t)+b[4]*t
            return j+side*(w-.045)
    raise ValueError('Shoulder row outside shell')
legs={}
joint_layout=[]
for side,label in [(-1,'l'),(1,'r')]:
    for i,(y,ky,fy) in enumerate([(-.42,-.67,-.84),(.10,.15,.20),(.62,.80,.92)]):
        hip=(shoulder_x(y,side),y,.50);knee=(side*.97,ky,.25);foot=(side*1.035,fy,.065)
        upper=f'leg_{label}{i+1}_upper';lower=f'leg_{label}{i+1}_lower';legs[upper]=(hip,knee,lower,foot)
        direction=(Vector(knee)-Vector(hip)).normalized()
        beam(Vector(hip)-direction*.065,Vector(hip)+direction*.15,.26,.24,'red',upper,taper=1,glow=.12)
        beam(Vector(hip)+direction*.105,Vector(knee)-direction*.035,.22,.20,['shell','shell_dark'],upper,taper=.80,bevel=True)
        ellipsoid(knee,(.145,.145,.145),'navy',lower,segments=8,rings=4)
        layered_lens(knee,(side,0,0),[(.117,.166,.166),(.147,.167,.167),(.154,.071,.071)],['shell_dark','navy'],lower,octagonal=True)
        lower_direction=(Vector(foot)-Vector(knee)).normalized()
        beam(Vector(knee)+lower_direction*.01,foot,.16,.185,'navy',lower,taper=1.18,ground=True,bevel=True)
        joint_layout.append({'leg':label+str(i+1),'hip':hip,'knee':knee,'collar_upper_overlap':.045,'knee_hub_radius':.145})

data=bpy.data.meshes.new('bug_mesh');data.from_pydata(verts,[],faces);data.update()
# Recalculate outward normals on the closed components.
bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
obj=bpy.data.objects.new('bug_body',data);scene.collection.objects.link(obj);obj.parent=root
obj['carapace_vertex_count']=torso_vertex_count
obj['carapace_construction']='One closed body, shared-vertex red groove floor and sidewalls, integrated rim and belly'
for name in sorted(set(weights)):
    g=obj.vertex_groups.new(name=name);g.add([i for i,w in enumerate(weights) if w==name],1,'REPLACE')
col=data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
role_attribute=data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
# Adding an attribute can invalidate an earlier RNA collection reference.
col=data.color_attributes['Color']
for p,c,role_id in zip(data.polygons,colors,roles):
    for li in p.loop_indices:
        col.data[li].color=c
        role_attribute.data[li].value=role_id
# Explicit semantic IDs survive vertex splitting; never infer palette roles from RGB.
obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':{name:value for name,value in ROLE_IDS.items() if value in roles}}
mat=bpy.data.materials.new('bug_palette');mat.use_nodes=True;nodes=mat.node_tree.nodes;bs=nodes.get('Principled BSDF')
bs.inputs['Roughness'].default_value=.72;bs.inputs['Metallic'].default_value=0
attr=nodes.new('ShaderNodeVertexColor');attr.layer_name='Color';mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color'])
# Vertex colors are portable, with a small uniform emission for clean phone-scale readability.
mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.08
obj.data.materials.append(mat)

arm=bpy.data.armatures.new('bug_skeleton');rig=bpy.data.objects.new('bug_rig',arm);scene.collection.objects.link(rig);rig.parent=root
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
def bone(name,head,tail,parent=None):
    b=arm.edit_bones.new(name);b.head=head;b.tail=tail
    if parent:b.parent=arm.edit_bones[parent]
bone('body',(0,0,.50),(0,0,.85))
bone('head',(0,-.56,.61),(0,-.78,.71),'body')
for name,a in antennae.items():bone(name,a,tuple(Vector(a)+Vector((0,0,.25))),'head')
for upper,(hip,knee,lower,foot) in legs.items():
    bone(upper,hip,knee,'body');bone(lower,knee,foot,upper)
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
mod=obj.modifiers.new('bug_skin','ARMATURE');mod.object=rig
obj.parent=rig
for name,pos in [('anchor_ui',(0,0,1.73)),('anchor_target',(0,0,.75))]:
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=root;o.location=pos;o.empty_display_size=.08

# In-place animation, one compact skeleton. Feet alternate in tripod groups.
for clip,length in [('move',24),('hit',10),('resolve',20)]:
    rig.animation_data_create();action=bpy.data.actions.new(clip);rig.animation_data.action=action
    for frame in range(1,length+2):
        t=(frame-1)/length
        for pb in rig.pose.bones:pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
        body=rig.pose.bones['body']
        if clip=='move':
            body.location.y=.015*(1-math.cos(t*math.tau*2));body.rotation_euler.y=.022*math.sin(t*math.tau)
            for upper,(hip,knee,lower,foot) in legs.items():
                phase=t*math.tau+(math.pi if (int(upper[5])-1+(upper[4]=='r'))%2 else 0)
                rig.pose.bones[upper].rotation_euler.y=.20*math.sin(phase)
                rig.pose.bones[upper].rotation_euler.x=.10*max(0,math.sin(phase))
                rig.pose.bones[lower].rotation_euler.x=-.16*max(0,math.sin(phase))
            for name in antennae:rig.pose.bones[name].rotation_euler.x=.065*math.sin(t*math.tau+(.5 if name.endswith('r') else 0))
        elif clip=='hit':
            p=math.sin(math.pi*t)*(1-t);body.rotation_euler.x=-.20*p;body.rotation_euler.y=.14*p
            body.location.y=.23*p
            rig.pose.bones['head'].rotation_euler.x=.16*p
        else:
            p=min(1,t*1.5);body.scale=(1-.85*p,)*3;body.location.y=-.37*p
            body.rotation_euler.y=.22*math.sin(math.pi*t)
            for upper,(hip,knee,lower,foot) in legs.items():rig.pose.bones[lower].rotation_euler.x=.65*p
        for pb in rig.pose.bones:
            for prop in ['location','rotation_euler','scale']:pb.keyframe_insert(data_path=prop,frame=frame,group=pb.name)
    action.use_fake_user=True
    track=rig.animation_data.nla_tracks.new();track.name=clip;strip=track.strips.new(clip,1,action);strip.name=clip;track.mute=True
rig.animation_data.action=None
for pb in rig.pose.bones:pb.rotation_euler=(0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
scene.frame_set(1);scene.frame_end=25
bpy.context.view_layer.update()
data.calc_loop_triangles()
stats={'asset':'problem_bug_v01','revision':'detail_pass_2500','triangle_budget':2500,'triangles':len(data.loop_triangles),'vertices':len(data.vertices),'materials':1,'meshes':1,'deform_bones':len(arm.bones),'dimensions_blender':list(obj.dimensions),'clips':['move','hit','resolve'],'source':CONTRACT['source']['path'],'runtime':CONTRACT['runtime'],'textures':0,'root_motion':False,'joints':joint_layout}
stats['revision']=CONTRACT['revision'];stats['triangle_budget']=CONTRACT['budgets']['triangles']
assert stats['triangles']<=CONTRACT['budgets']['triangles'],stats
bpy.ops.object.select_all(action='DESELECT')
for o in [root,*root.children_recursive]:o.select_set(True)
bpy.context.view_layer.objects.active=obj
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ['ASSET_SOURCE_NAME']))
rig.animation_data.action=None
for track in rig.animation_data.nla_tracks:track.mute=True
scene.frame_set(1)
for pb in rig.pose.bones:pb.rotation_euler=(0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
bpy.context.view_layer.update()
(OUT/'stats.json').write_text(json.dumps(stats,indent=2))
print('BUG_STATS',json.dumps(stats))

# Shared delivery tools own export, validation, evidence and runtime promotion.
raise SystemExit(0)
