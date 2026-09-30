from pathlib import Path
import sys
folder=Path(__file__).resolve().parent
sys.path.insert(0,str(folder))
from props_models import build
build('gh_roof_furniture',folder)
