"""Edit only Celebrate in the saved source; retain packed art and other clips."""
import bpy, importlib.util, json, hashlib
from pathlib import Path
base=Path(__file__).parent
source=base/'bert_breugelmans_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
spec=importlib.util.spec_from_file_location('bert_celebrate',base/'celebrate.py')
performance=importlib.util.module_from_spec(spec); spec.loader.exec_module(performance)
performance.author(bpy.data.objects['bert_rig'])
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(source))
print('Refined celebrate_team in authoritative source; rest pose saved.')
