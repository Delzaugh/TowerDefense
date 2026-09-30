from pathlib import Path
import sys
folder=Path(__file__).resolve().parent
sys.path.insert(0,str(folder))
from mascot_models import build
build('gh_thinktocat',folder)
