"""Edit the authoritative packed source without reconstructing its materials."""
import bpy,importlib.util
from pathlib import Path
base=Path(__file__).parent
source=base/'bert_breugelmans_v01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source));rig=bpy.data.objects['bert_rig']
def module(name):
    spec=importlib.util.spec_from_file_location('bert_'+name,base/(name+'.py'))
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
module('proportions').apply(rig)
for name in ('move','celebrate','work'):module(name).author(rig)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(source))
print('Saved shorter legs, slimmer shoes, tilted Work hands and reauthored Move.')
