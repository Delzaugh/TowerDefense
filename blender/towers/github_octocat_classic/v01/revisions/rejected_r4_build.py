"""Classic Octocat recipe. Writes only to ASSET_BUILD_DIR when provided."""
from pathlib import Path
import os, runpy
runpy.run_path(str(Path(__file__).resolve().parents[2] / 'github_octocat_modern' / 'v01' / 'build.py'), init_globals={'OCTOCAT_STYLE': 'classic'})
