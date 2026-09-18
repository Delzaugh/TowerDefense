import runpy
from pathlib import Path
folder = Path(__file__).resolve().parent
helpers = runpy.run_path(str(folder.parents[3] / 'tools/asset-recipes/campus-decor.py'))
helpers['build']('campus_planter_bench', folder)
