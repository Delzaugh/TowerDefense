"""Build an editable, manifold extrusion from tessellated upstream SVG paths."""
import bpy, bmesh, json, os, struct, zlib
from pathlib import Path
folder=Path(asset_folder)
manifest=json.loads((folder/'asset.json').read_text())
geometry=json.loads((folder/'geometry.json').read_text())
destination=Path(os.environ.get('ASSET_BUILD_DIR',folder))/os.environ.get('ASSET_SOURCE_NAME',manifest['id']+'_'+manifest['version']+'.blend')
destination.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
root['attribution']='Adapted from Microsoft and contributors, vscode-codicons, CC-BY-4.0'
root['source_url']='https://github.com/microsoft/vscode-codicons/blob/'+geometry['upstreamCommit']+'/src/icons/'+geometry['name']+'.svg'
root['license_url']='https://creativecommons.org/licenses/by/4.0/'
root['modifications']='Curve tessellation, 0.60 m maximum span, 0.06 m extrusion and neutral palette.'
data=bpy.data.meshes.new(manifest['id']+'_outline')
data.from_pydata(geometry['vertices'],[],geometry['faces']);data.update()
for poly,role in zip(data.polygons,geometry['roles']):poly.material_index=role
bm=bmesh.new();bm.from_mesh(data)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.normal_update()
assert all(e.is_manifold for e in bm.edges), 'Extrusion contains open or non-manifold edges'
assert all(f.calc_area()>1e-14 for f in bm.faces), 'Degenerate extrusion face'
bm.to_mesh(data);bm.free()
roles=['icon_face','icon_edge']
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
obj=bpy.data.objects.new('codicon_'+geometry['name'],data);scene.collection.objects.link(obj);obj.parent=root
obj['component_asset']=manifest['id']+'/'+manifest['version']
obj['palette_roles_order']=roles
anchor=bpy.data.objects.new('anchor_ui',None);scene.collection.objects.link(anchor);anchor.parent=root;anchor.location=(0,0,geometry['dimensions'][1]+.07)
bpy.context.view_layer.objects.active=obj;obj.select_set(True)
scene.frame_set(0);bpy.ops.wm.save_as_mainfile(filepath=str(destination))
