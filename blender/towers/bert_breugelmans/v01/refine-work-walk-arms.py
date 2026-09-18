"""Correct Work's palm roll and Move's arm carriage in the packed source."""
import bpy,importlib.util
from pathlib import Path
base=Path(__file__).parent;source=base/'bert_breugelmans_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source));rig=bpy.data.objects['bert_rig']
for name in ('move','work'):
    spec=importlib.util.spec_from_file_location('bert_'+name,base/(name+'.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);module.author(rig)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(source))
print('Saved inward Work palm roll and relaxed walking arms; geometry and other clips retained.')
