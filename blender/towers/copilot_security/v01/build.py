"""Jaw refinement built on the retained, animated revision 16 source."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).resolve().with_name('refine_jaw.py')),run_name='__main__')
