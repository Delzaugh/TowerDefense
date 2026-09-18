"""Source-authored campus surface atlas; no runtime tint or generated viewer texture."""
import bpy, math, struct, zlib, os
from pathlib import Path

SIZE=512
PATCH=(16,16,480,480)
COLORS={'chalk':'#6787A3','ground':'#354B64','shell':'#24354E','tile_seam':'#577693'}
ROLES=list(COLORS)
RADIUS=18.0
EDGE_TRANSITION=1.4

def rgb(hex_color):return tuple(int(hex_color[i:i+2],16) for i in (1,3,5))
def h(x,y):
    n=(x*374761393+y*668265263+941083987)&0xffffffff
    n=((n^(n>>13))*1274126177)&0xffffffff
    return ((n^(n>>16))&0xffffffff)/4294967295
def smooth(t):return t*t*(3-2*t)
def noise(x,y):
    ix,iy=math.floor(x),math.floor(y);fx,fy=smooth(x-ix),smooth(y-iy)
    return ((1-fx)*h(ix,iy)+fx*h(ix+1,iy))*(1-fy)+((1-fx)*h(ix,iy+1)+fx*h(ix+1,iy+1))*fy

def png(path,rows):
    def chunk(kind,data):return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
    raw=b''.join(b'\0'+row for row in rows)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',SIZE,SIZE,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))

def apply_surface(folder):
    base=rgb(COLORS['ground']);rows=[];px,py,pw,ph=PATCH
    for iy in range(SIZE):
        row=bytearray()
        for ix in range(SIZE):
            value=base
            if iy<8 and ix<len(ROLES)*8:
                value=rgb(COLORS[ROLES[ix//8]])
            elif px<=ix<px+pw and py<=iy<py+ph:
                x=(ix-px+.5)/pw*36-18;d=(iy-py+.5)/ph*36-18
                clearance=min(RADIUS*math.sqrt(3)/2-x*math.cos(math.pi/6+i*math.pi/3)-d*math.sin(math.pi/6+i*math.pi/3) for i in range(6))
                fade=smooth(max(0,min(1,clearance/EDGE_TRANSITION)))
                broad=(noise(x*.17+19,d*.17-7)-.5)*.022
                mineral=(noise(x*.85-4,d*.85+13)-.5)*.045
                grain=(h(ix,iy)-.5)*.06
                fleck=.038 if h(ix+352,iy-182)>.985 else 0
                delta=(broad+mineral+grain+fleck)*fade
                value=tuple(max(0,min(255,round(c*(1+delta)))) for c in base)
            row.extend(value)
        rows.append(bytes(row))
    dest=Path(os.environ.get('ASSET_BUILD_DIR',folder))
    texture_path=dest/'campus_surface_atlas.png';png(texture_path,rows)
    image=bpy.data.images.load(str(texture_path),check_existing=False);image.name='Campus mineral composite · packed 512 atlas';image.colorspace_settings.name='sRGB';image.pack()
    for obj in bpy.data.objects['root'].children_recursive:
        if obj.type!='MESH':continue
        data=obj.data;mapping=obj['palette_roles'];by_id={int(v):k for k,v in mapping['roles'].items()}
        role_attr=data.attributes[mapping['attribute']]
        uv=data.uv_layers.new(name='SurfaceAtlas')
        for poly in data.polygons:
            role=by_id[round(role_attr.data[poly.loop_start].value)]
            for li in poly.loop_indices:
                v=data.vertices[data.loops[li].vertex_index].co
                if role=='ground' and poly.normal.z>.99 and abs(v.z-1.20)<.002:
                    u=(16+(v.x+18)/36*480)/SIZE
                    vv=1-(16+(-v.y+18)/36*480)/SIZE
                else:
                    slot=ROLES.index(role);u=(slot*8+4)/SIZE;vv=1-4/SIZE
                uv.data[li].uv=(u,vv)
        for attr in list(data.color_attributes):data.color_attributes.remove(attr)
        for mat in data.materials:
            mat.use_nodes=True;nodes=mat.node_tree.nodes;links=mat.node_tree.links
            bs=nodes.get('Principled BSDF')
            for link in list(bs.inputs['Base Color'].links):links.remove(link)
            for node in list(nodes):
                if node.bl_idname in ('ShaderNodeVertexColor','ShaderNodeTexImage','ShaderNodeUVMap'):nodes.remove(node)
            tex=nodes.new('ShaderNodeTexImage');tex.name='Packed mineral surface and frame swatches';tex.image=image;tex.interpolation='Linear';tex.extension='EXTEND'
            uvnode=nodes.new('ShaderNodeUVMap');uvnode.uv_map=uv.name
            links.new(uvnode.outputs['UV'],tex.inputs['Vector']);links.new(tex.outputs['Color'],bs.inputs['Base Color'])
            bs.inputs['Base Color'].default_value=(1,1,1,1);bs.inputs['Roughness'].default_value=.92
        obj['surface_profile']='mineral_composite'
        obj['surface_contract']='18 m hex radius; flat interface y=1.20 m; 1.4 m quiet boundary; interior terrain may vary in future variants'
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(dest/os.environ.get('ASSET_SOURCE_NAME','campus_base_hex_v01.blend')))
    print('SURFACE_ATLAS: packed 512x512 mineral composite, preserved frame swatches, shared metric UV mapping')


