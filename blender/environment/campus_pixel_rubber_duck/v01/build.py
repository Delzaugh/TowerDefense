"""Versioned Campus pixel Rubber Duck build entry point."""
import runpy
from pathlib import Path
folder=Path(__file__).resolve().parent
runpy.run_path(str(folder.parents[3]/'tools/asset-recipes/pixel-emblem.py'), init_globals={'asset_folder':str(folder)})
