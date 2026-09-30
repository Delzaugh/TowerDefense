"""Localized first-source UV repair: retain palette data, remove unused primitive UV sets."""
import bpy
from pathlib import Path
root=Path(__file__).resolve().parents[2]
source=root/'blender/environment/gh_membrane_wall/v01/gh_membrane_wall_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
for obj in bpy.data.objects:
    if obj.type=='MESH':
        for layer in list(obj.data.uv_layers):
            if layer.name!='Palette':obj.data.uv_layers.remove(layer)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(source))
