"""Initial authoring only. Existing sources are never overwritten by this batch."""
import json, runpy, os
from pathlib import Path
project=Path(__file__).resolve().parents[2]
ids=json.loads((Path(__file__).parent/'campus-kit-entries.json').read_text())
for asset_id in ids:
    folder=project/'blender/environment'/asset_id/'v01'
    if (folder/(asset_id+'_v01.blend')).exists():raise RuntimeError('Source already exists; use guarded export --build: '+asset_id)
for asset_id in ids:
    runpy.run_path(str(project/'blender/environment'/asset_id/'v01/build.py'),run_name='__main__')
