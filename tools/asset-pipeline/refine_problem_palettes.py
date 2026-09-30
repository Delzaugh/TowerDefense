"""Inspect/apply the explicit Problems palette; preserve geometry and emission."""
import bpy, json, sys, hashlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from refine_shared_palette import apply_manifest_swatches
ROOT = Path(__file__).resolve().parents[2]
args = sys.argv[sys.argv.index('--')+1:]
asset_id = args[0]
policy = json.loads((ROOT/'docs/design/Problems_Palette.json').read_text())
catalog = json.loads((ROOT/'assets/asset_catalog.json').read_text())
entry = next(e for e in catalog['assets'] if e['id']==asset_id and e['version']=='v01')
mp = ROOT/entry['manifest']
m = json.loads(mp.read_text())
source = ROOT/m['source']['path']
assert hashlib.sha256(source.read_bytes()).hexdigest()==m['source']['authoritativeHash'], 'Inspect concurrent source edits before continuing'
colors = {role: policy['tokens'][token] for role,token in policy['bindings'][asset_id].items()}
limit = policy.get('maxUniqueBaseColorsByAsset', {}).get(asset_id)
if limit is not None:
    assert len(set(colors.values())) <= limit
assert set(colors)=={role for spec in m['texturePalettes'] for role in spec['roles']}
bpy.ops.wm.open_mainfile(filepath=str(source))
report = {'asset':asset_id, 'sourceBefore':m['source']['authoritativeHash'], 'revisionBefore':m['revision'],
          'colorsBefore':m['palette']['colors'].copy(), 'colorsAfter':colors,
          'objects':len(bpy.data.objects), 'actions':[a.name for a in bpy.data.actions],
          'images':[{'name':i.name,'size':list(i.size),'packed':bool(i.packed_file)} for i in bpy.data.images],
          'materialLinks':{mat.name:[{'input':l.to_socket.name,'image':l.from_node.image.name if l.from_node.type=='TEX_IMAGE' and l.from_node.image else None} for l in mat.node_tree.links if l.to_node.type=='BSDF_PRINCIPLED'] for mat in bpy.data.materials if mat.use_nodes}}
print('PROBLEM_PALETTE_INSPECTION',json.dumps(report))
if '--verify' in args:
    assert bpy.context.scene.unit_settings.system == 'METRIC'
    assert abs(bpy.context.scene.unit_settings.scale_length - 1.0) < 1e-8
    for spec in m['texturePalettes']:
        mat = bpy.data.materials[spec['material']]
        bsdf = next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        link = bsdf.inputs['Base Color'].links[0]
        assert link.from_node.type == 'TEX_IMAGE'
        image = link.from_node.image
        assert image.packed_file and image.colorspace_settings.name == 'sRGB'
        assert list(image.size) == spec['size']
        width, height = spec['size']
        pixels = list(image.pixels[:])
        for role, swatch in spec['roles'].items():
            assert swatch['color'] == colors[role] == m['palette']['colors'][role]
            x,y,w,h = swatch['rect']
            expected = [int(colors[role][i:i+2],16) for i in (1,3,5)]
            for yy in range(y,y+h):
                for xx in range(x,x+w):
                    start = ((height-1-yy)*width+xx)*4
                    assert all(abs(round(pixels[start+c]*255)-expected[c])<=1 for c in range(3)), role
    assert hashlib.sha256(source.read_bytes()).hexdigest() == report['sourceBefore']
    report['passed'] = True
    report['uniqueBaseColors'] = len(set(colors.values()))
    report['checks'] = 'Packed source pixels, material base bindings, palette policy, declared rectangles, metre scale, unchanged authoritative source hash'
    (mp.parent/'validation/problem_palette_alignment_source.json').write_text(json.dumps(report,indent=2)+'\n')
    print('SOURCE_PALETTE_ALIGNED',asset_id,report['uniqueBaseColors'])
if '--apply' in args:
    label = next((a.split('=',1)[1] for a in args if a.startswith('--milestone=')), 'before_problem_palette')
    milestone = mp.parent/'revisions'/f"r{m['revision']}_{label}"
    assert milestone.exists(), 'Create the pipeline milestone first'
    for spec in m['texturePalettes']:
        for role,swatch in spec['roles'].items(): swatch['color']=colors[role]
    m['palette']['colors'].update(colors)
    report['bindings']=apply_manifest_swatches(m)
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(source))
    mp.write_text(json.dumps(m,indent=2)+'\n')
    (mp.parent/'validation/problem_palette_source.json').write_text(json.dumps(report,indent=2)+'\n')
