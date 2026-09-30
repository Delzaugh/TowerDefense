"""Inspect public creator GIF timing and assemble sampled frames for research."""
from pathlib import Path
import hashlib, json, shutil, sys
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
INPUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT
FILES = {
    '581e74036e966eb5.jpg': 'creator_expression_sheet.webp',
    'ab018610a5434e19.jpg': 'creator_pentaped_walk_sheet.webp',
    '4e37f68e15656581.gif': 'creator_pentaped_walk.gif',
    '59700d97bf117587.gif': 'creator_locomotion_rough.gif',
}
out = []
for file, name in FILES.items():
    target = ROOT / name
    if INPUT != ROOT:
        shutil.copy2(INPUT / file, target)
    im = Image.open(target)
    if im.n_frames <= 1:
        continue
    times, hashes, t = [], [], 0
    for n in range(im.n_frames):
        im.seek(n)
        times.append(t)
        hashes.append(hashlib.sha256(im.convert('RGB').tobytes()).hexdigest())
        t += im.info.get('duration', 0)
    samples = sorted(set(round((im.n_frames - 1) * n / 11) for n in range(12)))
    canvas = Image.new('RGB', (1200, 4 * 290), '#eeeeee')
    draw = ImageDraw.Draw(canvas)
    for i, n in enumerate(samples):
        im.seek(n)
        frame = im.convert('RGB')
        frame.thumbnail((395, 258))
        x, y = (i % 3) * 400, (i // 3) * 290
        canvas.paste(frame, (x, y + 25))
        draw.text((x + 8, y + 6), f'frame {n} | {times[n] / 1000:.2f}s', fill='black')
    canvas.save(ROOT / (target.stem + '_frames.jpg'))
    out.append({'file':name, 'frames':im.n_frames, 'unique_composited_frames':len(set(hashes)),
                'size':im.size, 'duration_ms':t,
                'sample_indices':samples, 'sample_times_ms':[times[n] for n in samples]})
(ROOT / 'frame_analysis.json').write_text(json.dumps(out, indent=2), encoding='utf-8')
print(json.dumps(out, indent=2))
