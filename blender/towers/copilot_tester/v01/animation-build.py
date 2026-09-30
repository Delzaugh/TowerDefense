import bpy,os,json,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from animate import author
m=json.loads(Path(os.environ.get('ASSET_MANIFEST',HERE/'asset.json')).read_text(encoding='utf-8-sig'))
bpy.ops.wm.open_mainfile(filepath=str(HERE/'revisions/r8_approved_model_before_animation/copilot_tester_v01.blend'))
author(m)
bpy.data.objects['root']['design']='Boundary Watcher approved r8 model; baseline hover/scan animation'
bpy.ops.wm.save_as_mainfile(filepath=str(Path(os.environ.get('ASSET_BUILD_DIR',HERE))/os.environ.get('ASSET_SOURCE_NAME','copilot_tester_v01.blend')))
