"""Campus planting and social furniture. Source-authored palette and breeze clips."""
import bpy, bmesh, math, os, json, struct, zlib, hashlib
from pathlib import Path

def build(asset_id, folder):
    manifest = json.loads((folder / 'asset.json').read_text())
    palette = manifest['texturePalettes'][0]
    destination = Path(os.environ.get('ASSET_BUILD_DIR', folder)) / os.environ.get('ASSET_SOURCE_NAME', asset_id + '_v01.blend')
    destination.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'; scene.unit_settings.scale_length = 1
    root = bpy.data.objects.new('root', None); scene.collection.objects.link(root)
    # Write exact sRGB bytes, then pack the image into the editable source.
    w, h = palette['size']; pixels = bytearray([255] * w * h * 4)
    for role in palette['roles'].values():
        x, y, rw, rh = role['rect']; rgba = bytes.fromhex(role['color'][1:]) + b'\xff'
        for py in range(y, y + rh):
            for px in range(x, x + rw): pixels[(py*w+px)*4:(py*w+px+1)*4] = rgba
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t+d))
    scan = b''.join(b'\0' + pixels[y*w*4:(y+1)*w*4] for y in range(h))
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w,h,8,6,0,0,0)) + chunk(b'sRGB', b'\0') + chunk(b'IDAT', zlib.compress(scan,9)) + chunk(b'IEND', b'')
    image_path = destination.parent / 'palette.png'; image_path.write_bytes(png)
    image = bpy.data.images.load(str(image_path), check_existing=False); image.name = asset_id + '_palette'; image.pack(); image.filepath = '//palette.png'
    mat = bpy.data.materials.new(palette['material']); mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Roughness'].default_value = .83
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = image; tex.interpolation = 'Linear'
    uvnode = mat.node_tree.nodes.new('ShaderNodeUVMap'); uvnode.uv_map = 'PaletteUV'
    mat.node_tree.links.new(uvnode.outputs['UV'], tex.inputs['Vector']); mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    parts = []
    component_instances = []
    def finish(obj, name, role, bevel=0):
        obj.name = name; bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if bevel:
            mod = obj.modifiers.new('Soft bevel', 'BEVEL'); mod.width=bevel; mod.segments=1
            bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.data.materials.clear(); obj.data.materials.append(mat)
        uv = obj.data.uv_layers.new(name='PaletteUV')
        x,y,rw,rh = palette['roles'][role]['rect']
        for v in uv.data: v.uv = ((x+rw/2)/w, 1-(y+rh/2)/h)
        parts.append(obj); return obj
    def mesh(name, verts, faces, role, bevel=0):
        data=bpy.data.meshes.new(name); data.from_pydata([(x,-d,z) for x,d,z in verts], [], faces); data.update()
        bm=bmesh.new(); bm.from_mesh(data); bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces)); bm.to_mesh(data); bm.free()
        obj=bpy.data.objects.new(name,data); scene.collection.objects.link(obj)
        bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
        return finish(obj,name,role,bevel)
    def box(name,p,s,role,bevel=.025):
        bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[1],p[2])); obj=bpy.context.object; obj.dimensions=s
        return finish(obj,name,role,bevel)
    def prism(name,outline,lo,hi,role):
        n=len(outline); return mesh(name,[(x,d,z) for z in (lo,hi) for x,d in outline], [tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],role)
    def face_prism(name,outline,d,depth,role,bevel=0):
        n=len(outline); return mesh(name,[(x,y,z) for y in (d-depth/2,d+depth/2) for x,z in outline],[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],role,bevel)
    def ring(name,outer,inner,lo,hi,role):
        n=len(outer); verts=[(x,d,z) for z in (lo,hi) for loop in (outer,inner) for x,d in loop]; faces=[]
        for i in range(n):
            j=(i+1)%n; faces.extend([(i,j,j+2*n,i+2*n),(i+n,i+3*n,j+3*n,j+n),(i,i+n,j+n,j),(i+2*n,j+2*n,j+3*n,i+3*n)])
        return mesh(name,verts,faces,role)
    def clipped(w,d,c=.10,x=0,y=0):
        return [(a+x,b+y) for a,b in [(-w/2+c,-d/2),(w/2-c,-d/2),(w/2,-d/2+c),(w/2,d/2-c),(w/2-c,d/2),(-w/2+c,d/2),(-w/2,d/2-c),(-w/2,-d/2+c)]]
    def circle(r,x=0,d=0,n=12): return [(x+r*math.cos(i*2*math.pi/n),d+r*math.sin(i*2*math.pi/n)) for i in range(n)]
    def cylinder(name,p,r,depth,role,n=12):
        bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=depth,location=(p[0],-p[1],p[2])); return finish(bpy.context.object,name,role)
    def ico(name,p,s,role):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(p[0],-p[1],p[2])); obj=bpy.context.object; obj.scale=s; return finish(obj,name,role)
    def torus(name,p,major,minor,role):
        bpy.ops.mesh.primitive_torus_add(major_segments=12,minor_segments=4,major_radius=major,minor_radius=minor,location=(p[0],-p[1],p[2]),rotation=(math.pi/2,0,0)); return finish(bpy.context.object,name,role)
    def flowers(x,d,z):
        for dx,dd,height,role in [(-.16,0,.27,'coral'),(.12,.12,.37,'yellow')]:
            cylinder('Flower stem',(x+dx,d+dd,z+height/2),.025,height,'leaf_dark',5)
            for i in range(5):
                a=i*math.tau/5; ico('Petal',(x+dx+.075*math.cos(a),d+dd+.075*math.sin(a),z+height),(.065,.065,.045),role)
            ico('Flower heart',(x+dx,d+dd,z+height+.025),(.05,.05,.04),'yellow')
    def planter(x,d,width,depth):
        prism('Stone planter',clipped(width,depth,x=x,y=d),0,.42,'edge')
        ring('Continuous pale rim',clipped(width,depth,x=x,y=d),clipped(width-.16,depth-.16,.07,x,d),.42,.51,'chalk')
        prism('Soil bed',clipped(width-.16,depth-.16,.07,x,d),.42,.46,'soil')
    def mug(x,d,z,s=1):
        r=.11*s; height=.19*s
        cylinder('Cup bottom',(x,d,z+.02*s),r,.04*s,'chalk')
        ring('Cup wall',circle(r,x,d),circle(r-.025*s,x,d),z+.02*s,z+height,'chalk')
        cylinder('Coffee',(x,d,z+height-.035*s),r-.027*s,.015*s,'coffee')
        torus('Cup handle',(x+r+.02*s,d,z+height*.55),.06*s,.022*s,'chalk')
    plant=asset_id in ('campus_flower_bed','campus_bush_round','campus_hedge')
    if asset_id=='campus_flower_bed':
        prism('Low stone bed',clipped(3.8,1.5,.25),0,.14,'edge')
        ring('Warm stone lip',clipped(3.8,1.5,.25),clipped(3.56,1.26,.18),.14,.20,'wood_light')
        prism('Soil',clipped(3.56,1.26,.18),.14,.17,'soil')
        for i,x in enumerate([-1.25,-.55,.2,.95]):
            d=.19 if i%2 else -.19
            ico('Low foliage',(x,d,.37),(.46,.36,.29),'leaf_dark' if i%2 else 'teal')
            flowers(x,d,.28)
        for x,d in [(-1.55,.29),(.65,-.37),(1.47,.16)]:
            for dx in [-.11,0,.11]:
                mesh('Grass blade',[(x+dx-.045,d,.17),(x+dx+.045,d,.17),(x+dx+.14,d,.78),(x+dx,d+.045,.25)],[(0,1,2),(0,2,3),(1,3,2),(0,3,1)],'leaf_light')
        ui=1.0
    elif asset_id in ('campus_bush_round','campus_hedge'):
        hedge=asset_id=='campus_hedge';width=3.5 if hedge else 1.6
        prism('Soil footprint',clipped(width,1.15,.25),0,.09,'soil')
        for i,x in enumerate([-1.1,0,1.1] if hedge else [0]):
            cylinder('Woody stem',(x,0,.30),.095,.48,'wood',6)
            ico('Main shrub',(x,0,.68),(.68,.59,.60),'leaf_dark')
            ico('Sunlit shrub crown',(x-.15,-.07,.99),(.46,.45,.42),'teal')
            ico('New growth',(x+.32,.12,.78),(.38,.44,.39),'leaf_light')
        ui=1.5
    elif asset_id=='campus_path_bollard':
        prism('Clipped footing',clipped(.68,.68,.12),0,.12,'edge')
        prism('Dark mast',clipped(.35,.35,.06),.12,1.05,'navy')
        prism('Amber diffuser',clipped(.46,.46,.08),.91,1.18,'yellow')
        lamp=parts[-1];emissive=mat.copy();emissive.name='campus_bollard_lamp'
        ebs=emissive.node_tree.nodes.get('Principled BSDF');ebs.inputs['Emission Color'].default_value=(1,.49,.14,1);ebs.inputs['Emission Strength'].default_value=1.15
        lamp.data.materials.clear();lamp.data.materials.append(emissive)
        prism('Shielded cap',clipped(.60,.60,.12),1.18,1.29,'navy')
        box('Status strip',(0,.184,.70),(.12,.015,.07),'cyan',.008)
        ui=1.4
    elif asset_id=='campus_cafe_table':
        cylinder('Table foot',(0,0,.06),.46,.12,'navy')
        cylinder('Pedestal',(0,0,.53),.12,.92,'edge')
        cylinder('Table rim',(0,0,1.03),.84,.12,'chalk',16)
        cylinder('Warm tabletop',(0,0,1.10),.78,.035,'wood_light',16)
        for x in (-1.35,1.35):
            cylinder('Stool foot',(x,0,.055),.29,.11,'navy')
            cylinder('Stool support',(x,0,.37),.08,.60,'edge')
            cylinder('Stool seat',(x,0,.71),.36,.12,'wood',12)
        mug(-.34,.25,1.12,1.2);mug(.38,-.25,1.12)
        box('Closed notebook',(.22,.22,1.15),(.42,.33,.055),'violet',.014)
        box('Notebook stripe',(.22,.22,1.181),(.035,.26,.005),'cyan',0)
        anchor=bpy.data.objects.new('anchor_steam',None);scene.collection.objects.link(anchor);anchor.parent=root;anchor.location=(-.34,-.25,1.37)
        ui=1.5
    elif asset_id=='campus_noticeboard':
        for x in (-1.20,1.20):
            prism('Post footing',clipped(.52,.72,.09,x,0),0,.12,'edge')
            box('Board post',(x,0,1.27),(.14,.18,2.3),'wood',.015)
        box('Board frame',(0,0,1.78),(2.85,.22,1.76),'navy',.065)
        box('Cork inset',(0,.125,1.76),(2.56,.04,1.43),'wood_light',.025)
        box('Header',(0,.155,2.28),(2.40,.04,.25),'teal',.018)
        for i,(x,z,role) in enumerate([(-.76,1.86,'chalk'),(.02,1.65,'chalk'),(.79,1.85,'yellow')]):
            box('Event card',(x,.173,z),(.58,.025,.65),role,.014)
            box('Card heading',(x,.192,z+.17),(.43,.018,.10),'violet' if i==1 else 'teal',.008)
            for j in range(2):box('Card text bar',(x-.035,.192,z-.04-j*.12),(.32-j*.07,.018,.035),'navy',0)
            ico('Pin',(x,.212,z+.27),(.04,.025,.04),'coral')
        box('Roof',(0,0,2.74),(3.17,.73,.14),'chalk',.055)
        box('Cyan header light',(0,.23,2.59),(1.65,.025,.035),'cyan',.008)
        ui=3.0
    else:raise ValueError(asset_id)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:obj.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();obj=bpy.context.object;obj.name=asset_id
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);obj.parent=root
    if plant:
        obj.shape_key_add(name='Basis')
        for name,sign in [('BreezeLeft',-1),('BreezeRight',1)]:
            key=obj.shape_key_add(name=name)
            for v in key.data:
                lift=max(0,v.co.z-.20);v.co.x+=sign*.055*lift*lift;v.co.y+=sign*.025*lift*lift
            for frame,value in ([(0,0),(24,1),(48,0),(72,0),(96,0)] if sign<0 else [(0,0),(24,0),(48,0),(72,1),(96,0)]):
                key.value=value;key.keyframe_insert(data_path='value',frame=frame)
            key.value=0
        keys=obj.data.shape_keys;ad=keys.animation_data;action=ad.action;action.name='idle';slot=ad.action_slot
        track=ad.nla_tracks.new();track.name='idle';strip=track.strips.new('idle',0,action);strip.action_slot=slot
        ad.action=None;strip.influence=1;strip.blend_type='REPLACE';ad.use_nla=True;track.mute=True
        obj.animation_data_create()
        scene.render.fps=24;scene.frame_start=0;scene.frame_end=96
    anchor=bpy.data.objects.new('anchor_ui',None);scene.collection.objects.link(anchor);anchor.parent=root;anchor.location=(0,0,ui)
    scene.frame_set(0);bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(destination))
