from pathlib import Path
import runpy
folder=Path(__file__).resolve().parent
runpy.run_path(str(folder.parents[3]/'tools/asset-recipes/codicon-extrusion.py'),init_globals={'asset_folder':str(folder)})
