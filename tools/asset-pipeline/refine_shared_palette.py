"""Apply explicitly mapped solid base swatches to the authoritative source.

Invocation: blender --background --python this.py -- <asset-id> [--apply]
Inspect first; preserve a pipeline milestone before --apply. No geometry or
animation edits. This is not a whole-material tint or an automatic colour match.
"""
import bpy, json, sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[2]


def apply_manifest_swatches(manifest):
    """Used by a retained-source recipe to honour its current colour contract."""
    images = {}
    base_copies = {}
    report = []
    for spec in manifest.get('texturePalettes', []):
        material = bpy.data.materials.get(spec['material'])
        assert material and material.use_nodes, spec['material']
        bsdf = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        links = bsdf.inputs['Base Color'].links
        assert len(links) == 1 and links[0].from_node.type == 'TEX_IMAGE'
        image = links[0].from_node.image
        assert list(image.size) == spec['size'] and image.packed_file
        assert image.colorspace_settings.name == 'sRGB'
        # Split the base binding when emission shares this image. Preserve the
        # original packed bytes and sampling for emission.
        shared_emission = False
        for mat in bpy.data.materials:
            if not mat.use_nodes:
                continue
            for node in mat.node_tree.nodes:
                if node.type == 'BSDF_PRINCIPLED':
                    for link in node.inputs['Emission Color'].links:
                        if link.from_node.type == 'TEX_IMAGE' and link.from_node.image == image:
                            shared_emission = True
        if shared_emission:
            old_node = links[0].from_node
            if image.name not in base_copies:
                base_copies[image.name] = image.copy()
                base_copies[image.name].name = image.name + '_base'
            image = base_copies[image.name]
            node = material.node_tree.nodes.new('ShaderNodeTexImage')
            node.image = image
            node.interpolation = old_node.interpolation
            node.extension = old_node.extension
            node.projection = old_node.projection
            for link in list(old_node.inputs['Vector'].links):
                material.node_tree.links.new(link.from_socket, node.inputs['Vector'])
            material.node_tree.links.new(node.outputs['Color'], bsdf.inputs['Base Color'])
        entry = images.setdefault(image.name, [image, list(image.pixels[:]), {}])
        w, h = spec['size']
        for role, swatch in spec['roles'].items():
            x, y, rw, rh = swatch['rect']
            rgb = [int(swatch['color'][i:i+2], 16)/255 for i in (1, 3, 5)]
            for yy in range(y, y+rh):
                for xx in range(x, x+rw):
                    offset = ((h-1-yy)*w+xx)*4
                    assert offset not in entry[2] or entry[2][offset] == rgb
                    entry[2][offset] = rgb
                    entry[1][offset:offset+3] = rgb
        report.append({'material': material.name, 'image': image.name, 'size': list(image.size)})
    for image, pixels, _ in images.values():
        image.pixels[:] = pixels
        image.update()
        image.pack()
    return report


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--')+1:]
    asset_id = args[0]
    policy = json.loads((PROJECT/'docs/design/Shared_Palette.json').read_text())
    changes = policy['pilot'][asset_id]
    catalog = json.loads((PROJECT/'assets/asset_catalog.json').read_text())
    entry = next(e for e in catalog['assets'] if e['id'] == asset_id and e['version'] == 'v01')
    manifest_path = PROJECT/entry['manifest']
    manifest = json.loads(manifest_path.read_text())
    bpy.ops.wm.open_mainfile(filepath=str(PROJECT/manifest['source']['path']))
    inspection = {'asset': asset_id, 'objects': len(bpy.data.objects), 'actions': [a.name for a in bpy.data.actions],
                  'images': [{'name': i.name, 'size': list(i.size), 'packed': bool(i.packed_file)} for i in bpy.data.images], 'changes': changes}
    print('PALETTE_INSPECTION', json.dumps(inspection))
    if '--apply' in args:
        for spec in manifest['texturePalettes']:
            for role, color in changes.items():
                spec['roles'][role]['color'] = color
        manifest['palette']['colors'].update(changes)
        inspection['bindings'] = apply_manifest_swatches(manifest)
        bpy.context.preferences.filepaths.save_version = 0
        bpy.ops.wm.save_as_mainfile(filepath=str(PROJECT/manifest['source']['path']))
        manifest_path.write_text(json.dumps(manifest, indent=2)+'\n')
        (manifest_path.parent/'validation/shared_palette_source.json').write_text(json.dumps(inspection, indent=2)+'\n')
