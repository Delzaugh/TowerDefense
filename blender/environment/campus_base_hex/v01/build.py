import runpy
from pathlib import Path
folder=Path(__file__).resolve().parent
project=folder.parents[3]
helpers=runpy.run_path(str(project/'tools/asset-recipes/campus-kit.py'))
helpers['build']('campus_base_hex',folder)
surface=runpy.run_path(str(folder/'surface.py'))
surface['apply_surface'](folder)

