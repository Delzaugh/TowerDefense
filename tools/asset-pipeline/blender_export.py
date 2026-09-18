"""Isolated selected-root export. Never saves or alters the input .blend."""
import bpy, json, sys, struct
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:]
manifest = json.loads(Path(args[0]).read_text(encoding='utf-8'))
source, destination = args[1:3]
bpy.ops.wm.open_mainfile(filepath=source)
scene = bpy.context.scene
if abs(scene.unit_settings.scale_length - 1) > 1e-6:
    raise RuntimeError('Authoring scale must be metres (scale_length = 1)')
root = bpy.data.objects.get(manifest['contract']['root'])
if root is None:
    raise RuntimeError('Source lacks required root')
objects = [root, *root.children_recursive]
if any(o.type in {'CAMERA', 'LIGHT'} for o in objects):
    raise RuntimeError('Camera or light is parented to the export root')
bpy.ops.object.select_all(action='DESELECT')
for obj in objects:
    obj.hide_set(False)
    obj.select_set(True)
    if obj.animation_data:
        obj.animation_data.action = None
        for track in obj.animation_data.nla_tracks:
            track.mute = True
    if obj.type == 'ARMATURE':
        obj.data.pose_position = 'POSE'
        for bone in obj.pose.bones:
            bone.matrix_basis.identity()
scene.frame_set(0)
bpy.context.view_layer.update()
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(
    filepath=destination, export_format='GLB', use_selection=True,
    export_yup=True, export_extras=True, export_normals=True,
    export_texcoords=True, export_skins=True, export_animations=bool(manifest['clips']),
    export_animation_mode='NLA_TRACKS', export_all_vertex_colors=False,
    export_sampling_interpolation_fallback=manifest.get('exportSettings', {}).get('samplingInterpolation', 'LINEAR'),
    export_attributes=True)
# Preserve palette sampling and independently specified morph interpolation.
settings = manifest.get('exportSettings', {})
if settings.get('paletteSampler') == 'linear' or settings.get('morphSamplingInterpolation'):
    file=Path(destination);raw=file.read_bytes();length=struct.unpack_from('<I',raw,12)[0]
    document=json.loads(raw[20:20+length]);tail=raw[20+length:]
    if settings.get('paletteSampler') == 'linear':
        # Scope the override to declared base palettes. Emission/detail maps
        # keep their authored sampler even when Blender shares a sampler.
        names={p['material'] for p in manifest.get('texturePalettes',[])}
        auxiliary=set()
        def collect_aux(value):
            if isinstance(value,dict):
                for key,item in value.items():
                    if key.endswith('Texture') and key!='baseColorTexture' and isinstance(item,dict) and 'index' in item:auxiliary.add(item['index'])
                    else:collect_aux(item)
            elif isinstance(value,list):
                for item in value:collect_aux(item)
        collect_aux(document.get('materials',[]))
        for material in document.get('materials',[]):
            info=material.get('pbrMetallicRoughness',{}).get('baseColorTexture')
            if not info or (names and material.get('name') not in names):continue
            texture=document['textures'][info['index']]
            sampler=dict(document.get('samplers',[])[texture['sampler']]) if 'sampler' in texture else {}
            sampler.update(minFilter=9729,magFilter=9729)
            samplers=document.setdefault('samplers',[])
            if sampler not in samplers:samplers.append(sampler)
            # A texture object can also be referenced by auxiliary channels.
            replacement={**texture,'sampler':samplers.index(sampler)}
            if info['index'] in auxiliary:
                if replacement not in document['textures']:document['textures'].append(replacement)
                info['index']=document['textures'].index(replacement)
            else:texture.update(replacement)
    if settings.get('morphSamplingInterpolation'):
        interpolation=settings['morphSamplingInterpolation']
        if interpolation not in {'STEP', 'LINEAR'}:
            raise ValueError('morphSamplingInterpolation must be STEP or LINEAR')
        for animation in document.get('animations', []):
            for channel in animation['channels']:
                if channel['target']['path'] == 'weights':
                    index=channel['sampler']
                    if any(c['sampler']==index and c['target']['path']!='weights' for c in animation['channels']):
                        sampler=dict(animation['samplers'][index])
                        channel['sampler']=len(animation['samplers'])
                        animation['samplers'].append(sampler)
                    else:
                        sampler=animation['samplers'][index]
                    sampler['interpolation']=interpolation
    encoded=json.dumps(document,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
    file.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(encoded)+len(tail))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+tail)
# Exporters can leave evaluation at the last clip. The source stays untouched;
# restore the isolated process for any future post-export render operation.
for obj in objects:
    if obj.animation_data:
        obj.animation_data.action = None
        for track in obj.animation_data.nla_tracks: track.mute = True
    if obj.type == 'ARMATURE':
        for bone in obj.pose.bones: bone.matrix_basis.identity()
scene.frame_set(0)
bpy.context.view_layer.update()
