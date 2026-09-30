"""Classic-only recipe; the shared Modern source is intentionally independent."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('sculpt.py')), init_globals={'OCTOCAT_STYLE': 'classic'})
