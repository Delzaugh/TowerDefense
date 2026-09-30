"""Campus utility yard: friendly cream substation, paired cooling bank and tanks."""
import bpy, math, os, struct, zlib
from pathlib import Path
from mathutils import Vector
folder=Path(__file__).resolve().parent;dest=Path(os.environ.get('ASSET_BUILD_DIR',folder));dest.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
root=bpy.data.objects.new('root',None);scene.collection.objects.link(root)
colors={'cream':'#DCDDD0','slate':'#4B6375','teal':'#6FAEAB','dark':'#31485B','concrete':'#ACB4AF','yellow':'#CABB7C','pale':'#C0D8D3','metal':'#859B9F'}
roles=list(colors);W=64;H=8
raw=b''.join(b'\0'+b''.join(bytes.fromhex(colors[roles[x//8]][1:]) for x in range(W)) for y in range(H))
def chunk(k,d):return struct.pack('!I',len(d))+k+d+struct.pack('!I',zlib.crc32(k+d)&0xffffffff)
p=dest/'utility_palette.png';p.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',W,H,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b''))
image=bpy.data.images.load(str(p),check_existing=False);image.name='Utility yard palette';image.colorspace_settings.name='sRGB';image.pack()
mat=bpy.data.materials.new('utility_palette');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.86
tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Closest';mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);parts=[]
def finish(o,name,role):
    o.name=name;bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.clear();o.data.materials.append(mat)
    for layer in list(o.data.uv_layers):o.data.uv_layers.remove(layer)
    uv=o.data.uv_layers.new(name='UtilityPalette')
    for d in uv.data:d.uv=((roles.index(role)*8+4)/W,.5)
    parts.append(o);return o
def box(name,x,z,y,w,d,h,role,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y));o=bpy.context.object;o.dimensions=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('Soft chunky edge','BEVEL');m.width=bevel;m.segments=1;bpy.ops.object.modifier_apply(modifier=m.name)
    return finish(o,name,role)
def cyl(name,x,z,y,r,h,role,n=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=h,location=(x,-z,y));return finish(bpy.context.object,name,role)
def pipe(name,a,b,r,role):
    va=Vector((a[0],-a[1],a[2]));vb=Vector((b[0],-b[1],b[2]));dv=vb-va
    bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=r,depth=dv.length,location=(va+vb)/2);o=bpy.context.object;o.rotation_euler=dv.to_track_quat('Z','Y').to_euler();return finish(o,name,role)
# West primary mass. Broad walls, shallow teal service canopy, quiet roof.
box('Substation footing',-7.25,-.4,.09,7.9,10.3,.18,'concrete',.07)
box('Substation cream shell',-7.25,-.7,2.42,7.0,8.9,4.48,'cream',.14)
box('Substation dark foundation',-7.25,-.7,.32,7.12,9.02,.26,'slate',.045)
box('Teal roof fascia',-7.25,-.7,4.70,7.5,9.4,.34,'teal',.08)
box('Inset matte roof',-7.25,-.7,4.91,6.98,8.88,.10,'slate',.025)
box('Service entry canopy',-3.52,.6,3.22,1.13,3.75,.20,'teal',.055)
box('Recessed service doors',-3.727,.5,1.59,.04,2.55,2.6,'dark')
for z in (-.10,1.1):
    box('Cream door inset',-3.695,z,1.56,.035,1.12,2.32,'metal')
    box('Door grip',-3.66,z+(.37 if z<0 else -.37),1.56,.055,.09,.36,'pale',.01)
box('Service threshold',-3.62,.5,.22,.38,2.9,.08,'concrete')
# Stacked, wide vents read as intentional service facade, not noisy louvers.
box('Vent seating frame',-3.717,-3.30,2.35,.065,1.75,1.25,'slate',.02)
for y in (1.99,2.35,2.71):box('Broad intake louver',-3.65,-3.30,y,.14,1.5,.20,'metal',.015)
box('Upper monitoring window',-3.713,2.98,2.62,.07,1.45,.60,'dark',.02)
box('Status glass',-3.663,2.98,2.63,.035,1.23,.37,'pale')
# Rear and side architectural bands ensure the reverse view remains designed.
for z in (-5.17,3.77):box('Wall horizontal band',-7.25,z,3.38,6.35,.055,.26,'teal')
box('Roof cable riser',-9.3,-3.2,5.23,.75,1.65,.58,'cream',.08)
box('Roof riser cap',-9.3,-3.2,5.55,.90,1.8,.12,'teal',.035)
# East bank: a low twin fan cooling unit and three power cabinets behind it.
box('Cooling bank foundation',7.3,2.8,.09,6.0,4.8,.18,'concrete',.06)
box('Cooling bank body',7.3,2.8,1.04,5.35,3.6,1.72,'cream',.10)
box('Cooling teal belt',7.3,2.8,1.72,5.48,3.73,.27,'teal',.03)
for x in (5.95,8.65):
    cyl('Circular fan seat',x,2.8,1.985,.99,.17,'slate',16)
    cyl('Fan dark recess',x,2.8,2.085,.80,.045,'dark',16)
    for a in range(4):
        angle=a*math.pi/2+.35;dx=math.cos(angle)*.36;dz=math.sin(angle)*.36
        o=box('Four broad fan blades',x+dx,2.8+dz,2.13,.68,.25,.06,'metal',.015);o.rotation_euler.z=-angle
    cyl('Fan centre hub',x,2.8,2.18,.18,.14,'pale')
for y in (.65,1.0,1.35):box('Cooling intake slot',4.615,2.8,y,.035,2.65,.16,'slate')
box('Power cabinets foundation',7.6,-2.4,.09,6.4,2.4,.18,'concrete',.06)
for x in (5.6,7.6,9.6):
    box('Power cabinet',x,-2.4,1.58,1.7,1.85,2.80,'cream',.07)
    box('Power cabinet cap',x,-2.4,3.03,1.84,1.99,.18,'teal',.04)
    box('Cabinet front panel',x,-1.46,1.66,1.36,.04,2.26,'metal',.025)
    box('Cabinet display',x,-1.43,2.32,.68,.035,.34,'dark',.012)
    box('Cabinet handle',x+.46,-1.40,1.46,.09,.06,.45,'pale',.01)
    box('Small service marker',x,-1.42,.82,.35,.03,.12,'yellow')
# Two closed, faceted coolant reservoirs with anchored manifolds.
box('Tank footing',7.3,-5.6,.09,5.4,2.55,.18,'concrete',.055)
for x in (5.85,8.75):
    cyl('Tank lower skirt',x,-5.6,.39,.98,.42,'slate')
    cyl('Coolant tank cream vessel',x,-5.6,1.78,.88,2.36,'cream')
    cyl('Tank teal shoulder band',x,-5.6,2.90,.93,.26,'teal')
    cyl('Tank lid',x,-5.6,3.075,.77,.09,'pale')
    cyl('Tank valve stem',x,-5.6,3.23,.11,.22,'slate',8)
    box('Valve grip',x,-5.6,3.35,.46,.12,.10,'yellow',.015)
    pipe('Connected pipe down',(x,-4.73,1.00),(x,-4.20,1.00),.13,'teal')
    pipe('Pipe to grade',(x,-4.20,1.00),(x,-4.20,.37),.13,'teal')
pipe('Low common coolant manifold',(5.85,-4.20,.37),(8.75,-4.20,.37),.13,'teal')
# Short maintenance rails are rear/outer-only; central pedestrian spine stays open.
for x in (4.55,10.6):
    for z in (-6.9,-5.8,-4.7):
        box('Rail foot',x,z,.09,.34,.34,.18,'slate',.025)
        pipe('Maintenance rail post',(x,z,.18),(x,z,1.13),.055,'yellow')
    pipe('Continuous maintenance rail',(x,-6.9,1.10),(x,-4.7,1.10),.065,'yellow')
# Two substantial entry bollards, offset from the reserved route shoulder.
for z in (-1.45,2.40):
    cyl('Entry bollard foot',-2.93,z,.08,.19,.16,'slate',8)
    cyl('Entry bollard',-2.93,z,.49,.115,.75,'yellow',8)
    cyl('Bollard cap',-2.93,z,.89,.13,.09,'slate',8)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();obj=bpy.context.object;obj.name='campus_utility_decor';bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);obj.parent=root
obj['placement_contract']='Tile-centred origin, place at y1.2. Local central x[-1,3] clear; terminal x[-1.4,3.4] z[-13.02,-9.41] clear. All parts inside outer1.4m quiet band.'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(dest/os.environ.get('ASSET_SOURCE_NAME','campus_utility_decor_v01.blend')))
