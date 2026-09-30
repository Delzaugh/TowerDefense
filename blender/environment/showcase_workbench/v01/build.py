"""Approved v09 Copilot Hub room and separately rendered preview plinth."""
import os
from pathlib import Path
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
OUT = Path(os.environ.get('ASSET_BUILD_DIR', HERE))
SOURCE = os.environ.get('ASSET_SOURCE_NAME', 'showcase_workbench_v01.blend')

COLORS = [
    ('ivory', '#E8E6DF'), ('slate', '#354B64'), ('slate_light', '#89A4B8'),
    ('wood', '#D7A875'), ('wood_edge', '#B88258'), ('plinth', '#36475A'),
    ('plinth_top', '#657C8D'), ('cyan', '#82DADD'), ('sky', '#9BD6F2'),
    ('hill', '#BAD2B7'), ('tree', '#70B5B4'), ('tree_dark', '#4D9695'),
    ('shadow', '#26394F'), ('white', '#F8F5ED'),
]

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for datablock in bpy.data.materials:
    bpy.data.materials.remove(datablock)

image = bpy.data.images.new('showcase_palette_image', width=64, height=4, alpha=True)
image.colorspace_settings.name = 'sRGB'
pixels = [0.0] * (64 * 4 * 4)
for index, (_, code) in enumerate(COLORS):
    rgb = [int(code[c:c+2], 16) / 255 for c in (1, 3, 5)]
    for y in range(4):
        for x in range(index * 4, index * 4 + 4):
            offset = (y * 64 + x) * 4
            pixels[offset:offset+4] = [*rgb, 1.0]
image.pixels[:] = pixels
image.pack()
material = bpy.data.materials.new('showcase_palette')
material.use_nodes = True
nodes = material.node_tree.nodes
bsdf = nodes.get('Principled BSDF')
bsdf.inputs['Roughness'].default_value = .88
texture = nodes.new('ShaderNodeTexImage')
texture.image = image
texture.interpolation = 'Closest'
material.node_tree.links.new(texture.outputs['Color'], bsdf.inputs['Base Color'])

root = bpy.data.objects.new('root', None)
bpy.context.collection.objects.link(root)
room_parts = []
plinth_parts = []

def paint(obj, role):
    obj.data.materials.append(material)
    idx = next(i for i, (name, _) in enumerate(COLORS) if name == role)
    u = (idx * 4 + 2) / 64
    uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap')
    for loop in uv.data:
        loop.uv = (u, .5)
    return obj

def box(name, location, scale, role, target=room_parts, bevel=0):
    # Design coordinates are Three.js +Y up; Blender stores +Z up.
    x, y, z = location
    sx, sy, sz = scale
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (sx, sz, sy)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('soft edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 1
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        mod = obj.modifiers.new('weighted normals', 'WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=mod.name)
    paint(obj, role)
    target.append(obj)
    return obj

def tree(name, x, y, z, size):
    box(name + '_trunk', (x, y - size*.44, z), (.16*size, .9*size, .16*size), 'wood_edge')
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=(x, -z, y))
    obj = bpy.context.object
    obj.name = name + '_canopy'
    obj.scale = (size*.68, size*.42, size)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    paint(obj, 'tree' if x > 5 else 'tree_dark')
    room_parts.append(obj)

def octagon(name, y, radius, depth, role, bevel):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=radius, depth=depth, location=(0, -.45, y))
    obj = bpy.context.object
    obj.name = name
    mod = obj.modifiers.new('soft edge', 'BEVEL')
    mod.width = bevel
    mod.segments = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = obj.modifiers.new('weighted normals', 'WEIGHTED_NORMAL')
    bpy.ops.object.modifier_apply(modifier=mod.name)
    paint(obj, role)
    plinth_parts.append(obj)

# Architectural shell: no signage or decorative furniture.
box('floor', (0, .12, -.5), (17.5, .24, 14), 'ivory')
box('rear_slate_wall', (-2.3, 3.45, -5.1), (13, 6.9, .3), 'slate')
box('left_ivory_wall', (-8.3, 3.45, -4.9), (1.8, 6.9, .45), 'ivory')
box('right_wall', (8.1, 3.4, -5.1), (1.4, 6.8, .3), 'ivory')
box('ceiling_band', (0, 6.6, -4.75), (18, .48, .85), 'ivory')
box('rear_baseboard', (-1.7, .26, -4.86), (12.8, .52, .16), 'slate_light')

# Opaque campus view sits behind the frame: sunlight, low hills, simple trees.
box('window_sky', (5.8, 3.8, -5.35), (5.8, 5.55, .06), 'sky')
box('window_horizon', (5.8, 1.75, -5.23), (5.8, 1.4, .06), 'hill')
tree('window_tree_left', 3.85, 2.8, -5.04, 1.15)
tree('window_tree_mid', 6.15, 2.15, -5.02, .72)
tree('window_tree_right', 7.65, 2.7, -5.04, 1.2)
box('window_left_jamb', (3.18, 3.63, -4.79), (.38, 5.85, .48), 'ivory')
box('window_middle_mullion', (5.68, 3.63, -4.79), (.29, 5.85, .42), 'slate_light')
box('window_right_jamb', (8.31, 3.63, -4.79), (.37, 5.85, .48), 'ivory')
box('window_sill', (5.77, .72, -4.63), (5.62, .25, .58), 'slate_light')
box('window_header', (5.77, 6.5, -4.74), (5.62, .29, .42), 'ivory')

# Warm work surface fills the foreground, with a slim visible fascia.
box('desk_top', (0, .83, 7.15), (18.7, .18, 18.7), 'wood', bevel=.045)
box('desk_front_fascia', (0, .53, 16.43), (18.7, .53, .17), 'wood_edge')
box('desk_rear_edge', (0, .82, -2.12), (18.7, .12, .16), 'wood_edge')

# An eight-sided plinth reads as a compact pedestal rather than a laptop.
octagon('plinth_base', 1.08, 1.52, .28, 'plinth', .07)
octagon('plinth_rim', 1.252, 1.36, .08, 'cyan', .025)
octagon('plinth_top', 1.326, 1.25, .07, 'plinth_top', .025)

def join(name, parts):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    joined = bpy.context.object
    joined.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    joined.parent = root
    return joined

join('room_shell', room_parts)
join('preview_plinth', plinth_parts)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
bpy.context.view_layer.objects.active = root
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / SOURCE))
