"""One-time, guarded palette experiment from the authoritative Bug source.

Run in background Blender with -- audit or -- convert. Never overwrites Bug.
The result is a manual source; subsequent delivery uses ordinary guarded export.
"""
from pathlib import Path
import bpy, hashlib, json, struct, sys, zlib

PROJECT = Path(__file__).resolve().parents[4]
FOLDER = Path(__file__).resolve().parent
BASE = PROJECT / 'blender/enemies/problem_bug/v01/asset.json'
manifest = json.loads(BASE.read_text(encoding='utf-8'))
source = PROJECT / manifest['source']['path']
runtime = PROJECT / manifest['runtime']
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
runtime_hash = hashlib.sha256(runtime.read_bytes()).hexdigest()
assert source_hash == manifest['delivery']['sourceHash'], 'Inspect changed authoritative source first'
assert runtime_hash == manifest['delivery']['sha256'], 'Inspect changed runtime first'
bpy.ops.wm.open_mainfile(filepath=str(source))

def geometry_signature():
    result = {}
    for o in bpy.data.objects:
        if o.type != 'MESH':
            continue
        d = o.data
        result[o.name] = {
            'vertices': [list(v.co) for v in d.vertices],
            'polygons': [list(p.vertices) for p in d.polygons],
            'weights': [[(g.group, g.weight) for g in v.groups] for v in d.vertices],
            'matrix': [list(row) for row in o.matrix_world],
        }
    return hashlib.sha256(json.dumps(result, sort_keys=True).encode()).hexdigest()

before = geometry_signature()
audit = {
    'baselineSourceHash': source_hash, 'baselineRuntimeHash': runtime_hash,
    'geometrySignature': before,
    'objects': [{'name': o.name, 'type': o.type} for o in bpy.data.objects],
    'meshes': [],
    'materials': [],
    'actions': [{'name': a.name, 'range': list(a.frame_range)} for a in bpy.data.actions],
}
for o in bpy.data.objects:
    if o.type == 'MESH':
        o.data.calc_loop_triangles()
        audit['meshes'].append({'name': o.name, 'triangles': len(o.data.loop_triangles),
            'vertices': len(o.data.vertices), 'loops': len(o.data.loops),
            'attributes': [(a.name, a.domain, a.data_type) for a in o.data.attributes],
            'roles': o.get('palette_roles').to_dict() if o.get('palette_roles') else None})
for m in bpy.data.materials:
    audit['materials'].append({'name': m.name,
        'nodes': [(n.name, n.bl_idname) for n in m.node_tree.nodes] if m.use_nodes else [],
        'links': [(l.from_node.name, l.from_socket.name, l.to_node.name, l.to_socket.name)
                  for l in m.node_tree.links] if m.use_nodes else []})
(FOLDER / 'validation/source_audit.json').write_text(json.dumps(audit, indent=2))
print('SOURCE_AUDIT', json.dumps(audit))
mode = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'audit'
if mode == 'audit':
    raise SystemExit(0)
assert mode == 'convert'
destination = FOLDER / 'problem_bug_palette_test_v01.blend'
assert not destination.exists(), 'Candidate source already exists; inspect rather than overwrite'

palette = manifest['palette']['colors']
names = list(palette)
width, height, tile = len(names) * 4, 4, 4
rgba = [tuple(bytes.fromhex(palette[name].lstrip('#'))) + (255,) for name in names]
def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
scanlines = b''.join(b'\0' + bytes(v for c in rgba for _ in range(tile) for v in c) for _ in range(height))
png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
       + chunk(b'sRGB', b'\0') + chunk(b'IDAT', zlib.compress(scanlines, 9)) + chunk(b'IEND', b''))
image_path = FOLDER / 'bug_palette.png'
image_path.write_bytes(png)
image = bpy.data.images.load(str(image_path), check_existing=False)
image.name = 'bug_palette_srgb_32x4'
image.colorspace_settings.name = 'sRGB'
image.pack()

def linear(c):
    return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4

role_uses = {}
for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    data = obj.data
    mapping = obj['palette_roles'].to_dict()
    by_id = {v: k for k, v in mapping['roles'].items()}
    ids = data.attributes['_palette_role']
    colors = data.color_attributes['Color']
    # Validate source semantics before replacing the color storage.
    loop_roles = []
    for i in range(len(data.loops)):
        role = by_id[round(ids.data[i].value)]
        expected = [linear(c / 255) for c in bytes.fromhex(palette[role].lstrip('#'))]
        assert max(abs(colors.data[i].color[j] - expected[j]) for j in range(3)) < 1e-6
        loop_roles.append(role)
        role_uses[role] = role_uses.get(role, 0) + 1
    uv = data.uv_layers.new(name='PaletteUV')
    for i, role in enumerate(loop_roles):
        uv.data[i].uv = ((names.index(role) * tile + tile / 2) / width, .5)
    # Semantic IDs remain useful for source editing, with no redundant COLOR_0.
    for attribute in list(data.color_attributes):
        data.color_attributes.remove(attribute)
    for material in data.materials:
        nodes, links = material.node_tree.nodes, material.node_tree.links
        bs = nodes.get('Principled BSDF')
        for link in list(links):
            if link.to_node == bs and link.to_socket.name in {'Base Color', 'Emission Color'}:
                links.remove(link)
        for node in list(nodes):
            if node.bl_idname == 'ShaderNodeVertexColor':
                nodes.remove(node)
        tex = nodes.new('ShaderNodeTexImage')
        tex.image = image
        tex.interpolation = 'Linear'
        tex.extension = 'EXTEND'
        uv_node = nodes.new('ShaderNodeUVMap')
        uv_node.uv_map = 'PaletteUV'
        links.new(uv_node.outputs['UV'], tex.inputs['Vector'])
        links.new(tex.outputs['Color'], bs.inputs['Base Color'])
        # Preserve the ACTUAL shipped material: the baseline GLB has uniform
        # white emission .08. Connecting the atlas here would change appearance.
        bs.inputs['Emission Color'].default_value = (1, 1, 1, 1)
        bs.inputs['Emission Strength'].default_value = .08

assert geometry_signature() == before, 'Geometry or skin weights changed'
root = bpy.data.objects['root']
root['asset'] = 'problem_bug_palette_test_v01'
root['source_version'] = 'v01'
root['revision'] = 2
root['experiment'] = 'Base-colour storage only; derived from problem_bug v01 revision 6'
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(destination))

candidate = json.loads((FOLDER / 'asset.json').read_text(encoding='utf-8'))
candidate.update(displayName='Bug - palette texture experiment',
    budgets={**manifest['budgets'], 'textures': 1, 'textureSize': 32},
    contract=manifest['contract'], clips=manifest['clips'], overrides=manifest['overrides'],
    references=[{'path': manifest['source']['path'], 'provenance': 'User-authorized palette texture experiment, 2026-09-13. Source copied, geometry/rig/clips retained.'},
                {'path': manifest['decisions'], 'provenance': 'Inherited explicit Bug artistic decisions.'}],
    exportSettings={'paletteSampler': 'linear'})
candidate['source']['authoritativeHash'] = hashlib.sha256(destination.read_bytes()).hexdigest()
# Existing manifest.palette specifically declares a COLOR_0 contract. The
# texture candidate uses an explicit experiment record and dedicated UV/PNG
# parity checks instead; no shared validator is weakened for this experiment.
(FOLDER / 'asset.json').write_text(json.dumps(candidate, indent=2) + '\n')
experiment = {'baseline': {'manifest': str(BASE.relative_to(PROJECT)).replace('\\', '/'),
    'revision': manifest['revision'], 'sourceHash': source_hash, 'runtimeHash': runtime_hash},
    'palette': palette, 'image': 'bug_palette.png', 'size': [width, height],
    'uvCenters': {n: [(i * tile + tile / 2) / width, .5] for i, n in enumerate(names)},
    'roleLoopCounts': role_uses, 'geometrySignature': before,
    'emission': 'Preserved shipped uniform white 0.08 emission; baseline source vertex-emission link is not represented in the GLB.',
    'method': 'One packed sRGB atlas; one UV coordinate at each swatch centre; COLOR_0 removed; role IDs retained.'}
(FOLDER / 'experiment.json').write_text(json.dumps(experiment, indent=2) + '\n')
assert hashlib.sha256(source.read_bytes()).hexdigest() == source_hash
assert hashlib.sha256(runtime.read_bytes()).hexdigest() == runtime_hash
print('CONVERSION_COMPLETE', str(destination))
