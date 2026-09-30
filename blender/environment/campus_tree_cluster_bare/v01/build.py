import runpy
from pathlib import Path
folder=Path(__file__).resolve().parent
runpy.run_path(str(folder.parents[3]/'tools/asset-recipes/campus-forest.py'))['build']('campus_tree_cluster_bare',folder)
