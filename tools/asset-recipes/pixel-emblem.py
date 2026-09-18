"""Shared closed pixel-emblem builder. Art lives in each versioned pixel_design.json."""
import bpy, bmesh, json, os, math, struct, zlib
from pathlib import Path

folder=Path(asset_folder)
manifest=json.loads((folder/'asset.json').read_text())
destination=Path(os.environ.get('ASSET_BUILD_DIR',folder))/os.environ.get('ASSET_SOURCE_NAME',manifest['id']+'_'+manifest['version']+'.blend')
destination.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)

design=json.loads((folder/'pixel_design.json').read_text())
rows=design['rows'];cols=len(rows[0]);height=len(rows)
assert all(len(row)==cols for row in rows)
roles=list(design['letters'].values())
by_letter={letter:i for i,letter in enumerate(design['letters'])}
occupied={(x,y):by_letter[c] for y,row in enumerate(rows) for x,c in enumerate(row) if c!='.'}
assert occupied and all(c=='.' or c in by_letter for row in rows for c in row)
# Require a single edge-connected silhouette; pixels only touching at corners
# would not form a sound extrusion.
seen=set();todo=[next(iter(occupied))]
while todo:
    cell=todo.pop()
    if cell in seen:continue
    seen.add(cell);x,y=cell
    todo.extend(n for n in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)] if n in occupied and n not in seen)
assert len(seen)==len(occupied), 'Detached pixel islands'
step=design['pixel_size'];depth=design['depth']
verts=[];indices={};faces=[];face_roles=[]
def vertex(x,y,front):
    key=(x,y,front)
    if key not in indices:
        indices[key]=len(verts);verts.append(((x-cols/2)*step,-depth/2 if front else depth/2,(height-y)*step))
    return indices[key]
def face(points,role):faces.append(tuple(vertex(*p) for p in points));face_roles.append(role)
for (x,y),role in occupied.items():
    face([(x,y,1),(x+1,y,1),(x+1,y+1,1),(x,y+1,1)],role)
    face([(x,y,0),(x,y+1,0),(x+1,y+1,0),(x+1,y,0)],0)
    for neighbor,a,b in [((x,y-1),(x,y),(x+1,y)),((x+1,y),(x+1,y),(x+1,y+1)),((x,y+1),(x+1,y+1),(x,y+1)),((x-1,y),(x,y+1),(x,y))]:
        if neighbor not in occupied:face([(*a,0),(*b,0),(*b,1),(*a,1)],0)
data=bpy.data.meshes.new('Pixel silhouette');data.from_pydata(verts,[],faces);data.update()
for poly,role in zip(data.polygons,face_roles):poly.material_index=role
bm=bmesh.new();bm.from_mesh(data)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
bm.normal_update()
# Merge coplanar pixels, preserving color-region boundaries; this is not a
# pile of separate cubes. The silhouette remains a connected closed solid.
bmesh.ops.dissolve_limit(bm,angle_limit=.001,verts=list(bm.verts),edges=list(bm.edges),delimit={'MATERIAL'})
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
assert all(e.is_manifold for e in bm.edges), 'Pixel solid must be manifold'
bm.to_mesh(data);bm.free()

palette=manifest['texturePalettes'][0];w,h=palette['size'];pixels=bytearray([255]*(w*h*4))
for entry in palette['roles'].values():
    x,y,rw,rh=entry['rect'];rgba=bytes.fromhex(entry['color'][1:])+b'\xff'
    for py in range(y,y+rh):
        for px in range(x,x+rw):pixels[(py*w+px)*4:(py*w+px+1)*4]=rgba
def chunk(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d))
scan=b''.join(b'\0'+pixels[y*w*4:(y+1)*w*4] for y in range(h))
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'sRGB',b'\0')+chunk(b'IDAT',zlib.compress(scan,9))+chunk(b'IEND',b'')
image_path=destination.parent/'palette.png';image_path.write_bytes(png)
image=bpy.data.images.load(str(image_path),check_existing=False);image.name=palette['material'];image.pack();image.filepath='//palette.png'
mat=bpy.data.materials.new(palette['material']);mat.use_nodes=True
bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.85
tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Linear'
uvnode=mat.node_tree.nodes.new('ShaderNodeUVMap');uvnode.uv_map='PaletteUV'
mat.node_tree.links.new(uvnode.outputs['UV'],tex.inputs['Vector']);mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
data.materials.append(mat);uv=data.uv_layers.new(name='PaletteUV')
for poly in data.polygons:
    name=roles[poly.material_index];x,y,rw,rh=palette['roles'][name]['rect']
    for li in poly.loop_indices:uv.data[li].uv=((x+rw/2)/w,1-(y+rh/2)/h)
    poly.material_index=0
obj=bpy.data.objects.new(design['object_name'],data);scene.collection.objects.link(obj);obj.parent=root
obj['component_asset']=manifest['id']+'/'+manifest['version']
obj['palette_roles_order']=roles
anchor=bpy.data.objects.new('anchor_ui',None);scene.collection.objects.link(anchor);anchor.parent=root;anchor.location=(0,0,height*step+.07)
bpy.context.view_layer.objects.active=obj;obj.select_set(True)
scene.frame_set(0);bpy.ops.wm.save_as_mainfile(filepath=str(destination))
