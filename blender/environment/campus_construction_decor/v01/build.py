"""Construction district: calm unfinished frame and compact tower crane."""
import bpy, math, os, json, struct, zlib
from pathlib import Path
from mathutils import Vector
folder=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
palette={'concrete':'#B7B8AC','frame':'#D7DFDD','steel':'#537086','yellow':'#E2B45D','dark':'#334958','office':'#86A8B3','glass':'#355D75','white':'#E6E7D9','wood':'#B68D62','orange':'#D18B5B','soil':'#89785F'}
mat=bpy.data.materials.new('construction_palette');mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.9
# Tiny padded swatches, packed in source and embedded in runtime.
texture=Path(os.environ.get('ASSET_BUILD_DIR',folder))/'construction_palette.png'
def png(path,rows):
 def chunk(kind,data):return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
 path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',64,4,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(b'\0'+r for r in rows),9))+chunk(b'IEND',b''))
row=bytes([int(list(palette.values())[min(xx//4,len(palette)-1)][i:i+2],16) for xx in range(64) for i in (1,3,5)])
png(texture,[row]*4)
image=bpy.data.images.load(str(texture),check_existing=False);image.name='Construction palette';image.colorspace_settings.name='sRGB';image.pack()
tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Closest';mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
uvnode=mat.node_tree.nodes.new('ShaderNodeUVMap');uvnode.uv_map='Palette';mat.node_tree.links.new(uvnode.outputs['UV'],tex.inputs['Vector'])
parts=[]
def finish(obj,name,role):
 obj.name=name;bpy.context.view_layer.objects.active=obj
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 obj.data.materials.clear();obj.data.materials.append(mat)
 uv=obj.data.uv_layers.new(name='Palette')
 for loop in uv.data:loop.uv=((list(palette).index(role)*4+2)/64,.5)
 parts.append(obj);return obj
def box(name,x,z,y,w,d,h,role,bevel=.035):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y));o=bpy.context.object;o.dimensions=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if min(w,d,h)<.25:bevel=0
 if bevel:
  m=o.modifiers.new('Soft manufactured edge','BEVEL');m.width=bevel;m.segments=1;bpy.ops.object.modifier_apply(modifier=m.name)
 return finish(o,name,role)
def beam(name,a,b,width,depth,role):
 va=Vector((a[0],-a[1],a[2]));vb=Vector((b[0],-b[1],b[2]));delta=vb-va
 o=box(name,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,width,depth,delta.length,role,.018)
 o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();return o
def cylinder(name,x,z,y,radius,height,role,vertices=10):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=height,location=(x,-z,y));return finish(bpy.context.object,name,role)

# Main building is deliberately incomplete: open skeleton, one partial mezzanine.
# 9.6 x 8 foundation, west of the reserved route; sole slab height is 0.18 m.
box('Continuous poured foundation',-5.4,1,.09,9.6,8,.18,'concrete',.055)
for x in (-9.4,-5.4,-1.4):
 for z in (-2.2,4.2):
  box('Square column footing',x,z,.31,.95,.95,.26,'frame')
  box('Precast upright',x,z,2.36,.43,.43,3.84,'frame')
for z in (-2.2,4.2):box('Long lintel',-5.4,z,4.45,8.43,.46,.34,'frame')
for x in (-9.4,-5.4,-1.4):box('Roof cross beam',x,1,4.45,.43,6.4-.46,.34,'frame')
# Left bay has the first upper floor poured; right bay is visibly open.
box('Partial first floor',-7.4,1,2.65,4.3,6.85,.24,'concrete')
# Frame members stop at the column faces: no through-column end caps or
# coplanar blue/white surfaces. Their .34 m width fits the column's flat face
# between its bevels. The top at 2.53 meets the mezzanine underside exactly.
for z in (-2.2,4.2):
 for x in (-7.4,-3.4):box('Floor bay beam',x,z,2.36,4-.43,.34,.34,'steel',.018)
for x in (-9.4,-5.4):box('Floor edge beam',x,1,2.36,.34,6.4-.43,.34,'steel',.018)
# Two broad wall courses make unfinished construction readable without noise.
box('Unfinished low wall',-9.4,1,.81,.5,5.8,1.26,'concrete')
box('Unfinished end wall',-7.6,4.2,.81,3.2,.5,1.26,'concrete')

# A compact tower crane anchors the construction silhouette behind the frame.
cx,cz=-3.0,8.5
box('Crane ballast base',cx,cz,.23,2.8,2.5,.46,'steel',.07)
for dx in (-.46,.46):
 for dz in (-.46,.46):box('Crane mast chord',cx+dx,cz+dz,4.75,.15,.15,9.04,'yellow',.018)
for y in (1,2.8,4.6,6.4,8.2,9.25):
 box('Mast horizontal tie',cx,cz-.46,y,1.07,.13,.13,'yellow',.015)
 box('Mast reverse tie',cx,cz+.46,y,1.07,.13,.13,'yellow',.015)
for y in (1,2.8,4.6,6.4):
 for dz in (-.46,.46):beam('Mast diagonal',(cx-.46,cz+dz,y),(cx+.46,cz+dz,y+1.8),.10,.10,'yellow')
box('Crane rotating head',cx,cz,9.5,1.45,1.4,.5,'steel')
box('Crane operator cab',cx+.58,cz-.55,9.4,1.25,1.1,1.05,'yellow',.06)
box('Crane cab glazing',cx+.58,cz-1.112,9.52,.9,.03,.55,'glass',.01)
# Boom spans only west of route, never into x >= 2.2.
for zoff in (-.36,.36):
 box('Continuous crane boom chord',-5.1,cz+zoff,10.02,9,.13,.16,'yellow',.018)
 box('Upper boom chord',-5.1,cz+zoff,10.75,9,.13,.16,'yellow',.018)
for x in (-9.6,-8.1,-6.6,-5.1,-3.6,-2.1,-.6):
 box('Boom cross member',x,cz,10.02,.14,.83,.14,'yellow',.014)
for x in (-9.6,-8.1,-6.6,-5.1,-3.6,-2.1):
 for dz in (-.36,.36):beam('Boom diagonal',(x,cz+dz,10.02),(x+1.5,cz+dz,10.75),.10,.10,'yellow')
box('Counterweight',-.9,cz,9.54,1.5,1.45,.64,'concrete',.07)
cylinder('Suspended cable',-8.4,cz,8.2,.037,3.5,'dark',6)
box('Hook block',-8.4,cz,6.38,.48,.38,.46,'yellow',.06)
beam('Hook stem',(-8.4,cz,6.17),(-8.4,cz,5.90),.11,.11,'dark')
beam('Hook toe',(-8.4,cz,5.90),(-8.15,cz,5.90),.11,.11,'dark')

# East service cluster keeps a generous route gap, with a clear friendly office.
box('Site office footing',9.1,-2.8,.12,4.8,6.2,.24,'concrete',.06)
box('Site office body',9.1,-2.8,1.72,4.4,5.8,2.96,'office',.09)
box('Office roof cap',9.1,-2.8,3.3,4.7,6.1,.2,'white',.05)
for z in (-4.4,-2.6):
 box('Office window frame',6.883,z,2.04,.08,1.43,1.20,'white',.02)
 box('Office inset glass',6.835,z,2.04,.03,1.19,.96,'glass',.008)
box('Office door',6.87,-.4,1.4,.09,1.1,2.27,'steel',.02)
box('Office door glass',6.816,-.4,1.77,.03,.75,.92,'glass',.008)
box('Door step',6.61,-.4,.14,.50,1.36,.28,'concrete',.025)
box('Office fascia',9.1,-5.717,2.63,3.15,.055,.40,'white',.015)
for x in (8.4,9.1,9.8):box('Simple work progress mark',x,-5.755,2.63,.35,.02,.16,'yellow',.008)

# Stored stock at the south-west, grouped into two large readable piles.
for y in (.12,.4,.68):
 for x in (-8.4,-7.55,-6.7):box('Stacked timber',x,-7.3,y,.67,3,.22,'wood',.025)
for y in (.18,.54):
 for x in (-3.8,-2.85):box('Pallet concrete blocks',x,-7.25,y,.78,1.35,.32,'concrete',.025)
for x in (-4.2,-2.6):box('Stock pallet runner',x,-7.25,.045,.15,1.75,.09,'wood',.006)
# A few robust barriers establish a site boundary; no fence hides the scene.
def barrier(x,z,length):
 for dx in (-length/2+.2,length/2-.2):
  box('Barrier foot',x+dx,z,.10,.52,.64,.20,'steel',.028)
  box('Barrier upright',x+dx,z,.64,.13,.13,1.02,'white',.012)
 box('Safety barrier board',x,z,1.05,length,.16,.39,'orange',.025)
 for dx in (-length*.3,0,length*.3):box('Barrier white marker',x+dx,z-.085,1.05,.27,.018,.28,'white',.005)
barrier(-7,-10.4,3.4);barrier(-2.3,-10.4,3.4);barrier(9.0,3.0,3.2)

bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();obj=bpy.context.object;obj.name='Construction district decor'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);obj.parent=root
obj['placement_contract']='Root on tile y=1.20; corridor x=2.2..5.8 to z=6 kept clear; building slab top local y=.18'
scene.frame_set(0);bpy.context.preferences.filepaths.save_version=0
dest=Path(os.environ.get('ASSET_BUILD_DIR',folder));dest.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(dest/os.environ.get('ASSET_SOURCE_NAME','campus_construction_decor_v01.blend')))
