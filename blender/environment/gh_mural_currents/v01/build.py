from pathlib import Path
import sys
folder=Path(__file__).resolve().parent
sys.path.insert(0,str(folder))
from mural_models import build
build(folder,'gh_mural_currents')
