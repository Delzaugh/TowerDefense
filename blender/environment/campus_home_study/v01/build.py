"""Glacier campus source. Shared pipeline owns GLB export."""
import bpy, os
from pathlib import Path
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=1
root=bpy.data.objects.new('root',None); scene.collection.objects.link(root)
palette={'chalk':'#E2EDF0','shell':'#89A4B8','edge':'#ADC5D2','glass':'#305775','blue':'#659FCC','aqua':'#B1DFE8','ground':'#A5BFCB','path':'#D2E1E5','soil':'#7B9E9F','leaf':'#70B5B4','trunk':'#65918F','water':'#619FBE','wood':'#A6BBBE'}
roles={k:i+1 for i,k in enumerate(palette)}
def rgba(h):
    s=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in s)+(1,)
mat=bpy.data.materials.new('campus_palette'); mat.use_nodes=True
bsdf=mat.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Roughness'].default_value=.82
col=mat.node_tree.nodes.new('ShaderNodeVertexColor'); col.layer_name='Color'
mat.node_tree.links.new(col.outputs['Color'],bsdf.inputs['Base Color'])
groups={}
def finish(obj,name,role,group):
    obj.name=name
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.clear(); obj.data.materials.append(mat)
    color=obj.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
    attr=obj.data.attributes.new(name='_palette_role',type='FLOAT',domain='CORNER')
    for v in color.data:v.color=rgba(palette[role])
    for v in attr.data:v.value=roles[role]
    groups.setdefault(group,[]).append(obj)
    return obj
def box(name,p,s,role,group='Lab',bevel=.045):
    x,d,h=p
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-d,h))
    obj=bpy.context.object; obj.dimensions=s
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=obj.modifiers.new('Soft manufactured edge','BEVEL');mod.width=bevel;mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(obj,name,role,group)
def cylinder(name,p,r,depth,role):
    x,d,h=p
    bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=r,depth=depth,location=(x,-d,h))
    return finish(bpy.context.object,name,role,'Garden')
def ico(name,p,s,role):
    x,d,h=p
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(x,-d,h))
    obj=bpy.context.object;obj.scale=s
    return finish(obj,name,role,'Garden')

# Continuous foundation, with intentional shallow paving seams.
box('Campus foundation',(0,0,.22),(19,15,.44),'shell','Terrain',.20)
box('Continuous stone rim',(0,0,.48),(18.85,14.85,.14),'chalk','Terrain',.06)
box('Landscape top',(0,0,.60),(18.5,14.5,.10),'ground','Terrain',.045)
box('Front promenade',(0,4.35,.695),(18.15,3.2,.09),'path','Terrain',.04)
box('Garden walk',(5.7,-1,.695),(1.8,8.6,.09),'path','Terrain',.04)
box('Lab entrance walk',(-2,2.85,.70),(3.7,1.1,.10),'path','Terrain',.03)
for x in (-7,-4,0,3,7):box('Paving joint',(x,4.35,.742),(.028,3.1,.004),'edge','Terrain',0)

# Stepped Copilot Lab: continuous shell, seated slabs and facade panels.
box('Lab footing',(-2,-1,.85),(7.5,6,.40),'edge')
box('Lab base cap',(-2,-1,1.10),(7.65,6.12,.16),'chalk')
box('Main shell',(-2,-1,2.51),(6.95,5.55,2.7),'shell',bevel=.08)
box('Lower service course',(-2,-1,1.39),(7.04,5.62,.23),'chalk')
box('Roof fascia',(-2,-1,3.94),(7.45,6,.22),'chalk')
box('Roof inset',(-2,-1,4.075),(6.95,5.5,.05),'edge',bevel=.015)
box('Upper studio',(-3.1,-1.60,4.78),(4.45,3.6,1.37),'shell',bevel=.065)
box('Upper roof cap',(-3.1,-1.60,5.52),(4.85,3.99,.18),'chalk')
box('Upper roof surface',(-3.1,-1.60,5.63),(4.55,3.69,.045),'path',bevel=.015)
for x in (-4.32,.32):
    box('Front glazing',(x,1.805,2.80),(1.35,.065,1.40),'glass',bevel=.025)
    box('Window light pane',(x,1.845,2.85),(1.13,.025,1.05),'blue',bevel=.01)
# Continuous rectangular frame ring. Clear opening: 2.80 m wide, 2.48 m high.
# Double doors meet in a slim seam; there is no fixed central structural mullion.
door_bottom,door_top,door_left,door_right=1.10,3.58,-3.40,-.60
outer=[(-3.56,.98),(-.44,.98),(-.44,3.74),(-3.56,3.74)]
inner=[(door_left,door_bottom),(door_right,door_bottom),(door_right,door_top),(door_left,door_top)]
verts=[(x,-d,h) for d in (1.79,2.12) for contour in (outer,inner) for x,h in contour]
faces=[]
for i in range(4):
    j=(i+1)%4
    faces.extend([(i,j,j+8,i+8),(i+4,i+12,j+12,j+4),(i,i+4,j+4,j),(i+8,j+8,j+12,i+12)])
mesh=bpy.data.meshes.new('Continuous entrance frame');mesh.from_pydata(verts,[],faces);mesh.update()
frame=bpy.data.objects.new('Door frame',mesh);scene.collection.objects.link(frame)
bpy.ops.object.select_all(action='DESELECT');frame.select_set(True);bpy.context.view_layer.objects.active=frame
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
finish(frame,'Door frame','chalk','Lab')
box('Door inset',(-2,2.025,2.34),(2.80,.055,2.48),'glass',bevel=.008)
for x in (-2.70,-1.30):box('Sliding door glass',(x,2.06,2.43),(1.25,.018,2.07),'aqua',bevel=.004)
box('Door meeting seam',(-2,2.08,2.34),(.045,.04,2.48),'edge',bevel=.005)
box('Entrance canopy',(-2,2.20,3.80),(3.65,1.02,.17),'chalk')
box('Entrance canopy edge',(-2,2.72,3.78),(3.53,.06,.1),'blue',bevel=.01)
box('Entrance step',(-2,2.30,.93),(3.65,1.25,.25),'chalk')
box('Side glazing',(1.51,-1.05,2.75),(.065,4.58,1.35),'glass',bevel=.02)
for d in (-2.65,-1.60,-.55,.50):box('Side pane',(1.555,d,2.79),(.025,.88,1.08),'blue',bevel=.01)
box('Upper ribbon',(-3.1,.215,4.80),(3.75,.045,.79),'glass',bevel=.02)
for x in (-4.5,-3.57,-2.63,-1.7):box('Upper pane',(x,.25,4.81),(.73,.024,.57),'aqua',bevel=.008)
box('Code plaque',(-.85,-1.55,4.80),(.075,2.1,.94),'blue',bevel=.015)
# Closed extruded chevrons, avoiding crossed bars and duplicate seam faces.
def chevron(name,d,mirror=False):
    outline=[(-.31,0),(.02,.30),(.14,.18),(-.07,0),(.14,-.18),(.02,-.30)]
    if mirror:outline=[(-u,v) for u,v in outline]
    vertices=[(x,-(d+u),4.80+v) for x in (-.802,-.776) for u,v in outline]
    n=len(outline);faces=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
    triangulate=obj.modifiers.new('Explicit concave face triangulation','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=triangulate.name)
    finish(obj,name,'chalk','Lab')
chevron('Code open',-1.15,True);chevron('Code close',-1.95)
box('Roof utility',(.30,-3.15,4.41),(1.28,1.0,.60),'edge')
box('Roof utility lid',(.30,-3.15,4.75),(1.4,1.12,.13),'chalk')
for d in (-3.55,-3.35,-3.15,-2.95,-2.75):box('Utility ventilation',(.30,d,4.823),(1.05,.09,.012),'glass',bevel=.004)

# Shallow opaque pool, planters and faceted trees.
box('Pool basin',(3.3,-.55,.84),(2.7,4.9,.38),'chalk','Garden',.11)
box('Pool water',(3.3,-.55,1.036),(2.35,4.55,.024),'water','Garden',.01)
for d,length in ((-1.8,1.1),(-1.55,.7),(.5,1.3),(.75,.7)):box('Water glint',(3.3,d,1.051),(length,.035,.006),'aqua','Garden',.002)
def tree(x,d,s=1):
    box('Tree planter',(x,d,.84),(1.9*s,1.9*s,.38),'edge','Garden',.08)
    box('Planter lip',(x,d,1.05),(1.96*s,1.96*s,.10),'chalk','Garden',.045)
    box('Planter soil',(x,d,1.115),(1.67*s,1.67*s,.04),'soil','Garden',.018)
    cylinder('Tree trunk',(x,d,1.1+.68*s),.14*s,1.36*s,'trunk')
    ico('Faceted crown',(x,d,1.1+2*s),(1.02*s,.95*s,1.36*s),'leaf')
for x,d,s in [(-7.2,-3.8,1),(-7.2,.2,.78),(-6.7,6.1,.65),(7.25,-4.8,.88),(7.4,.05,1.05),(7.4,6.1,.65)]:tree(x,d,s)
def bench(x,d):
    for dx in (-.75,.75):box('Bench foot',(x+dx,d,.95),(.14,.65,.56),'glass','Garden',.025)
    for dz in (-.23,0,.23):box('Bench slat',(x,d+dz,1.28),(1.9,.18,.13),'wood','Garden',.025)
    box('Bench back',(x,d-.32,1.63),(1.9,.13,.55),'wood','Garden',.025)
bench(3.2,2.40);bench(-3.8,6.55)
for x,d in ((-5.8,2.8),(5.4,5.6)):
    box('Light post',(x,d,1.60),(.14,.14,1.9),'glass','Garden',.02)
    box('Path lantern',(x,d,2.59),(.46,.46,.25),'aqua','Garden',.025)
    box('Lantern cap',(x,d,2.75),(.59,.59,.09),'chalk','Garden',.025)
for x,d,s in ((-8.1,5.8,.32),(7.9,-2.3,.4),(6.9,-2.6,.24)):ico('Garden stone',(x,d,.65+s*.45),(s,s*.7,s*.65),'edge')

for name,objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
    obj=bpy.context.object;obj.name=name
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    obj.parent=root;obj['palette_roles']={'attribute':'_palette_role','scale':1,'roles':roles}
anchor=bpy.data.objects.new('anchor_ui',None);scene.collection.objects.link(anchor)
anchor.parent=root;anchor.location=(-2,1,6.25)
for name,p in [('anchor_door_min',(door_left,-2.13,door_bottom)),('anchor_door_max',(door_right,-2.13,door_top)),('anchor_walk_left',(-4.2,-4.35,.74)),('anchor_walk_right',(1.0,-4.35,.74))]:
    node=bpy.data.objects.new(name,None);scene.collection.objects.link(node);node.parent=root;node.location=p
# Source-only studio camera and light outside the export hierarchy.
bpy.ops.object.camera_add(location=(21,-27,23))
camera=bpy.context.object;camera.name='Studio camera';camera.data.type='ORTHO';camera.data.ortho_scale=26
camera.rotation_euler=(Vector((0,0,1.5))-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(-8,-12,20));bpy.context.object.data.energy=2400;bpy.context.object.data.size=12
scene.world.color=(.55,.65,.75)
scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
bpy.ops.object.select_all(action='DESELECT');bpy.data.objects['Lab'].select_set(True);bpy.context.view_layer.objects.active=bpy.data.objects['Lab']
destination=Path(os.environ.get('ASSET_BUILD_DIR',Path(__file__).parent))/os.environ.get('ASSET_SOURCE_NAME','campus_home_study_v01.blend')
destination.parent.mkdir(parents=True,exist_ok=True);bpy.ops.wm.save_as_mainfile(filepath=str(destination))
print('Campus source:',destination)
