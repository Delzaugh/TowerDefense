"""Stage an existing Blender source as a solid palette-texture asset.

Called only by guarded delivery. No geometry rebuild, original-source write,
or artistic recolouring. Semantic IDs remain for editable source selections.
"""
import bpy, json, sys, hashlib, math, struct, zlib
from pathlib import Path

args=sys.argv[sys.argv.index('--')+1:]
manifest_path,source,destination=map(Path,args[:3])
m=json.loads(manifest_path.read_text(encoding='utf-8'))
allow_texture_source='--rebuild' in args[3:]
bpy.ops.wm.open_mainfile(filepath=str(source))
objects=[o for o in bpy.data.objects['root'].children_recursive if o.type=='MESH']

def geometry_hash():
    rows=[]
    for o in objects:
        d=o.data
        rows.append({'name':o.name,'positions':[list(v.co) for v in d.vertices],
          'faces':[(list(p.vertices),p.material_index) for p in d.polygons],
          'weights':[[(g.group,g.weight) for g in v.groups] for v in d.vertices],
          'shapes':{k.name:[list(v.co) for v in k.data] for k in d.shape_keys.key_blocks} if d.shape_keys else {}})
    return hashlib.sha256(json.dumps(rows,sort_keys=True).encode()).hexdigest()

before=geometry_hash()
def srgb(c):return 12.92*c if c<=.0031308 else 1.055*c**(1/2.4)-.055
def linear(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
roles={};usage={};loop_roles={};materials={};max_error=0
for o in objects:
    d=o.data
    if not d.color_attributes and not allow_texture_source:raise RuntimeError('Expected source colour data: '+o.name)
    mapping=o.get('palette_roles')
    if not mapping:raise RuntimeError('Semantic role mapping required: '+o.name)
    by_id={int(v):k for k,v in mapping['roles'].items()}
    attribute=d.attributes[mapping['attribute']]
    color=d.color_attributes.get('Color') or d.color_attributes.active_color
    if (color and color.domain!='CORNER') or attribute.domain!='CORNER':raise RuntimeError('Expected face-corner palette attributes')
    # Derived recipe components may already inherit a packed solid palette.
    # Repack used roles after a rebuild; explicit migration still rejects a
    # second conversion. Raw byte-image pixels are sRGB, unlike Color data.
    sampled={}
    if not color:
        for polygon in d.polygons:
            mat=d.materials[polygon.material_index];bs=mat.node_tree.nodes.get('Principled BSDF')
            links=list(bs.inputs['Base Color'].links) if bs else []
            if len(links)!=1 or links[0].from_node.bl_idname!='ShaderNodeTexImage':raise RuntimeError('Rebuild requires direct palette image')
            tex=links[0].from_node;img=tex.image
            uv_links=list(tex.inputs['Vector'].links)
            if not img or img.is_float or img.colorspace_settings.name!='sRGB' or len(uv_links)!=1 or uv_links[0].from_node.bl_idname!='ShaderNodeUVMap':raise RuntimeError('Unsupported inherited palette source')
            old_uv=d.uv_layers[uv_links[0].from_node.uv_map];w,h=img.size;pixels=list(img.pixels)
            for i in polygon.loop_indices:
                u,v=old_uv.data[i].uv;x=min(w-1,max(0,int(u*w)));y=min(h-1,max(0,int(v*h)))
                rgba=pixels[(y*w+x)*4:(y*w+x)*4+4]
                sampled[i]=tuple(linear(c) for c in rgba[:3])+(rgba[3],)
    obj_roles=[]
    for i in range(len(d.loops)):
        name=by_id[round(attribute.data[i].value*mapping.get('scale',1))]
        rgba=color.data[i].color if color else sampled[i]
        if abs(rgba[3]-1)>1e-6:raise RuntimeError('Vertex alpha needs a separate conversion decision')
        rgb=tuple(max(0,min(255,round(srgb(c)*255))) for c in rgba[:3])
        error=max(abs(linear(rgb[j]/255)-rgba[j]) for j in range(3));max_error=max(max_error,error)
        if error>0.002:raise RuntimeError('Palette quantization needs visual investigation: '+name)
        hexcolor='#'+''.join(f'{c:02X}' for c in rgb)
        if name in roles and roles[name]!=hexcolor:raise RuntimeError('Role has multiple colours: '+name)
        roles[name]=hexcolor;obj_roles.append(name)
    loop_roles[o.name]=obj_roles
    for p in d.polygons:
        mat=d.materials[p.material_index];materials[mat.name]=mat
        usage.setdefault(mat.name,set()).update(obj_roles[i] for i in p.loop_indices)

names=sorted(roles);tile=4;columns=min(8,max(1,len(names)))
width=2**math.ceil(math.log2(columns*tile));height=2**math.ceil(math.log2(math.ceil(len(names)/columns)*tile))
rects={n:[(i%columns)*tile,(i//columns)*tile,tile,tile] for i,n in enumerate(names)}
pixels=bytearray([255]*(width*height*4))
for name,(x,y,w,h) in rects.items():
    rgba=bytes.fromhex(roles[name][1:])+b'\xff'
    for py in range(y,y+h):
        for px in range(x,x+w):pixels[(py*width+px)*4:(py*width+px+1)*4]=rgba
def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data))
scan=b''.join(b'\0'+pixels[y*width*4:(y+1)*width*4] for y in range(height))
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,8,6,0,0,0))+chunk(b'sRGB',b'\0')+chunk(b'IDAT',zlib.compress(scan,9))+chunk(b'IEND',b'')
image_path=destination.parent/'palette.png';image_path.write_bytes(png)
image=bpy.data.images.load(str(image_path),check_existing=False);image.name=m['id']+'_palette';image.colorspace_settings.name='sRGB';image.pack();image.filepath='//palette.png'
uv_name='PaletteUV'
for o in objects:
    d=o.data
    if d.uv_layers.get(uv_name) and not allow_texture_source:raise RuntimeError('PaletteUV already exists; inspect before converting twice')
    # Existing UV channels stay untouched, including independent emission UVs.
    uv=d.uv_layers.get(uv_name) or d.uv_layers.new(name=uv_name)
    for i,role in enumerate(loop_roles[o.name]):
        x,y,w,h=rects[role];uv.data[i].uv=((x+w/2)/width,1-(y+h/2)/height)
    for c in list(d.color_attributes):d.color_attributes.remove(c)
for name,mat in materials.items():
    nodes,links=mat.node_tree.nodes,mat.node_tree.links
    bs=nodes.get('Principled BSDF')
    if not bs:raise RuntimeError('Expected Principled material: '+name)
    base_links=list(bs.inputs['Base Color'].links)
    allowed_nodes={'ShaderNodeVertexColor','ShaderNodeTexImage'} if allow_texture_source else {'ShaderNodeVertexColor'}
    if len(base_links)!=1 or base_links[0].from_node.bl_idname not in allowed_nodes:raise RuntimeError('Unsupported base colour graph: '+name)
    links.remove(base_links[0])
    for link in list(bs.inputs['Emission Color'].links):
        if link.from_node.bl_idname=='ShaderNodeVertexColor':
            # glTF has no vertex emission channel; preserve the existing
            # exported white factor rather than introducing coloured emission.
            links.remove(link);bs.inputs['Emission Color'].default_value=(1,1,1,1)
    for node in list(nodes):
        if node.bl_idname=='ShaderNodeVertexColor' and not any(s.is_linked for s in node.outputs):nodes.remove(node)
    tex=nodes.new('ShaderNodeTexImage');tex.name='Palette texture';tex.image=image;tex.interpolation='Linear';tex.extension='EXTEND'
    uvnode=nodes.new('ShaderNodeUVMap');uvnode.uv_map=uv_name
    links.new(uvnode.outputs['UV'],tex.inputs['Vector']);links.new(tex.outputs['Color'],bs.inputs['Base Color'])

assert geometry_hash()==before,'Source geometry/morph/skin data changed'
m['texturePalettes']=[{'material':name,'size':[width,height],'roles':{r:{'color':roles[r],'rect':rects[r]} for r in names if r in used}} for name,used in sorted(usage.items())]
original_palette=m.get('palette',{})
m['palette']={**original_palette,'storage':'texture','colors':{**original_palette.get('colors',{}),**roles}}
m['exportSettings']={**m.get('exportSettings',{}),'paletteSampler':'linear','paletteTextureWorkflow':True}
# One shared base image across all material families, plus existing maps.
other_images={node.image.name for mat in materials.values() for node in mat.node_tree.nodes if node.bl_idname=='ShaderNodeTexImage' and node.image and node.image!=image and any(s.is_linked for s in node.outputs)}
m['budgets']['textures']=max(m['budgets']['textures'],1+len(other_images))
m['budgets']['textureSize']=max(m['budgets']['textureSize'],width,height)
manifest_path.write_text(json.dumps(m,indent=2)+'\n')
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
audit={'asset':m['id'],'geometryHash':before,'maxLinearColorError':max_error,'size':[width,height],
       'materials':list(materials),'usedRoles':len(roles),'otherImages':sorted(other_images),'sourceInput':str(source)}
(destination.parent/'palette_source_conversion.json').write_text(json.dumps(audit,indent=2)+'\n')
print('PALETTE_CONVERSION',json.dumps(audit))
