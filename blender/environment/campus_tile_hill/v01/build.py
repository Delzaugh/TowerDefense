import runpy
from pathlib import Path
folder=Path(__file__).resolve().parent
project=folder.parents[3]
runpy.run_path(str(project/'tools/asset-recipes/campus-terrain.py'))['build']('campus_tile_hill',folder)
