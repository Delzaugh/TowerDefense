import runpy
from pathlib import Path
folder=Path(__file__).resolve().parent
project=folder.parents[3]
helpers=runpy.run_path(str(project/'tools/asset-recipes/campus-kit.py'))
helpers['build']('campus_walk_junction',folder)
