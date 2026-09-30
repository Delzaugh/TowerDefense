"""Render the authoritative Blender model for its specification sheet.

Run with Blender in background mode, opening linter_agent_v01.blend first.
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


out = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
out.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
model = bpy.data.objects['linter_agent_model']

try:
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
except TypeError:
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 32
scene.render.resolution_x = 560
scene.render.resolution_y = 560
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'Medium High Contrast'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1

world = bpy.data.worlds.new('Spec sheet studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.52, 0.58, 0.67, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.65
scene.world = world

for name, position, power, size in [
    ('key', (-3.5, -4.5, 6.5), 300, 5.0),
    ('fill', (4.0, -1.5, 3.2), 150, 4.0),
    ('rim', (0.0, 3.8, 4.8), 200, 3.5),
]:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = power
    data.shape = 'DISK'
    data.size = size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector((0, 0, 0.5)) - obj.location).to_track_quat('-Z', 'Y').to_euler()

camera_data = bpy.data.cameras.new('Spec sheet orthographic')
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 3.05
camera = bpy.data.objects.new('Spec sheet orthographic', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
target = Vector((0, 0, 0.54))

views = [
    ('front', (0, -1)),
    ('front_left', (-math.sqrt(0.5), -math.sqrt(0.5))),
    ('left', (-1, 0)),
    ('back', (0, 1)),
    ('back_right', (math.sqrt(0.5), math.sqrt(0.5))),
    ('right', (1, 0)),
]
for name, (x, y) in views:
    camera.location = target + Vector((x * 6, y * 6, 2.25))
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(out / (name + '.png'))
    bpy.ops.render.render(write_still=True)

# An actual mesh wireframe, viewed obliquely. The overlay uses the final
# triangulated source faces and does not imply a different topology.
wire = bpy.data.materials.new('Wireframe overlay')
wire.use_nodes = True
nodes = wire.node_tree.nodes
nodes.clear()
output = nodes.new('ShaderNodeOutputMaterial')
mix = nodes.new('ShaderNodeMixShader')
base = nodes.new('ShaderNodeBsdfPrincipled')
base.inputs['Base Color'].default_value = (0.045, 0.075, 0.10, 1)
base.inputs['Roughness'].default_value = 0.8
line = nodes.new('ShaderNodeEmission')
line.inputs['Color'].default_value = (0.78, 0.89, 0.96, 1)
line.inputs['Strength'].default_value = 1.2
edge = nodes.new('ShaderNodeWireframe')
edge.use_pixel_size = False
edge.inputs['Size'].default_value = 0.004
links = wire.node_tree.links
links.new(edge.outputs['Fac'], mix.inputs[0])
links.new(base.outputs[0], mix.inputs[1])
links.new(line.outputs[0], mix.inputs[2])
links.new(mix.outputs[0], output.inputs['Surface'])
original = [slot.material for slot in model.material_slots]
for slot in model.material_slots:
    slot.material = wire
camera.location = target + Vector((-4.2, -4.2, 2.4))
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.ortho_scale = 3.0
scene.render.filepath = str(out / 'wireframe.png')
bpy.ops.render.render(write_still=True)
for slot, material in zip(model.material_slots, original):
    slot.material = material

print('Rendered specification views to', out)
