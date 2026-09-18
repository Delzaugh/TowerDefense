"""Tester: repeatable isolated source recipe. Use the guarded asset pipeline."""
import os, sys
from pathlib import Path
shared=Path(__file__).resolve().parents[2]/'_shared'
sys.path.insert(0,str(shared))
sys.path.insert(0,str(Path(__file__).resolve().parent))
from tester_geometry import build
folder=Path(__file__).resolve().parent
build(os.environ.get('ASSET_MANIFEST',str(folder/'asset.json')),os.environ.get('ASSET_BUILD_DIR',str(folder)),os.environ.get('ASSET_SOURCE_NAME','copilot_tester_v01.blend'))
