from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools'/'github-campus-kit'))
from site_build import build
build(Path(__file__).resolve().parent,'gh_stairs')
