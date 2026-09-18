"""Run the bundled label overlay with wider clearing for generated text."""
import importlib.util
from pathlib import Path

source = Path.home() / '.codex/skills/tower-defense-concept-sheet/scripts/apply_labels.py'
spec = importlib.util.spec_from_file_location('concept_labels', source)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
original_clear = module.clear_with_row_samples

def clear_generated_labels(target, template, box, sample_width=12):
    x1, y1, x2, y2 = box
    if y1 in (447, 842):
        center = (x1 + x2) // 2
        col = min(range(3), key=lambda i: abs(module.PANEL_CENTERS[i] - center))
        left, right = ((35, 551), (580, 1091), (1121, 1636))[col]
        box = (left, y1, right, 490 if y1 == 447 else 889)
    original_clear(target, template, box, sample_width)

module.clear_with_row_samples = clear_generated_labels
if __name__ == '__main__':
    raise SystemExit(module.main())
