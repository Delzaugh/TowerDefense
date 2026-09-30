"""Orange container collaboration studio. Original editable procedural source."""
import sys
from pathlib import Path
folder=Path(__file__).resolve().parent
sys.path.insert(0,str(folder.parents[3]/'tools'/'github-campus-kit'))
from architecture_tools import build
build('gh_container',folder)
