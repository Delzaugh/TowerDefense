"""Render measured concept views from the isolated six-pod Blender scene."""
from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
source = (ROOT / 'blender/towers/linter_agent/v01/spec_sheet/render_views.py').read_text(encoding='utf-8')
source = source.replace('resolution_x = 560', 'resolution_x = 850')
source = source.replace('resolution_y = 560', 'resolution_y = 850')
assert 'resolution_x = 850' in source and 'resolution_y = 850' in source
sys.argv = ['render_concept.py', '--', str(HERE / 'renders')]
exec(compile(source, 'render_views.py', 'exec'))

# The coverage construction view is a true overhead orthographic render.
for slot, material in zip(model.material_slots, original):
    slot.material = material
camera.location = target + Vector((0, 0, 8))
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.ortho_scale = 3.25
scene.render.filepath = str(HERE / 'renders' / 'top.png')
bpy.ops.render.render(write_still=True)

def isolate(parts, name, scale):
    groups = {g.index for g in model.vertex_groups if any(g.name.startswith(p) for p in parts)}
    chosen = {v.index for v in model.data.vertices if any(g.group in groups for g in v.groups)}
    polygons = [p for p in model.data.polygons if all(i in chosen for i in p.vertices)]
    used = sorted({i for p in polygons for i in p.vertices})
    center = sum((model.data.vertices[i].co for i in used), Vector()) / len(used)
    remap = {old: new for new, old in enumerate(used)}
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([model.data.vertices[i].co-center for i in used], [],
                     [tuple(remap[i] for i in p.vertices) for p in polygons])
    mesh.update()
    for mat in original: mesh.materials.append(mat)
    uv = mesh.uv_layers.new(name='PaletteUV')
    old_uv = model.data.uv_layers.active
    for new_poly, old_poly in zip(mesh.polygons, polygons):
        new_poly.material_index = old_poly.material_index
        new_poly.use_smooth = old_poly.use_smooth
        for new_li, old_li in zip(new_poly.loop_indices, old_poly.loop_indices):
            uv.data[new_li].uv = old_uv.data[old_li].uv
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    model.hide_render = True
    camera_data.ortho_scale = scale
    for suffix, point in [('three_quarter', (3,-5,2.5)), ('front', (0,-6,1.6))]:
        camera.location = Vector(point)
        camera.rotation_euler = (Vector((0,0,0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(HERE / 'renders' / f'{name}_{suffix}.png')
        bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(obj, do_unlink=True)
    model.hide_render = False

isolate(['lime_rule_socket_0', 'socket_inner_recess_0', 'rule_port_0'], 'shooter', 0.85)
isolate(['continuous_visor', 'recessed_rule_lens'], 'visor', 2.0)
