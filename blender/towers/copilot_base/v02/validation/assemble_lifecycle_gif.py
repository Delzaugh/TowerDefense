"""Turn Inspector captures into a looping Place → Idle → Resolve GIF."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

capture = Path(sys.argv[1])
destination = Path(sys.argv[2])
metadata = json.loads((capture / 'frames.json').read_text(encoding='utf-8'))
assert metadata['sequence'] == ['place', 'idle', 'resolve']
assert len(metadata['frames']) == 62

font_path = Path('C:/Windows/Fonts/segoeuib.ttf')
font = ImageFont.truetype(str(font_path), 23) if font_path.exists() else ImageFont.load_default()
labels = {'place': 'PLACE', 'idle': 'IDLE', 'resolve': 'RESOLVE'}
frames = []
for item in metadata['frames']:
    frame = Image.open(capture / item['file']).convert('RGB')
    assert frame.size == (1010, 653), frame.size
    frame = frame.crop((185, 60, 825, 540))
    draw = ImageDraw.Draw(frame)
    label = labels[item['clip']]
    box = draw.textbbox((0, 0), label, font=font)
    width = box[2] - box[0]
    draw.rounded_rectangle((20, 18, 48 + width, 56), radius=10, fill='#102431')
    draw.text((34, 22), label, fill='#D8F9FF', font=font)
    frames.append(frame)

# One palette for the whole GIF keeps the shell, face and cube colours stable.
sheet = Image.new('RGB', (8 * 160, 8 * 120), '#1b2b35')
for index, frame in enumerate(frames):
    sheet.paste(frame.resize((160, 120), Image.Resampling.LANCZOS), ((index % 8) * 160, (index // 8) * 120))
palette = sheet.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
gif_frames = [frame.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for frame in frames]
durations = [80, 80, 90] * 20 + [80, 80]
destination.parent.mkdir(parents=True, exist_ok=True)
gif_frames[0].save(destination, save_all=True, append_images=gif_frames[1:],
                   duration=durations, loop=0, optimize=True, disposal=2)

# Inspect decoded GIF frames, including transition and loop boundaries.
decoded = Image.open(destination)
assert len(frames) - 2 <= decoded.n_frames <= len(frames), decoded.n_frames
assert decoded.size == (640, 480), decoded.size
selected = [0, 8, 15, 24, 44, 52, decoded.n_frames - 1]
board = Image.new('RGB', (640 * 4, 480 * 2), '#1b2b35')
for cell, index in enumerate(selected):
    decoded.seek(index)
    board.paste(decoded.convert('RGB'), ((cell % 4) * 640, (cell // 4) * 480))
board.save(destination.with_name(destination.stem + '-review.png'))
print(json.dumps({'gif': str(destination), 'frames': decoded.n_frames,
                  'size': decoded.size, 'bytes': destination.stat().st_size,
                  'durationMs': sum(durations)}))
