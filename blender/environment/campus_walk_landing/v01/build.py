import runpy
from pathlib import Path
folder=Path(__file__).resolve().parent
runpy.run_path(str(folder.parents[3]/'tools/asset-recipes/campus-kit.py'))['build']('campus_walk_landing',folder)

