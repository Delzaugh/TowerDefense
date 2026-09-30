"""Source-owned canyon bridge, survey overlook and plants."""
import runpy
from pathlib import Path
folder=Path(__file__).resolve().parent
runpy.run_path(str(folder.parents[1]/'campus_tile_canyon/v01/build.py'))['build']('campus_canyon_decor',folder)
