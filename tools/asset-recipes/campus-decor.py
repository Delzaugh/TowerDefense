"""Original static campus furnishings. Coordinates below are x, forward, height."""
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
    def icon(kind,x,z,d,scale=1,role='chalk'):
        def shape(name,coords):return face_prism(name,[(x+a*scale,z+b*scale) for a,b in coords],d,.035,role)
        if kind=='cup':
            shape('Cup pictogram',[(-.2,.12),(.2,.12),(.16,-.16),(-.13,-.16)])
            # Continuous outline handle, with an open center.
            torus('Pictogram cup handle',(x+.22*scale,d,z),.095*scale,.028*scale,role)
            shape('Cup saucer',[(-.23,-.20),(.24,-.20),(.20,-.24),(-.19,-.24)])
        elif kind=='flask':
            shape('Flask pictogram',[(-.09,.22),(.09,.22),(.09,.02),(.23,-.2),(-.23,-.2),(-.09,.02)])
            face_prism('Flask contents',[(x+a*scale,z+b*scale) for a,b in [(-.13,-.10),(.13,-.10),(.18,-.17),(-.18,-.17)]],d+.023,.012,'teal')
        else:
            shape('Leaf pictogram',[(-.20,-.16),(-.22,.02),(-.06,.20),(.23,.22),(.19,-.05),(.02,-.19)])
            face_prism('Leaf vein',[(x+a*scale,z+b*scale) for a,b in [(-.16,-.14),(-.13,-.16),(.15,.14),(.13,.16)]],d+.023,.012,'leaf_dark')

    def glyph(kind,x,z,d,s=1,role='cyan'):
        def shape(name,points):
            return face_prism(name,[(x+a*s,z+b*s) for a,b in points],d,.016,role)
        if kind=='code':
            left=[(-.12,.13),(-.17,.20),(-.38,0),(-.17,-.20),(-.12,-.13),(-.27,0)]
            shape('Code left bracket',left);shape('Code right bracket',[(-a,b) for a,b in left])
            shape('Code slash',[(-.07,-.22),(.01,-.22),(.12,.22),(.04,.22)])
        elif kind=='prompt':
            shape('Prompt chevron',[(-.3,.15),(-.24,.20),(-.02,0),(-.24,-.20),(-.3,-.15),(-.13,0)])
            shape('Prompt cursor',[(.05,-.16),(.30,-.16),(.30,-.21),(.05,-.21)])
        elif kind=='spark':
            shape('AI sparkle',[(0,.25),(.065,.065),(.25,0),(.065,-.065),(0,-.25),(-.065,-.065),(-.25,0),(-.065,.065)])
        elif kind=='chip':
            box('AI chip',(x,d,z),(.32*s,.035,.32*s),role,.012)
            for shift in (-.10,.10):
                for sign in (-1,1):
                    box('Chip pin',(x+shift*s,d,z+sign*.21*s),(.035*s,.03,.12*s),role,0)
                    box('Chip pin',(x+sign*.21*s,d,z+shift*s),(.12*s,.03,.035*s),role,0)
            glyph('spark',x,z,d+.03,s*.48,'navy')
    def copilot_badge(x,d,z,s=1,body=True):
        # Reuse the delivered source geometry, never redraw a local approximation.
        project=folder.parents[3]
        component=json.loads((project/'blender/environment/campus_pixel_copilot/v01/asset.json').read_text())
        source=project/component['source']['path']
        source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
        if source_hash!=component['delivery']['sourceHash']:
            raise RuntimeError('Export the edited pixel Copilot source before rebuilding consumers')
        with bpy.data.libraries.load(str(source),link=False) as (src,dst):
            if 'pixel_copilot' not in src.objects:raise RuntimeError('Missing canonical pixel_copilot mesh')
            dst.objects=['pixel_copilot']
        obj=dst.objects[0];scene.collection.objects.link(obj);obj.parent=None
        component_palette=component['texturePalettes'][0];cw,ch=component_palette['size']
        uv=obj.data.uv_layers['PaletteUV']
        for loop in uv.data:
            px,py=loop.uv.x*cw,(1-loop.uv.y)*ch
            role=next((name for name,entry in component_palette['roles'].items() if entry['rect'][0]<=px<entry['rect'][0]+entry['rect'][2] and entry['rect'][1]<=py<entry['rect'][1]+entry['rect'][3]),None)
            if role is None:raise RuntimeError('Unmapped component palette UV')
            if component_palette['roles'][role]['color']!=palette['roles'][role]['color']:raise RuntimeError('Component color mismatch')
            rx,ry,rw,rh=palette['roles'][role]['rect'];loop.uv=((rx+rw/2)/w,1-(ry+rh/2)/h)
        obj.data.materials.clear();obj.data.materials.append(mat)
        obj.location=(x,-(d-.056*s),z-.30*s);obj.scale=(1.2*s,)*3
        obj.name='Pixel Copilot instance';parts.append(obj)
        component_instances.append({'asset':component['id'],'version':component['version'],'sourceHash':source_hash,'position':[x,d-.056*s,z-.30*s],'scale':1.2*s})
    def circuit_front(x,d,z,span,height_scale=1):
        # Continuous planar, L-shaped inlay; no crossing beveled bars.
        pts=[(-span/2,-.025),(span*.05,-.025),(span*.05,.12),(span/2,.12),(span/2,.17),(0,.17),(0,.025),(-span/2,.025)]
        face_prism('Circuit trace',[(x+a,z+b*height_scale) for a,b in pts],d,.012,'cyan')
        for px,pz in [(-span/2,0),(span/2,.145)]:
            box('Circuit terminal',(x+px,d,z+pz*height_scale),(.10*height_scale,.018,.10*height_scale),'cyan',.015*height_scale)

    if asset_id=='campus_coffee_kiosk':
        prism('Clipped kiosk footing',clipped(4.2,3.6,.22),0,.16,'edge')
        box('Lower cream counter wall',(0,.55,.80),(3.2,.15,1.28),'chalk')
        box('Rear cream wall',(0,-1.15,1.54),(3.2,.15,2.76),'chalk')
        for x in (-1.53,1.53):
            box('Side wall',(x,-.30,1.54),(.16,1.7,2.76),'chalk')
            box('Hatch jamb',(x,.57,2.10),(.17,.22,1.46),'wood')
        for x in (-1.12,-.75,-.38,0,.38,.75,1.12):box('Counter wood slat',(x,.65,.83),(.30,.07,.86),'wood_light',.008)
        box('Prompt order display',(0,.705,.91),(2.22,.055,.63),'navy',.04)
        glyph('prompt',-.64,.92,.744,.9)
        circuit_front(.53,.746,.82,.74)
        box('Serving ledge',(0,.74,1.43),(3.45,.75,.14),'wood',.04)
        box('Interior shelf',(0,-.64,1.43),(2.85,.60,.14),'wood_light')
        box('Coffee machine',(.70,-.65,1.81),(.68,.43,.64),'glass',.045)
        box('Machine face',(.70,-.405,1.85),(.5,.05,.24),'teal',.01)
        box('Machine drip tray',(.70,-.32,1.55),(.64,.27,.06),'edge',.01)
        cylinder('Barista display mount',(-.65,.73,1.58),.10,.17,'edge')
        copilot_badge(-.65,.73,1.88,.85)
        mug(.70,-.34,1.59); mug(.80,.81,1.50)
        box('Roof trim',(0,-.25,2.98),(3.65,2.24,.18),'chalk',.06)
        # A solid sloping teal awning with a broad visible front fascia.
        face_prism('Awning fascia',[(-1.82,2.59),(1.82,2.59),(1.82,2.79),(-1.82,2.79)],1.09,.12,'teal',.025)
        mesh('Sloping awning',[(-1.82,.1,3.02),(1.82,.1,3.02),(1.82,1.14,2.80),(-1.82,1.14,2.80),(-1.82,.1,2.94),(1.82,.1,2.94),(1.82,1.14,2.72),(-1.82,1.14,2.72)],[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],'teal')
        for x in (-1.1,1.1):
            cylinder('Stool foot',(x,1.36,.20),.30,.08,'glass')
            cylinder('Stool pedestal',(x,1.36,.51),.085,.56,'edge')
            cylinder('Wood stool seat',(x,1.36,.84),.34,.14,'wood_light')
        box('Cup sign post',(0,-.34,3.24),(.13,.13,.40),'glass')
        icon('cup',0,3.77,-.32,2.4)
        # The familiar coffee sign wears the same AI eyes as its barista.
        box('Cup sign face',(0,-.286,3.73),(.60,.035,.31),'navy',.045)
        for x in (-.15,.15):box('Cup sign eye',(x,-.26,3.73),(.065,.025,.17),'cyan',.022)
        glyph('spark',.96,3.94,-.32,.8,'violet')
        box('Spark sign connection',(.77,-.35,3.78),(.38,.06,.065),'violet',0)
        ui=4.5
    elif asset_id=='campus_planter_bench':
        planter(1.22,0,1.05,1.25)
        for x in (-1.37,.49):box('Bench stone leg',(x,.10,.30),(.24,.68,.60),'edge')
        for d in (-.15,.1,.35):box('Seat slat',(-.43,d,.65),(2.34,.20,.14),'wood_light',.018)
        for x in (-1.35,.49):box('Backrest support',(x,-.32,.85),(.11,.12,.85),'glass',.012)
        box('Smart bench back panel',(-.43,-.31,1.045),(2.34,.14,.51),'navy',.035)
        circuit_front(-.43,-.231,1.01,1.74)
        ico('Shrub large',(1.28,-.24,.92),(.42,.35,.46),'teal'); ico('Shrub small',(.99,.21,.77),(.29,.30,.29),'leaf_light')
        copilot_badge(1.22,.66,.29,.49)
        flowers(1.38,.24,.46); ui=1.6
    elif asset_id=='campus_wayfinding_sign':
        prism('Sign footing',clipped(.90,.75),0,.13,'edge')
        box('Technology signpost',(0,0,1.38),(.20,.20,2.55),'glass')
        box('Post cap',(0,0,2.73),(.28,.28,.10),'chalk')
        for z,flip,role,kind in [(2.40,1,'teal','code'),(1.79,-1,'glass','chip'),(1.18,1,'violet','copilot')]:
            outline=[(-.95,-.25),(.82,-.25),(1.15,0),(.82,.25),(-.95,.25)]
            face_prism('Directional '+kind,[(x*flip,z+h) for x,h in outline],.18,.14,role,.025)
            if kind=='copilot':copilot_badge(-.28*flip,.27,z-.035,.64)
            else:glyph(kind,-.28*flip,z,.28,.85,'chalk')
            box('Blade fixing',(.65*flip,.273,z),(.07,.035,.07),'chalk',.01)
        ui=2.95
    elif asset_id=='campus_meeting_nook':
        prism('Meeting terrace',circle(2.25,n=16),0,.12,'edge')
        prism('Pale terrace surface',circle(2.18,n=16),.12,.15,'chalk')
        cylinder('Table foot',(0,0,.22),.44,.14,'glass')
        cylinder('Table pedestal',(0,0,.64),.16,.76,'edge')
        cylinder('Round table',(0,0,1.06),.95,.15,'wood_light',16)
        ring('Collaboration table rim',circle(.91,n=16),circle(.85,n=16),1.136,1.15,'cyan')
        cylinder('Collaboration touch surface',(0,0,1.14),.83,.025,'navy',16)
        for angle in (30,150,270):
            a=math.radians(angle); angles=[a+math.radians(t) for t in (-38,-19,0,19,38)]
            outline=[(1.73*math.cos(t),1.73*math.sin(t)) for t in angles]+[(1.30*math.cos(t),1.30*math.sin(t)) for t in reversed(angles)]
            prism('Curved timber bench',outline,.59,.73,'wood')
            for t in (angles[1],angles[-2]):box('Bench support',(1.52*math.cos(t),1.52*math.sin(t),.36),(.22,.22,.46),'edge')
        cylinder('Parasol mast',(0,0,1.85),.055,3.40,'glass')
        # Closed canopy sectors share boundaries, alternating muted coral/chalk.
        for i in range(12):
            a=i*math.tau/12; b=(i+1)*math.tau/12
            verts=[(0,0,3.57),(1.94*math.cos(a),1.94*math.sin(a),2.94),(1.94*math.cos(b),1.94*math.sin(b),2.94),(0,0,3.52),(1.94*math.cos(a),1.94*math.sin(a),2.88),(1.94*math.cos(b),1.94*math.sin(b),2.88)]
            mesh('Parasol canopy panel',verts,[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(2,5,3,0)],'violet' if i%3!=0 else 'chalk')
            if i%2==0:
                mid=(a+b)/2
                def roof_point(r,t):return (r*math.cos(t),r*math.sin(t),3.57-.63*r*math.cos(t-mid)/(1.94*math.cos(math.pi/12))+.012)
                mesh('Canopy circuit spoke',[roof_point(r,t) for r,t in [(.48,mid-.033), (1.47,mid-.025),(1.47,mid+.025),(.48,mid+.033)]],[(0,1,2,3)],'cyan')
                mesh('Canopy circuit node',[roof_point(r,t) for r,t in [(1.44,mid-.065),(1.63,mid-.06),(1.63,mid+.06),(1.44,mid+.065)]],[(0,1,2,3)],'cyan')
        ico('Parasol finial',(0,0,3.60),(.09,.09,.10),'wood')
        mug(-.46,.40,1.16); mug(-.25,-.55,1.16)
        box('Laptop base',(.22,.46,1.20),(.55,.36,.07),'edge',.018)
        box('Laptop screen bezel',(.22,.32,1.40),(.55,.065,.40),'violet',.028)
        box('Laptop code display',(.22,.36,1.42),(.47,.020,.30),'navy',.012)
        glyph('code',.22,1.42,.38,.44)
        # A mounted shared assistant display, sized as furniture rather than a tower.
        box('Collaboration console stalk',(.48,-.38,1.36),(.09,.09,.4),'edge',.012)
        copilot_badge(.48,-.35,1.65,.68)
        ui=3.85
    elif asset_id=='campus_code_sculpture':
        prism('Sculpture foundation',clipped(4.3,1.9,.23),0,.19,'edge')
        prism('Garden bed',clipped(4.08,1.68,.19),.19,.24,'soil')
        prism('Stone sculpture plinth',clipped(3.86,.92,.12),.24,.43,'chalk')
        box('Sculpture tech fascia',(0,.466,.333),(3.40,.025,.16),'navy',.014)
        for x in (-1.0,1.0):circuit_front(x,.488,.292,.66,.5)
        copilot_badge(0,.492,.324,.22)
        left=[(-.37,1.73),(-.55,1.96),(-1.57,1.17),(-.55,.43),(-.37,.66),(-1.14,1.18)]
        face_prism('Left angle bracket',left,0,.38,'chalk',.035)
        face_prism('Right angle bracket',[(-x,z) for x,z in left],0,.38,'chalk',.035)
        face_prism('Forward slash',[(-.33,.43),(-.02,.43),(.44,2.13),(.13,2.13)],0,.40,'teal',.028)
        glyph('spark',.19,1.63,.215,.41,'chalk')
        # Hidden-back supports seat the lifted angular corners on the plinth.
        for x in (-.50,.50): box('Bracket mounting shoe',(x,-.08,.48),(.23,.28,.14),'chalk',.01)
        for x,d in [(-1.75,.49),(1.70,-.50)]:
            ico('Low ornamental grass',(x,d,.38),(.25,.22,.20),'leaf_dark')
            flowers(x,d,.24)
        ui=2.5
    else: raise ValueError(asset_id)

    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts: obj.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]; bpy.ops.object.join(); obj=bpy.context.object; obj.name=asset_id
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True); obj.parent=root
    obj['component_dependencies']=json.dumps(component_instances,sort_keys=True)
    anchor=bpy.data.objects.new('anchor_ui',None); scene.collection.objects.link(anchor); anchor.parent=root; anchor.location=(0,0,ui)
    scene.frame_set(0); bpy.ops.wm.save_as_mainfile(filepath=str(destination))
