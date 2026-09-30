"""Campus woodland art. Blender owns geometry; placement metadata is not gameplay."""
import bpy, bmesh, json, math, os, random, struct, zlib, hashlib
from pathlib import Path
from mathutils import Vector

COLORS={'trunk':'#65918F','bark':'#826F5D','leaf':'#70B5B4','leaf_light':'#86C2BD','leaf_dark':'#609D9E','sage':'#91AC78','moss':'#637F60','pine':'#527F86','pine_light':'#719A91','gold':'#CCB768','amber':'#C59A60','copper':'#AC7957'}

class Geometry:
    def __init__(self):self.vertices=[];self.faces=[];self.roles=[]
    def add(self,verts,faces,roles):
        offset=len(self.vertices);self.vertices.extend(verts)
        self.faces.extend([tuple(offset+i for i in f) for f in faces])
        self.roles.extend([roles]*len(faces) if isinstance(roles,str) else roles)
    def instance(self,other,x=0,z=0,y=0,scale=1,angle=0,remap=None):
        c,s=math.cos(angle),math.sin(angle);remap=remap or {}
        self.add([(x+scale*(a*c-b*s),-z+scale*(a*s+b*c),y+scale*h) for a,b,h in other.vertices],other.faces,[remap.get(r,r) for r in other.roles])
    def ico(self,center,size,role):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1)
        obj=bpy.context.object
        self.add([tuple(center[i]+v.co[i]*size[i] for i in range(3)) for v in obj.data.vertices],[tuple(p.vertices) for p in obj.data.polygons],role)
        mesh=obj.data;bpy.data.objects.remove(obj,do_unlink=True);bpy.data.meshes.remove(mesh)
    def branch(self,start,end,radius,role='bark',n=8):
        a,b=Vector(start),Vector(end);axis=(b-a).normalized();u=axis.cross(Vector((0,1,0))).normalized();v=axis.cross(u).normalized()
        vertices=[tuple(p+radius*factor*(u*math.cos(i*2*math.pi/n)+v*math.sin(i*2*math.pi/n))) for p,factor in [(a,1),(b,.78)] for i in range(n)]
        if abs(a.z)<1e-9:vertices=[(x,y,0 if i<n else z) for i,(x,y,z) in enumerate(vertices)]
        faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        self.add(vertices,faces,role)

def load_object(source,name=None):
    with bpy.data.libraries.load(str(source),link=False) as (src,dst):dst.objects=[name] if name else src.objects
    return [o for o in dst.objects if o]

def original_tree(project,kind):
    source=project/f'blender/environment/campus_tree_{kind}_bare/v01/references/planter_source.blend'
    objects=load_object(source,f'campus_tree_{kind}');obj=objects[0]
    names={int(v):k for k,v in obj['palette_roles']['roles'].items()};attr=obj.data.attributes['_palette_role']
    selected=[p for p in obj.data.polygons if names[round(attr.data[p.loop_start].value)] in ('trunk','leaf','leaf_light','leaf_dark')]
    used=sorted({i for p in selected for i in p.vertices});indices={old:i for i,old in enumerate(used)}
    g=Geometry();g.add([(obj.data.vertices[i].co.x,obj.data.vertices[i].co.y,obj.data.vertices[i].co.z-.28) for i in used],[tuple(indices[i] for i in p.vertices) for p in selected],[names[round(attr.data[p.loop_start].value)] for p in selected])
    bpy.data.objects.remove(obj,do_unlink=True)
    return g

def new_tree(kind):
    g=Geometry()
    if kind=='pine':
        g.branch((0,0,0),(0,0,1.35),.16)
        profile=[(.86,.68),(1.01,1.17),(2.01,.48),(2.08,.88),(2.91,.28),(2.98,.59)]
        n=8;verts=[(r*math.cos(i*2*math.pi/n+.18),r*math.sin(i*2*math.pi/n+.18),h) for h,r in profile for i in range(n)]
        verts.append((.04,-.035,4.12));tip=len(verts)-1
        faces=[tuple(range(n-1,-1,-1))];roles=['pine']
        for k in range(len(profile)-1):
            for i in range(n):faces.append((k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i));roles.append('pine_light' if k>=3 else 'pine')
        for i in range(n):faces.append(((len(profile)-1)*n+i,(len(profile)-1)*n+(i+1)%n,tip));roles.append('pine_light')
        g.add(verts,faces,roles)
    elif kind=='spreading':
        g.branch((0,0,0),(0,0,1.95),.21)
        g.branch((0,0,1.10),(-.86,.04,2.15),.12)
        g.branch((0,0,1.28),(.86,-.02,2.05),.11)
        g.ico((0,0,2.44),(1.30,1.06,1.03),'sage')
        g.ico((-.93,.03,2.15),(.99,.83,.81),'moss')
        g.ico((.91,-.02,2.24),(1.03,.88,.86),'sage')
    elif kind=='autumn':
        g.branch((0,0,0),(.07,0,1.94),.17)
        g.branch((.02,0,1.05),(-.58,.03,2.07),.10)
        g.ico((.15,0,2.45),(1.15,.96,1.30),'gold')
        g.ico((-.65,.04,2.12),(.76,.78,.91),'amber')
    else:raise ValueError(kind)
    return g

def write_palette(destination):
    # PNG byte encoding keeps declared sRGB swatches exact, independent of Blender view transforms.
    rgb=[tuple(int(h[i:i+2],16) for i in (1,3,5)) for h in COLORS.values()]
    row=b''.join(bytes(rgb[min(x//4,len(rgb)-1)])+b'\xff' for x in range(64))
    def chunk(t,data):return struct.pack('!I',len(data))+t+data+struct.pack('!I',zlib.crc32(t+data)&0xffffffff)
    payload=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',64,4,8,6,0,0,0))+chunk(b'IDAT',zlib.compress((b'\0'+row)*4))+chunk(b'IEND',b'')
    file=destination/'forest_palette.png';file.write_bytes(payload)
    image=bpy.data.images.load(str(file),check_existing=False);image.name='Campus forest palette · packed';image.colorspace_settings.name='sRGB';image.pack()
    mat=bpy.data.materials.new('campus_forest_palette');mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.92
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Closest';tex.extension='EXTEND'
    uv=mat.node_tree.nodes.new('ShaderNodeUVMap');uv.uv_map='ForestPalette'
    mat.node_tree.links.new(uv.outputs['UV'],tex.inputs['Vector']);mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    return mat

def build(asset_id,folder):
    project=folder.parents[3];entries=json.loads((project/'tools/asset-recipes/campus-forest-entries.json').read_text(encoding='utf-8'));kind=next(e['kind'] for e in entries if e['id']==asset_id)
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
    destination=Path(os.environ.get('ASSET_BUILD_DIR',folder));destination.mkdir(parents=True,exist_ok=True)
    templates={k:original_tree(project,k) for k in ('round','tall','cluster')}
    templates.update({k:new_tree(k) for k in ('pine','spreading','autumn')})
    # Appending a mesh can bring its unlinked parent. Remove those dependency-only
    # objects before creating the one canonical export root.
    for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
    root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
    anchors={};geometry=Geometry();placements=[]
    def anchor(name,x,y,z):
        o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=root;o.location=(x,-z,y);anchors[name]=[x,y,z]
    def place(shape,x,z,scale=1,angle=0,remap=None,y=0):
        geometry.instance(templates[shape],x,z,y,scale,angle,remap)
        placements.append({'shape':shape,'position':[x,y,z],'scale':scale,'rotationY':-angle,'palette':remap or {}})
    if kind in templates:place(kind,0,0)
    elif kind in ('mixed','dense','edge'):
        if kind=='mixed':
            layout=[('tall',-3.0,-3.2,.92),('pine',.2,-3.7,.96),('round',3.3,-2.4,1.02),('cluster',-3.45,.2,.92),('spreading',-.6,-.1,.96),('pine',2.8,.8,.84),('round',-2.8,3.6,.9),('tall',.5,3.1,.94),('autumn',3.4,3.5,.93)];width,depth=10,10
        elif kind=='dense':
            layout=[('pine',-3.4,-3.4,1.02),('tall',-.1,-3.55,1.05),('pine',3.3,-3.35,.90),('round',-3.65,-.5,.94),('pine',-.95,-1.1,1.10),('round',1.45,-1.2,.83),('tall',3.7,.2,.93),('pine',-2.0,1.5,.88),('tall',.65,1.45,1.08),('pine',3.0,3.45,1.01),('round',-3.4,3.4,.98),('pine',-.4,3.5,.83),('round',2.8,1.5,.78)];width,depth=10,10
        else:
            layout=[('tall',-4.7,-1.6,.95),('autumn',-1.8,-1.55,1.05),('pine',1.45,-1.5,.93),('autumn',4.5,-1.4,.96),('spreading',-3.85,1.15,.80),('round',-.15,1.25,.82),('autumn',3.45,1.25,.76)];width,depth=12,6
        for i,(shape,x,z,scale) in enumerate(layout):
            remap={}
            if kind=='dense' and shape=='round':remap={'leaf':'moss'}
            if kind=='edge' and shape=='round':remap={'leaf':'sage'}
            place(shape,x,z,scale,(i*.73)%(2*math.pi),remap)
        for name,x,z in [('n',0,-depth/2),('e',width/2,0),('s',0,depth/2),('w',-width/2,0)]:anchor('anchor_'+name,x,0,z)
        # Clamp the composition uniformly only when crown extrema exceed its module envelope.
        factor=min(1,(width/2-.10)/max(abs(v[0]) for v in geometry.vertices),(depth/2-.10)/max(abs(v[1]) for v in geometry.vertices))
        if factor<1:
            geometry.vertices=[(x*factor,y*factor,z*factor) for x,y,z in geometry.vertices]
            for p in placements:p['position']=[v*factor for v in p['position']];p['scale']*=factor
        root['module_size']=[width,depth];root['base_mode']='none'
    elif kind=='tile':
        # Use the current registered park surface so woodland inherits the same
        # narrow blended joins. The retained snapshot is provenance only.
        for obj in load_object(project/'blender/environment/campus_tile_park/v01/campus_tile_park_v01.blend'):
            if obj.type=='EMPTY' and obj.name.split('.')[0]=='root':continue
            scene.collection.objects.link(obj);obj.parent=root
            if obj.type=='MESH':obj.name='Forest terrain'
            elif obj.name.startswith('anchor_'):anchors[obj.name]=[obj.location.x,obj.location.z,-obj.location.y]
        rng=random.Random(92426);candidate=[]
        # Crown-aware seeded scatter avoids orchard rows. Keep a 4.4 m passage,
        # an 8 m clearing and a quiet terrain border clear of actual foliage.
        for attempt in range(6000):
            shape=rng.choice(['round','round','round','tall','tall','pine','pine','spreading','autumn'])
            scale=rng.uniform(.88,1.14);radius=max(math.hypot(v[0],v[1]) for v in templates[shape].vertices)*scale
            x,z=rng.uniform(-14.3,14.3),rng.uniform(-13.4,13.4)
            clearance=min(18*math.sqrt(3)/2-x*math.cos(math.pi/6+i*math.pi/3)-z*math.sin(math.pi/6+i*math.pi/3) for i in range(6))
            if clearance<radius+.65 or abs(x)<2.2+radius or math.hypot(x,z)<4+radius:continue
            # Clear crowns from the cave envelope at local (0, -4.65).
            if abs(x)<3.7+radius and -7.5-radius<z<-2.0+radius:continue
            if any(math.hypot(x-px,z-pz)<.84*(radius+pr)+.32 for px,pz,pr,_,_ in candidate):continue
            candidate.append((x,z,radius,shape,scale))
            if len(candidate)==42:break
        if len(candidate)!=42:raise RuntimeError('Forest scatter could not fit the authored count')
        for i,(x,z,radius,shape,scale) in enumerate(candidate):
            remap={}
            if shape=='round' and i%3==0:remap={'leaf':'sage'}
            if shape=='round' and i%3==1:remap={'leaf':'moss'}
            place(shape,x,z,scale,rng.uniform(0,math.tau),remap,1.2)
        root['module_size']=[36,18*math.sqrt(3)];root['base_mode']='included';root['surface_height']=1.2
    else:raise ValueError(kind)
    mat=write_palette(destination)
    data=bpy.data.meshes.new(asset_id+'_foliage');data.from_pydata(geometry.vertices,[],geometry.faces);data.update()
    obj=bpy.data.objects.new('Forest foliage' if kind=='tile' else asset_id,data);scene.collection.objects.link(obj);obj.parent=root;data.materials.append(mat)
    roles=list(COLORS);uv=data.uv_layers.new(name='ForestPalette');semantic=data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
    for poly,role in zip(data.polygons,geometry.roles):
        for i in poly.loop_indices:uv.data[i].uv=((roles.index(role)*4+2)/64,.5);semantic.data[i].value=roles.index(role)+1
    obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':{r:i+1 for i,r in enumerate(roles)}}
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    anchor('anchor_ui',0,max(v[2] for v in geometry.vertices)+.25,0)
    root['forest_placements']=json.dumps(placements,separators=(',',':'));root['tree_placement_count']=len(placements)
    root['base_mode']='included' if kind=='tile' else 'none'
    # Structural audit of actual authored foliage, before the guarded runtime validator.
    bm=bmesh.new();bm.from_mesh(data)
    audit={'id':asset_id,'placements':placements,'foliageVertices':len(data.vertices),'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),'zeroAreaFaces':sum(f.calc_area()<1e-9 for f in bm.faces),'minimumContactHeight':min(v[2] for v in geometry.vertices),'maximumHeight':max(v[2] for v in geometry.vertices),'anchors':anchors,'paletteSha256':hashlib.sha256((destination/'forest_palette.png').read_bytes()).hexdigest()};bm.free()
    if audit['nonManifoldEdges'] or audit['zeroAreaFaces']:raise RuntimeError(audit)
    (destination/'forest_source_audit.json').write_text(json.dumps(audit,indent=2)+'\n')
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(destination/os.environ.get('ASSET_SOURCE_NAME',asset_id+'_v01.blend')))
    print('FOREST_BUILD',asset_id,'placements',len(placements),'height',round(audit['maximumHeight'],3))
