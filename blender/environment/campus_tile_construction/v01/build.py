import runpy
from pathlib import Path
folder=Path(__file__).resolve().parent
runpy.run_path(str(folder/'terrain.py'))['build']('campus_tile_construction',folder)
