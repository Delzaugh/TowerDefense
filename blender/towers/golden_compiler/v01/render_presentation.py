"""Render the delivered source with its separate aura art preview. Never resave source."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'golden_compiler_v01.blend'))
scene=bpy.context.scene
bpy.context.view_layer.update()
print('ANCHORS',json.dumps({o.name:list(o.matrix_world.translation) for o in scene.objects if o.name.startswith('anchor_')}))
scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=True
scene.render.resolution_x=1050;scene.render.resolution_y=1150;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.10,.15,.22,1);scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.45
scene.view_settings.view_transform='AgX'
def material(name,color,emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.9;p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission;return m
floor=material('studio_navy',(.025,.045,.07))
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.014));bpy.context.object.data.materials.append(floor)
def area(name,pos,power,color,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,1.8))-o.location).to_track_quat('-Z','Y').to_euler()
area('warm_key',(-3,-4,6),480,(1,.87,.64),4)
area('cool_fill',(4,-1,3.7),310,(.58,.78,1),3)
area('gold_rim',(0,3,4.5),650,(1,.68,.25),3)
d=bpy.data.cameras.new('presentation_camera');cam=bpy.data.objects.new('presentation_camera',d);scene.collection.objects.link(cam)
cam.location=(5,-10,6.0);target=Vector((-.09,0,1.8));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=4.5;scene.camera=cam
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(HERE/'renders/golden_compiler_clean.png');bpy.ops.render.render(write_still=True)
# The custom aura is captured from the shared inspector by verify-effects.cjs.
