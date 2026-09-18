"""Entry point shared with Classic; writes are redirected by the guarded pipeline."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('sculpt.py')), init_globals={'OCTOCAT_STYLE': globals().get('OCTOCAT_STYLE', 'modern')})
