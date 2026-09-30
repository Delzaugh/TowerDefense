"""Arched warehouse facade bay. Original editable procedural source."""
import sys
from pathlib import Path
folder=Path(__file__).resolve().parent
sys.path.insert(0,str(folder.parents[3]/'tools'/'github-campus-kit'))
from architecture_tools import build
build('gh_facade_bay',folder)
