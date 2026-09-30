"""A compact civic monument court, registered at its campus tile centre."""
import bpy, math, os, struct, zlib
from pathlib import Path
folder=Path(__file__).resolve().parent;dest=Path(os.environ.get('ASSET_BUILD_DIR',folder));dest.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
colors={'stone':'#DBE2DB','base':'#81979F','metal':'#354B64','wood':'#BAA68C','aqua':'#8CD4CD','soil':'#5D6962','leaf':'#7AA58A','leaf_light':'#A9B99A'}
roles=list(colors);W=64;H=8
raw=b''.join(b'\0'+b''.join(bytes.fromhex(colors[roles[x//8]][1:]) for x in range(W)) for y in range(H))
def chunk(k,d):return struct.pack('!I',len(d))+k+d+struct.pack('!I',zlib.crc32(k+d)&0xffffffff)
p=dest/'civic_decor_palette.png';p.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',W,H,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b''))
image=bpy.data.images.load(str(p),check_existing=False);image.name='Civic court palette';image.colorspace_settings.name='sRGB';image.pack()
mat=bpy.data.materials.new('civic_palette');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.86
tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Closest';mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
parts=[]
def finish(o,name,role):
    o.name=name;bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.clear();o.data.materials.append(mat)
    for layer in list(o.data.uv_layers):o.data.uv_layers.remove(layer)
    uv=o.data.uv_layers.new(name='CivicPalette')
    for d in uv.data:d.uv=((roles.index(role)*8+4)/W,.5)
    parts.append(o);return o
def box(name,x,z,y,w,d,h,role,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y));o=bpy.context.object;o.dimensions=(w,d,h)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('One plane softened corners','BEVEL');m.width=bevel;m.segments=1;bpy.ops.object.modifier_apply(modifier=m.name)
    return finish(o,name,role)
def mesh(name,verts,faces,role):
    d=bpy.data.meshes.new(name);d.from_pydata([(x,-z,y) for x,z,y in verts],[],faces);d.update();o=bpy.data.objects.new(name,d);scene.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');return finish(o,name,role)
# The court stays in [-6,-2] x [11,14]. Footings are separate from the tile.
box('Monument low plinth',-4,11.95,.10,1.35,1.1,.20,'base',.06)
box('Monument limestone seat',-4,11.95,.255,1.10,.86,.11,'stone',.035)
# Closed continuous portal, front/back ring faces with constant rectangular opening.
outer=[(-.52,.31),(.52,.31),(.52,1.97),(.35,2.14),(-.35,2.14),(-.52,1.97)]
inner=[(-.28,.58),(.28,.58),(.28,1.78),(.18,1.88),(-.18,1.88),(-.28,1.78)]
v=[(-4+x,11.95+d,y) for d in (-.18,.18) for loop in (outer,inner) for x,y in loop];faces=[];n=6
for i in range(n):
    j=(i+1)%n;faces.extend([(i,j,j+n,i+n),(i+2*n,i+3*n,j+3*n,j+2*n),(i,i+2*n,j+2*n,j),(i+n,j+n,j+3*n,i+3*n)])
mesh('Continuous civic gateway',v,faces,'stone')
box('Suspension stem',-4,11.95,1.73,.05,.05,.34,'metal',.008)
mesh('Aqua civic crystal',[(-4,11.95,1.72),(-4,11.95,1.00),(-4-.23,11.95,1.36),(-4,11.72,1.36),(-4+.23,11.95,1.36),(-4,12.18,1.36)],[(0,2,3),(0,3,4),(0,4,5),(0,5,2),(1,3,2),(1,4,3),(1,5,4),(1,2,5)],'aqua')
# Two parallel benches face toward the monument and retain clean joinery.
for x,sign in [(-5.35,-1),(-2.65,1)]:
    for z in (11.90,12.87):box('Bench sled foot',x,z,.06,.60,.16,.12,'metal',.02)
    for z in (11.90,12.87):box('Bench support',x,z,.245,.12,.12,.37,'metal',.015)
    for dx in (-.16,.0,.16):box('Bench timber seat',x+dx,12.39,.465,.135,1.50,.10,'wood',.018)
    for z in (11.90,12.87):box('Backrest upright',x+sign*.25,z,.655,.065,.08,.60,'metal',.01)
    for y in (.75,.91):box('Bench timber back',x+sign*.245,12.39,y,.09,1.50,.135,'wood',.018)
# Low planted pockets behind the seating; open soil sits visibly below the lip.
for x in (-5.25,-2.75):
    box('Planter foot',x,13.60,.06,.78,.66,.12,'base',.04)
    box('Planter soil',x,13.60,.22,.61,.48,.22,'soil',.015)
    for dx in (-.36,.36):box('Planter side rim',x+dx,13.60,.245,.10,.66,.37,'stone',.018)
    for z in (13.32,13.88):box('Planter end rim',x,z,.245,.62,.10,.37,'stone',.018)
    for dx,dz,h,r in [(-.16,0,.58,.25),(.14,-.03,.63,.26),(0,.14,.55,.23)]:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(x+dx,-(13.60+dz),h));o=bpy.context.object;o.scale=(r,r*.8,r*.95);finish(o,'Faceted low planting','leaf' if dx<0 else 'leaf_light')
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();obj=bpy.context.object;obj.name='campus_civic_decor';bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);obj.parent=root
obj['placement_contract']='Origin equals civic tile centre. Bounds restricted to south pocket x[-6,-2],z[11,14]. Place at tile y1.2.'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(dest/os.environ.get('ASSET_SOURCE_NAME','campus_civic_decor_v01.blend')))
