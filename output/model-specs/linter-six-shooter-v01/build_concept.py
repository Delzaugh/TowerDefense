"""Isolated six-shooter visual study; leaves the delivered Linter asset unchanged."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
source = (ROOT / 'blender/towers/_shared/persona_quality.py').read_text(encoding='utf-8')
old = '''        for i in range(8):
            t=2*PI*i/8+PI/8
            # The front pair sits lower and slightly farther out, leaving an'''
new = '''        for i in range(6):
            # Face points along -Y. Six axes are 30, 90, 150, 210, 270,
            # and 330 degrees clockwise from the face direction.
            t=-PI/2+PI/6+i*PI/3
            # The front pair sits lower and slightly farther out, leaving an'''
assert source.count(old) == 1
source = source.replace(old, new)
old = '            front_pair=i in (5,6)'
assert source.count(old) == 1
source = source.replace(old, '            front_pair=i in (0,5)')
# Seat the brow against the octagonal shell rather than leaving a visible side gap.
for old, new in [
    ('(0,-1.06,.765)', '(0,-1.00,.765)'),
    ('(0,-1.149,.765)', '(0,-1.089,.765)'),
    ('(0,-.94,.36)', '(0,-.88,.36)'),
    ('(s*.13,-.995,.35)', '(s*.13,-.935,.35)'),
]:
    assert source.count(old) == 1, old
    source = source.replace(old, new)
namespace = {'__name__': 'linter_six_shooter_concept'}
exec(compile(source, str(ROOT / 'blender/towers/_shared/persona_quality.py'), 'exec'), namespace)
namespace['build'](str(ROOT / 'blender/towers/linter_agent/v01/asset.json'), str(HERE), 'linter_six_shooter_concept.blend')
