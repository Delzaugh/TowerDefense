"""Reference-led, smooth Octocats with explicit five-appendage anatomy.
Source construction paths remain outside root. The pipeline owns export.
"""
import bpy, bmesh, math, os, json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
STYLE=globals().get('OCTOCAT_STYLE','modern');MODERN=STYLE=='modern'
PROJECT=Path(__file__).resolve().parents[4]
FOLDER=PROJECT/'blender'/'towers'/('github_octocat_'+STYLE)/'v01'
OUT=Path(os.environ.get('ASSET_BUILD_DIR',str(FOLDER)));OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
guides=bpy.data.collections.new('Anatomy construction paths - not exported');scene.collection.children.link(guides)
guides.hide_render=True;guides.hide_viewport=True
ROLES=['fur','face','eyes','iris','suckers','inner_ear','smile','highlight']
HEX=['252A31','F6C3AA','F3F9F6','A85444','9FD5D1','343C45','8E4C40','FFFFFF']
COLORS=[[int(h[i:i+2],16)/255 for i in (0,2,4)]+[1] for h in HEX]
def material(name,image,rough=.65):
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=rough;bs.inputs['Specular IOR Level'].default_value=.3
    tx=m.node_tree.nodes.new('ShaderNodeTexImage');tx.image=image;tx.interpolation='Linear'
    m.node_tree.links.new(tx.outputs['Color'],bs.inputs['Base Color']);return m
palette=bpy.data.images.new('octocat_palette_32x4',width=32,height=4,alpha=False)
palette.pixels[:]=[c for y in range(4) for x in range(32) for c in COLORS[x//4]]
palette.file_format='PNG';palette.pack();MAT=material('octocat_palette',palette,.57)
def active(obj):
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
def finish(obj,name,role='fur'):
    obj.name=name;active(obj);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    obj.data.materials.clear();obj.data.materials.append(MAT)
    uv=obj.data.uv_layers.active or obj.data.uv_layers.new(name='PaletteUV');uv.name='PaletteUV'
    for item in uv.data:item.uv=((ROLES.index(role)*4+2)/32,.5)
    for p in obj.data.polygons:p.use_smooth=True
    obj.parent=root;return obj
def mesh(name,verts,faces,role='fur'):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj)
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    return finish(obj,name,role)
def ellipsoid(name,center,scale,role='fur',segments=48,rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=center)
    obj=bpy.context.object;obj.scale=scale;return finish(obj,name,role)
def catmull(points,steps=10):
    pts=[Vector(p) for p in points];out=[]
    for i in range(len(pts)-1):
        a=pts[max(0,i-1)];b=pts[i];c=pts[i+1];d=pts[min(len(pts)-1,i+2)]
        for j in range(steps):
            t=j/steps;out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
    return out+[pts[-1]]
def closed_curve(points,steps=8):
    ps=[Vector(p) for p in points];out=[]
    for i in range(len(ps)):
        a,b,c,d=[ps[j%len(ps)] for j in [i-1,i,i+1,i+2]]
        for k in range(steps):
            t=k/steps;out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
    return out
def path_geometry(name,controls,radii,sides=20,steps=10,role='fur',retain=False):
    ps=catmull(controls,steps);rs=[max(.002,p.x) for p in catmull([(r,0,0) for r in radii],steps)]
    verts=[];faces=[];frames=[];previous=None
    for i,p in enumerate(ps):
        tangent=(ps[min(i+1,len(ps)-1)]-ps[max(0,i-1)]).normalized()
        normal=Vector((0,-1,0)) if previous is None else previous
        normal=(normal-tangent*normal.dot(tangent)).normalized()
        if normal.length<.5:normal=tangent.cross(Vector((1,0,0))).normalized()
        side=tangent.cross(normal).normalized();previous=normal;frames.append((tangent,normal,side))
        for k in range(sides):
            a=k*math.tau/sides;verts.append(tuple(p+rs[i]*(normal*math.cos(a)+side*math.sin(a))))
    for i in range(len(ps)-1):
        for k in range(sides):faces.append((i*sides+k,i*sides+(k+1)%sides,(i+1)*sides+(k+1)%sides,(i+1)*sides+k))
    faces+=[tuple(reversed(range(sides))),tuple((len(ps)-1)*sides+k for k in range(sides))]
    obj=mesh(name,verts,faces,role)
    if retain:
        data=bpy.data.curves.new(name+'_path','CURVE');data.dimensions='3D';sp=data.splines.new('POLY');sp.points.add(len(ps)-1)
        for v,p in zip(sp.points,ps):v.co=(*p,1)
        guide=bpy.data.objects.new(name+'_path',data);guides.objects.link(guide);guide['anatomy_role']=name;guide['radii']=rs
    return obj,ps,rs,frames
def join(objects,name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=name;return o
def union_sculpt(objects,name,voxel=.018,ratio=.28):
    obj=join(objects,name);active(obj)
    mod=obj.modifiers.new('Continuous volume','REMESH');mod.mode='VOXEL';mod.voxel_size=voxel;mod.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=obj.modifiers.new('Soft organic transitions','SMOOTH');mod.factor=.6;mod.iterations=5;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=obj.modifiers.new('Retain curved silhouette','DECIMATE');mod.ratio=ratio;bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(obj,name)

# Volumetric cranium with softly merged ear roots.
CZ=2.35 if MODERN else 2.02;WX=1.0 if MODERN else 1.12;HZ=.83 if MODERN else .81;DEPTH=.71 if MODERN else .74;CY=.07
verts=[];faces=[];segments=96;rings=48
sgn=lambda x:-1 if x<0 else 1
powS=lambda x,e:sgn(x)*abs(x)**e
for i in range(rings+1):
    lat=-math.pi/2+math.pi*i/rings
    for j in range(segments):
        a=math.tau*j/segments
        x=WX*abs(math.cos(lat))**.78*powS(math.sin(a),.83)
        y=CY-DEPTH*abs(math.cos(lat))**.78*powS(math.cos(a),.83)
        z=CZ+HZ*powS(math.sin(lat),.78)
        if MODERN and y<CY:y-=.055*math.exp(-((z-(CZ-.37))/.22)**2)*(math.exp(-((x-.37)/.38)**2)+math.exp(-((x+.37)/.38)**2))
        verts.append((x,y,z))
for i in range(rings):
    for j in range(segments):faces.append((i*segments+j,i*segments+(j+1)%segments,(i+1)*segments+(j+1)%segments,(i+1)*segments+j))
skull=mesh('cranium',verts,faces);headparts=[skull]
for s in [-1,1]:
    controls=[(s*WX*.70,.04,CZ+HZ*.66),(s*WX*.76,.03,CZ+HZ*.94),(s*WX*.82,.025,CZ+HZ*1.22),(s*WX*.84,.03,CZ+HZ*1.36)]
    ear,_,_,_=path_geometry('ear_'+str(s),controls,[.255,.21,.115,.012],sides=32,steps=8)
    for v in ear.data.vertices:v.co.y=.04+(v.co.y-.04)*.50
    headparts.append(ear)
head=union_sculpt(headparts,'head_and_ears',.016,.24)

# Paint a single seamless face region on the actual curved skull.
if MODERN:
    outline=[(-.84,-.30),(-.83,.02),(-.74,.34),(-.54,.49),(-.33,.43),(-.09,.31),(.13,.29),(.38,.42),(.60,.56),(.77,.43),(.84,.12),(.83,-.19),(.89,-.36),(.81,-.54),(.59,-.67),(.27,-.72),(-.10,-.72),(-.48,-.66),(-.76,-.54)]
else:
    outline=[(-.89,-.22),(-.86,.09),(-.71,.30),(-.48,.34),(-.19,.32),(.13,.31),(.47,.33),(.73,.29),(.87,.08),(.89,-.22),(.78,-.49),(.48,-.59),(0,-.61),(-.49,-.59),(-.78,-.47)]
boundary=closed_curve([(x*WX,z,0) for x,z in outline],10)
SIZE=1024;XMAX=WX*1.10;ZMIN=CZ-HZ*1.12;ZMAX=CZ+HZ*1.48
poly=[((p.x/XMAX+1)*.5*SIZE,(CZ+p.y-ZMIN)/(ZMAX-ZMIN)*SIZE) for p in boundary]
pixel=list(COLORS[0])*(SIZE*SIZE)
for row in range(SIZE):
    yy=row+.5;xs=[]
    for i,(x1,y1) in enumerate(poly):
        x2,y2=poly[(i+1)%len(poly)]
        if (y1<=yy<y2) or (y2<=yy<y1):xs.append(x1+(yy-y1)*(x2-x1)/(y2-y1))
    xs.sort()
    for k in range(0,len(xs)-1,2):
        lo=max(0,int(math.ceil(xs[k]-.5)));hi=min(SIZE,int(math.floor(xs[k+1]-.5))+1)
        pixel[(row*SIZE+lo)*4:(row*SIZE+hi)*4]=COLORS[1]*(hi-lo)
faceimg=bpy.data.images.new('octocat_'+STYLE+'_face_1024',width=SIZE,height=SIZE,alpha=False)
faceimg.pixels[:]=pixel;faceimg.file_format='PNG';faceimg.pack();FACEMAT=material('octocat_face',faceimg,.61)
head.data.materials.clear();head.data.materials.append(FACEMAT);uv=head.data.uv_layers.active
for polyface in head.data.polygons:
    front=polyface.center.y<CY-.03
    for li in polyface.loop_indices:
        p=head.data.vertices[head.data.loops[li].vertex_index].co
        uv.data[li].uv=((p.x/XMAX+1)*.5,(p.z-ZMIN)/(ZMAX-ZMIN)) if front else (.015,.985)
bvh=BVHTree.FromPolygons([v.co for v in head.data.vertices],[list(p.vertices) for p in head.data.polygons])
def front_y(x,z):
    hit=bvh.ray_cast(Vector((x,-4,z)),Vector((0,1,0)))
    if hit[0] is None:raise RuntimeError('Facial detail outside skull: '+str((x,z)))
    return hit[0].y
def eye_surface(x,z,cx,cz,rx,rz):
    r2=((x-cx)/rx)**2+((z-cz)/rz)**2
    return front_y(x,z)-.004-.037*max(0,1-r2)
def patch(name,cx,cz,rx,rz,height_fn,role,tilt=0):
    vv=[];ff=[];ns=48;nr=8
    for i in range(nr+1):
        r=i/nr
        for j in range(ns):
            a=j*math.tau/ns;dx=rx*r*math.cos(a);dz=rz*r*math.sin(a)
            x=cx+dx*math.cos(tilt)-dz*math.sin(tilt);z=cz+dx*math.sin(tilt)+dz*math.cos(tilt)
            vv.append((x,height_fn(x,z),z))
    for i in range(nr):
        for j in range(ns):ff.append((i*ns+j,i*ns+(j+1)%ns,(i+1)*ns+(j+1)%ns,(i+1)*ns+j))
    return mesh(name,vv,ff,role)
for s in [-1,1]:
    ex=s*(.405 if MODERN else .50);ez=CZ-(.015 if MODERN else .045);rx=.176 if MODERN else .181;rz=.258 if MODERN else .25
    tilt=-s*.11 if MODERN else 0
    fn=lambda x,z,ex=ex,ez=ez,rx=rx,rz=rz:eye_surface(x,z,ex,ez,rx,rz)
    patch('eye_white_'+str(s),ex,ez,rx,rz,fn,'eyes',tilt)
    pcx=ex+(.008 if MODERN else 0);pcz=ez-(.052 if MODERN else .005)
    patch('eye_iris_'+str(s),pcx,pcz,.105 if MODERN else .117,.18 if MODERN else .185,lambda x,z:fn(x,z)-.003,'iris',tilt)
    if MODERN:
        patch('eye_glint_'+str(s),pcx+.027,pcz+.119,.024,.043,lambda x,z:fn(x,z)-.005,'highlight')
        patch('eye_glint_small_'+str(s),pcx-.035,pcz-.083,.009,.014,lambda x,z:fn(x,z)-.005,'highlight')
NZ=CZ-.33
ellipsoid('nose',(0,front_y(0,NZ)-.021,NZ),(.067,.044,.045),'smile',32,16)
sm=[];half=.305 if MODERN else .135
for i in range(17):
    t=i/16;x=half*(t*2-1);z=NZ-.10-(.107 if MODERN else .08)*math.sin(t*math.pi);sm.append((x,front_y(x,z)-.010,z))
path_geometry('smile',sm,[.007+.006*math.sin(i/16*math.pi) for i in range(17)],sides=10,steps=2,role='smile')
for s in [-1,1]:
    for k in range(2):
        x=s*WX*.90;z=CZ-.21-k*.10;y=front_y(x,z)+.025
        controls=[(x,y,z),(s*WX*1.08,y-.02,z+.022-k*.015),(s*WX*1.27,y-.015,z+.025-k*.060),(s*WX*1.40,y+.025,z+.012-k*.060)]
        path_geometry('whisker_'+str(s)+'_'+str(k),controls,[.020,.017,.011,.003],sides=10,steps=8)

# Exactly five appendages: a counted inventory accompanies the source.
anatomy=[];bodyparts=[];paths=[]
bodyparts.append(ellipsoid('torso_seed',(0,.07,1.05 if MODERN else 1.14),(.29,.275,.65) if MODERN else (.36,.31,.29)))
def limb(name,points,radii,cup_direction=(0,-1,0),cup_start=.30,cup_end=.91,cups=9):
    obj,ps,rs,frames=path_geometry(name,points,radii,sides=24,steps=10,retain=True)
    bodyparts.append(obj);paths.append((name,ps,rs,Vector(cup_direction),cup_start,cup_end,cups));anatomy.append(name)
if not MODERN:
    for s in [-1,1]:
        limb('leg_front_'+('left' if s<0 else 'right'),[(s*.10,.02,1.27),(s*.18,-.13,1.08),(s*.23,-.20,.85),(s*.255,-.32,.48),(s*.30,-.45,.20),(s*.41,-.57,.14),(s*.55,-.62,.20)],[.13,.205,.195,.17,.135,.080,.010],cups=10)
        limb('leg_rear_'+('left' if s<0 else 'right'),[(s*.10,.12,1.27),(s*.22,.20,1.08),(s*.37,.29,.83),(s*.48,.31,.44),(s*.60,.30,.20),(s*.78,.23,.15),(s*.91,.13,.23)],[.13,.205,.185,.16,.13,.077,.01],cup_direction=(-s*.65,-.7,0),cup_start=.48,cups=7)
    limb('tail_raised',[(-.14,.25,1.14),(-.40,.30,.99),(-.72,.27,1.01),(-1.01,.20,1.18),(-1.13,.11,1.45),(-1.27,.04,1.58),(-1.36,.02,1.58)],[.155,.15,.132,.11,.082,.048,.008],cup_direction=(0,-.7,1),cup_start=.2,cup_end=.94,cups=11)
else:
    for s in [-1,1]:
        limb('leg_'+('left' if s<0 else 'right'),[(s*.12,.02,.78),(s*.215,-.03,.49),(s*.24,-.19,.25),(s*.26,-.39,.155),(s*.31,-.57,.13),(s*.42,-.64,.20)],[.185,.18,.165,.14,.095,.012],cups=8)
    limb('arm_left',[(-.13,.045,1.50),(-.40,.025,1.30),(-.66,-.055,1.05),(-.67,-.18,.82),(-.51,-.33,.72),(-.34,-.40,.80),(-.36,-.40,.92)],[.14,.13,.125,.135,.15,.125,.025],cups=10,cup_start=.28,cup_end=.85)
    limb('arm_right',[(.14,.04,1.50),(.43,.025,1.28),(.71,-.015,1.15),(.91,-.05,1.26),(1.00,-.10,1.54),(1.12,-.15,1.73),(1.28,-.20,1.70),(1.34,-.23,1.60)],[.14,.13,.128,.145,.17,.185,.12,.02],cups=11,cup_start=.25,cup_end=.90)
    limb('tail_rear',[(0,.23,.85),(.19,.38,.57),(.40,.47,.29),(.64,.45,.155),(.87,.35,.18),(.96,.25,.32)],[.14,.145,.13,.115,.067,.008],cup_direction=(0,0,-1),cups=8,cup_start=.30,cup_end=.89)
assert len(anatomy)==5 and len(set(anatomy))==5
body=union_sculpt(bodyparts,'body_five_tentacles',.013,.22);body['anatomy_inventory']=anatomy;body['appendage_count']=5
if not MODERN:
    # Fair the four branch saddles locally. The lower legs and raised tail
    # retain their authored shapes; capped tube ends now terminate inside torso.
    group=body.vertex_groups.new(name='leg_root_fairing')
    for v in body.data.vertices:
        x,y,z=v.co
        vertical=max(0,min(1,(z-.74)/.20))*max(0,min(1,(1.45-z)/.12))
        radial=max(0,min(1,(.57-abs(x))/.18))*max(0,min(1,(.51-abs(y-.07))/.16))
        weight=vertical*radial
        if weight>0:group.add([v.index],weight,'REPLACE')
    active(body)
    modifier=body.modifiers.new('Smooth continuous leg saddles','SMOOTH')
    modifier.vertex_group=group.name;modifier.factor=.65;modifier.iterations=32
    bpy.ops.object.modifier_apply(modifier=modifier.name)
body_bvh=BVHTree.FromPolygons([v.co for v in body.data.vertices],[list(p.vertices) for p in body.data.polygons])
cup_objects=[];cup_inventory={}
for name,ps,rs,direction,start,end,count in paths:
    cup_inventory[name]=0
    distances=[0]
    for a,b in zip(ps,ps[1:]):distances.append(distances[-1]+(b-a).length)
    spacing=distances[-1]*(end-start)/(count-1)
    transported=[];normal=direction.copy()
    for j in range(len(ps)):
        tangent=(ps[min(j+1,len(ps)-1)]-ps[max(j-1,0)]).normalized()
        normal=normal-tangent*normal.dot(tangent)
        if normal.length<.1:normal=tangent.cross(Vector((1,0,0)))
        normal.normalize();transported.append(normal.copy())
    for c in range(count):
        frac=start+(end-start)*c/(count-1)
        i=min(range(len(ps)),key=lambda j:abs(distances[j]-frac*distances[-1]));p=ps[i]
        tangent=(ps[min(i+1,len(ps)-1)]-ps[max(i-1,0)]).normalized();normal=transported[i]
        # Centerline is inside the merged solid, so the first outward hit is
        # the true skin even near a broader torso/limb transition.
        hit=body_bvh.ray_cast(p,normal,rs[i]+.24)
        if hit[0] is None:raise RuntimeError('No sucker seat on '+str((name,c,i,tuple(p),tuple(normal),rs[i],body_bvh.find_nearest(p))))
        normal=hit[1].normalized()
        tangent=(tangent-normal*tangent.dot(normal)).normalized();side=tangent.cross(normal).normalized()
        center=hit[0];outer=min(.057,rs[i]*.42,spacing*.40)
        if outer<.017:continue
        vv=[];ff=[];ns=16;ringspec=[(1,-.006),(.98,.004),(.83,.012),(.66,.014),(.48,.007),(.20,.001),(0,.0005)]
        for radius,depth in ringspec:
            for j in range(ns):
                a=j*math.tau/ns;vv.append(tuple(center+normal*depth+(side*math.cos(a)+tangent*math.sin(a))*outer*radius))
        for k in range(len(ringspec)-1):
            for j in range(ns):ff.append((k*ns+j,k*ns+(j+1)%ns,(k+1)*ns+(j+1)%ns,(k+1)*ns+j))
        cup=mesh('sucker_'+name+'_'+str(c+1),vv,ff,'suckers')
        if sum(f.normal.dot(normal)*f.area for f in cup.data.polygons)<0:
            bm=bmesh.new();bm.from_mesh(cup.data);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(cup.data);bm.free()
        cup_objects.append(cup);cup_inventory[name]+=1
suckers=join(cup_objects,'suction_cup_rows');suckers['row_counts']=cup_inventory
for name,ps,rs,*_ in paths:
    group=body.vertex_groups.new(name=name)
    for v in body.data.vertices:
        nearest=min(range(0,len(ps),3),key=lambda i:(v.co-ps[i]).length_squared)
        if (v.co-ps[nearest]).length<rs[nearest]+.025:group.add([v.index],1,'REPLACE')
objects=[o for o in root.children if o.type=='MESH']
floor=min(v.co.z for o in objects for v in o.data.vertices)
for o in objects:
    for v in o.data.vertices:
        v.co.z-=floor
        # Tiny shared contact patches: all supporting tentacles sit on the floor.
        # Apply the same map to skin and cups so seats remain coherent.
        if v.co.z<.012:v.co.z=0
        elif v.co.z<.04:
            t=(v.co.z-.012)/.028
            v.co.z=.04*(t*t*(3-2*t))
height=max(v.co.z for o in objects for v in o.data.vertices)
def anchor(name,position,notes):
    obj=bpy.data.objects.new(name,None);scene.collection.objects.link(obj);obj.parent=root
    obj.location=(position[0],position[1],position[2]-floor);obj['attachment_notes']=notes
anchor('anchor_ui',(0,0,height+floor+.22),'Nameplate above ear tips')
anchor('anchor_hat',(0,.02,CZ+HZ*.95),'Crown seat; fit around two ears')
anchor('anchor_face',(0,front_y(0,CZ)-.10,CZ),'Glasses bridge')
anchor('anchor_chest',(0,-.22,1.26 if MODERN else 1.13),'Garment fitting origin')
anchor('anchor_back',(0,.34,1.22 if MODERN else 1.1),'Back accessory; preserve tail clearance')
anchor('anchor_target',(0,0,CZ-.35),'Visual target')
left=(-.36,-.4,.87) if MODERN else (-1.26,.04,1.56);right=(1.12,-.15,1.73) if MODERN else (.30,-.42,.3)
anchor('anchor_hand_left',left,'Prop fit; Classic uses its raised tail, not a sixth limb')
anchor('anchor_hand_right',right,'Classic: future pose provision')
anchor('anchor_action',(right[0],right[1]-.15,right[2]),'Visual action origin')
root['anatomy_inventory']=anatomy;root['appendage_count']=5;root['supporting_legs']=2 if MODERN else 4;root['arms']=2 if MODERN else 0;root['tails']=1
root['ears']=2;root['whiskers']=4;root['accessory_contract']='octocat_attachment_slots_v01';root['production_status']='Reference-led static sculpt. No wardrobe or animations.'
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
stats={'style':STYLE,'triangles':triangles,'meshes':len(objects),'height':height,'anatomy':{'total_appendages':5,'supporting_legs':2 if MODERN else 4,'arms':2 if MODERN else 0,'tails':1,'ears':2,'eyes':2,'whiskers':4},'appendages':anatomy,'sucker_counts':cup_inventory,'source_guides':5}
(OUT/'authoring_stats.json').write_text(json.dumps(stats,indent=2));bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/os.environ.get('ASSET_SOURCE_NAME','github_octocat_'+STYLE+'_v01.blend')))
print(json.dumps(stats))
