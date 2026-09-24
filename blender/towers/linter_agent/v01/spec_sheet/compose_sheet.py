"""Compose a measured Linter Agent sheet on the bundled 1536 x 1024 template."""
import hashlib
import json
import struct
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
SOURCE = HERE.parent
GLB = ROOT / 'assets/runtime/towers/linter_agent_v01.glb'
TEMPLATE = Path.home() / '.codex/skills/model-spec-sheet-skill/assets/model-spec-sheet-template.png'
OLDER_SHEET = ROOT / 'blender/towers/copilot_base/v02/references/persona_studies_2026-09-18/spec_sheets/linter_agent_spec_v01.png'
OUT = HERE / 'linter_agent_spec_v01_r09.png'


def glb_data(path):
    data = path.read_bytes()
    assert data[:4] == b'glTF'
    offset = 12
    document = None
    binary = None
    while offset < len(data):
        length, kind = struct.unpack_from('<II', data, offset)
        chunk = data[offset + 8:offset + 8 + length]
        if kind == 0x4E4F534A:
            document = json.loads(chunk)
        elif kind == 0x004E4942:
            binary = chunk
        offset += 8 + length
    assert document is not None and binary is not None
    return data, document, binary


data, model, binary = glb_data(GLB)
primitives = [p for mesh in model['meshes'] for p in mesh['primitives']]
assert all(p.get('mode', 4) == 4 for p in primitives)
vertices = sum(model['accessors'][i]['count'] for i in {p['attributes']['POSITION'] for p in primitives})
triangles = sum(model['accessors'][p['indices']]['count'] // 3 for p in primitives)
assert all('TEXCOORD_0' in p['attributes'] for p in primitives)
uv_accessors = {p['attributes']['TEXCOORD_0'] for p in primitives}
uv_values = set()
for index in uv_accessors:
    accessor = model['accessors'][index]
    view = model['bufferViews'][accessor['bufferView']]
    assert accessor['componentType'] == 5126 and accessor['type'] == 'VEC2'
    start = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    stride = view.get('byteStride', 8)
    for n in range(accessor['count']):
        u, v = struct.unpack_from('<ff', binary, start + n * stride)
        assert abs(v - 0.5) < 1e-5
        assert any(abs(u - (i * 4 + 2) / 32) < 1e-5 for i in range(8))
        uv_values.add(round(u, 6))
assert 1 <= len(uv_values) <= 8
images = []
for i, entry in enumerate(model['images']):
    view = model['bufferViews'][entry['bufferView']]
    blob = binary[view.get('byteOffset', 0):view.get('byteOffset', 0) + view['byteLength']]
    assert entry['mimeType'] == 'image/png'
    path = HERE / f'palette_image_{i}.png'
    path.write_bytes(blob)
    images.append({'path': path.name, 'width': struct.unpack_from('>I', blob, 16)[0], 'height': struct.unpack_from('>I', blob, 20)[0]})
assert len(images) == 1 and (images[0]['width'], images[0]['height']) == (32, 4)
report = json.loads((SOURCE / 'validation/report.json').read_text())
assert report['passed'] and report['sha256'] == hashlib.sha256(data).hexdigest()
assert report['triangles'] == triangles
stats = {
    'runtime': str(GLB.relative_to(ROOT)).replace('\\', '/'),
    'sha256': report['sha256'],
    'revision': report['revision'],
    'triangles': triangles,
    'exported_vertex_records': vertices,
    'vertex_definition': 'Unique POSITION accessor records in the exported GLB; split render vertices, not welded Blender vertices.',
    'meshes': len(model['meshes']),
    'mesh_primitives': len(primitives),
    'materials': len(model['materials']),
    'texture_bindings': len(model['textures']),
    'embedded_images': images,
    'uv0_on_every_primitive': True,
    'uv0_u_centres': sorted(uv_values),
    'target_triangle_ceiling': 4000,
}
(HERE / 'measured_stats.json').write_text(json.dumps(stats, indent=2) + '\n')

sheet = Image.open(TEMPLATE).convert('RGBA')
assert sheet.size == (1536, 1024)
draw = ImageDraw.Draw(sheet)
regular = 'C:/Windows/Fonts/segoeui.ttf'
semibold = 'C:/Windows/Fonts/segoeuib.ttf'
font_title = ImageFont.truetype(semibold, 40)
font_sub = ImageFont.truetype(regular, 23)
font_label = ImageFont.truetype(regular, 18)
font_small = ImageFont.truetype(regular, 16)
white = (235, 242, 250, 255)

# Reconstruct the quiet gradient in the template's header before replacing its
# three placeholders. The viewport and panel outlines are untouched.
anchor = [sheet.getpixel((x, 105)) for x in range(1536)]
reference = [sheet.getpixel((800, y)) for y in range(106)]
ref_bottom = reference[105]
for y in range(106):
    delta = [reference[y][c] - ref_bottom[c] for c in range(3)]
    for x, base in enumerate(anchor):
        sheet.putpixel((x, y), tuple(max(0, min(255, base[c] + delta[c])) for c in range(3)) + (255,))
draw = ImageDraw.Draw(sheet)
draw.text((42, 17), 'Linter Agent', font=font_title, fill=white)
draw.text((42, 67), 'Compact eight-way rule sweeper', font=font_sub, fill=(213, 225, 238, 255))
right_title = 'Tower'
bbox = draw.textbbox((0, 0), right_title, font=font_label)
draw.text((1508 - (bbox[2] - bbox[0]), 28), right_title, font=font_label, fill=white)

# True orthographic renders of the same authoritative Blender source.
panels = [(46, 'front'), (289, 'front_left'), (533, 'left'), (775, 'back'), (1018, 'back_right'), (1263, 'right')]
for panel_x, name in panels:
    render = Image.open(HERE / 'renders' / f'{name}.png').convert('RGBA')
    box = render.getchannel('A').getbbox()
    render = render.crop(box)
    render.thumbnail((211, 168), Image.Resampling.LANCZOS)
    x = panel_x + (228 - render.width) // 2
    y = 303 - render.height // 2
    shadow = Image.new('RGBA', sheet.size)
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((panel_x + 53, y + render.height - 1, panel_x + 177, y + render.height + 19), fill=(4, 9, 16, 80))
    sheet.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(8)))
    sheet.alpha_composite(render, (x, y))

# The campus scale study comes from the earlier concept sheet. The tiny Linter
# in that panel is illustrative; it is not used as mesh or material evidence.
old = Image.open(OLDER_SHEET).convert('RGBA')
sheet.alpha_composite(old.crop((31, 534, 485, 933)), (31, 534))

# Rendered wireframe from the final Blender triangulation.
wire = Image.open(HERE / 'renders/wireframe.png').convert('RGBA')
wire = wire.crop(wire.getchannel('A').getbbox())
wire.thumbnail((275, 260), Image.Resampling.LANCZOS)
sheet.alpha_composite(wire, (650 - wire.width // 2, 720 - wire.height // 2))
draw = ImageDraw.Draw(sheet)
draw.text((517, 891), 'Actual mesh topology', font=font_small, fill=white)

# The production artifact is a 32 x 4 packed palette image with UV0 on both
# exported primitives. Show its actual pixels enlarged with nearest sampling.
atlas = Image.open(HERE / images[0]['path']).convert('RGBA')
atlas = atlas.resize((256, 32), Image.Resampling.NEAREST)
sheet.alpha_composite(atlas, (855, 688))
draw = ImageDraw.Draw(sheet)
draw.text((855, 625), 'Packed palette texture', font=font_label, fill=white)
draw.text((855, 652), '32 x 4 px  |  UV0 verified', font=font_small, fill=(204, 222, 238, 255))
draw.text((855, 742), '8 atlas slots; 5 used by mesh', font=font_small, fill=(204, 222, 238, 255))
draw.text((855, 887), 'Two materials; one image', font=font_small, fill=(204, 222, 238, 255))

# Replace only the template's unknown Model Info values. Sample the panel's
# undisturbed right edge so its dark gradient stays continuous.
for y in range(578, 697):
    c = sheet.getpixel((1480, y))
    draw.line((1300, y, 1488, y), fill=c, width=1)
values = [str(triangles), str(vertices), '32 x 4 px', '2', '≤ 4,000 tris']
for y, value in zip((580, 605, 630, 655, 680), values):
    draw.text((1310, y), value, font=font_label, fill=white)

colours = ['#D1E817', '#333E48', '#031D28', '#079CB9', '#00E6F4']
for i, colour in enumerate(colours):
    x = 1192 + 62 * i
    draw.rounded_rectangle((x + 2, 767, x + 40, 806), radius=3, fill=colour)

for y in range(876, 944):
    c = sheet.getpixel((1482, y))
    draw.line((1191, y, 1486, y), fill=c, width=1)
for y, note in zip((877, 901, 925), [
    'Eight radial emitter sockets',
    'Clear face at gameplay scale',
    'Static v01; no clips authored',
]):
    draw.text((1192, y), note, font=font_small, fill=white)

sheet.convert('RGB').save(OUT, optimize=True)
print(OUT)
print(json.dumps(stats, indent=2))
