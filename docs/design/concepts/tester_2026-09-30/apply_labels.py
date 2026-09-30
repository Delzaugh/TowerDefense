#!/usr/bin/env python3
"""Apply exact title/category/option labels to the six-panel concept sheet.

The script deliberately restores the template's protected text and badge zones,
then draws exact copy from a JSON file. It does not modify the concept artwork
in the central model areas.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Iterable

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Pillow is required. Install it with: python -m pip install Pillow"
    ) from exc

BASE_W = 1672
BASE_H = 941

# Coordinates are measured against the bundled 1672x941 template.
PANEL_CENTERS = (287, 823, 1360)
TOP_NAME_Y = 436
TOP_DESC_Y = 464
BOTTOM_NAME_Y = 831
BOTTOM_DESC_Y = 859

TEXT_MAIN = (232, 237, 247, 255)
TEXT_SECONDARY = (194, 204, 220, 255)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--template", required=True, help="Bundled template image")
    parser.add_argument("--input", required=True, help="Generated concept sheet")
    parser.add_argument("--data", required=True, help="JSON metadata file")
    parser.add_argument("--output", required=True, help="Final labeled PNG/JPG")
    return parser.parse_args()


def load_json(path: str) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)

    required = ("title", "subtitle", "category", "options")
    missing = [key for key in required if key not in data]
    if missing:
        raise ValueError(f"Metadata is missing: {', '.join(missing)}")

    if not isinstance(data["options"], list) or len(data["options"]) != 6:
        raise ValueError("metadata.options must contain exactly six entries")

    for index, option in enumerate(data["options"], start=1):
        if not isinstance(option, dict) or not option.get("name") or not option.get("description"):
            raise ValueError(f"Option {index} requires non-empty name and description")

    return data


def find_font(bold: bool) -> str:
    candidates: Iterable[str]
    if bold:
        candidates = (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
        )
    else:
        candidates = (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "C:/Windows/Fonts/arial.ttf",
        )

    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate
    raise FileNotFoundError("No supported system sans-serif font was found")


def fit_font(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_path: str,
    max_size: int,
    min_size: int,
    max_width: int,
    max_height: int,
) -> ImageFont.FreeTypeFont:
    for size in range(max_size, min_size - 1, -1):
        font = ImageFont.truetype(font_path, size=size)
        box = draw.textbbox((0, 0), text, font=font)
        width = box[2] - box[0]
        height = box[3] - box[1]
        if width <= max_width and height <= max_height:
            return font
    return ImageFont.truetype(font_path, size=min_size)


def scale_box(box: tuple[int, int, int, int], sx: float, sy: float) -> tuple[int, int, int, int]:
    x1, y1, x2, y2 = box
    return (round(x1 * sx), round(y1 * sy), round(x2 * sx), round(y2 * sy))


def clear_with_row_samples(
    target: Image.Image,
    template: Image.Image,
    box: tuple[int, int, int, int],
    sample_width: int = 12,
) -> None:
    """Clear text while approximating the template's row-wise background gradient.

    Each row is filled with the median-like average of narrow strips on both sides
    of the protected zone. This avoids obvious flat rectangles while keeping the
    operation deterministic and dependency-free.
    """

    import statistics

    x1, y1, x2, y2 = box
    target_px = target.load()
    template_px = template.load()
    width, height = target.size

    x1 = max(0, min(width - 1, x1))
    x2 = max(x1 + 1, min(width, x2))
    y1 = max(0, min(height - 1, y1))
    y2 = max(y1 + 1, min(height, y2))

    for y in range(y1, y2):
        samples: list[tuple[int, int, int, int]] = []
        for x in range(max(0, x1 - sample_width), x1):
            samples.append(template_px[x, y])
        for x in range(x2, min(width, x2 + sample_width)):
            samples.append(template_px[x, y])

        if not samples:
            samples = [template_px[max(0, x1 - 1), y]]

        rgba = tuple(int(statistics.median(pixel[channel] for pixel in samples)) for channel in range(4))
        for x in range(x1, x2):
            target_px[x, y] = rgba


def paste_template_patch(
    target: Image.Image,
    template: Image.Image,
    box: tuple[int, int, int, int],
) -> None:
    target.paste(template.crop(box), box[:2])


def draw_centered(
    draw: ImageDraw.ImageDraw,
    text: str,
    center_x: int,
    center_y: int,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
) -> None:
    draw.text((center_x, center_y), text, font=font, fill=fill, anchor="mm")


def main() -> int:
    args = parse_args()
    data = load_json(args.data)

    template = Image.open(args.template).convert("RGBA")
    generated = Image.open(args.input).convert("RGBA")
    if generated.size != template.size:
        generated = generated.resize(template.size, Image.Resampling.LANCZOS)

    output = generated.copy()
    width, height = template.size
    sx = width / BASE_W
    sy = height / BASE_H

    # Restore number badges exactly from the template.
    badge_boxes = [
        (38, 122, 108, 174),
        (577, 122, 647, 174),
        (1113, 122, 1183, 174),
        (38, 513, 108, 565),
        (577, 513, 647, 565),
        (1113, 513, 1183, 565),
    ]
    for box in badge_boxes:
        paste_template_patch(output, template, scale_box(box, sx, sy))

    # Restore full protected zones to remove shifted generator typography.
    for box in [(30, 5, 1644, 99)] + [(cx-250, y, cx+250, y+82) for cx in PANEL_CENTERS for y in (410, 805)]:
        paste_template_patch(output, template, scale_box(box, sx, sy))
    # Clear template/header placeholders from the generated image.
    clear_boxes = [
        (38, 8, 820, 96),       # title and subtitle
        (1395, 35, 1644, 91),   # category
    ]
    for cx in PANEL_CENTERS:
        clear_boxes.extend(
            [
                (cx - 150, 410, cx + 150, 450),
                (cx - 205, 447, cx + 205, 482),
                (cx - 150, 805, cx + 150, 848),
                (cx - 205, 842, cx + 205, 879),
            ]
        )
    for box in clear_boxes:
        clear_with_row_samples(output, template, scale_box(box, sx, sy))

    draw = ImageDraw.Draw(output)
    bold_path = find_font(bold=True)
    regular_path = find_font(bold=False)

    title_font = fit_font(
        draw,
        str(data["title"]),
        bold_path,
        max_size=38,
        min_size=24,
        max_width=760,
        max_height=48,
    )
    subtitle_font = fit_font(
        draw,
        str(data["subtitle"]),
        regular_path,
        max_size=22,
        min_size=15,
        max_width=920,
        max_height=32,
    )
    category_font = fit_font(
        draw,
        str(data["category"]),
        regular_path,
        max_size=18,
        min_size=13,
        max_width=250,
        max_height=25,
    )

    draw.text((52 * sx, 20 * sy), str(data["title"]), font=title_font, fill=TEXT_MAIN)
    draw.text((52 * sx, 63 * sy), str(data["subtitle"]), font=subtitle_font, fill=TEXT_SECONDARY)
    draw.text((1600 * sx, 60 * sy), str(data["category"]), font=category_font, fill=TEXT_SECONDARY, anchor="rm")

    for index, option in enumerate(data["options"]):
        col = index % 3
        row = index // 3
        center_x = round(PANEL_CENTERS[col] * sx)
        name_y = round((TOP_NAME_Y if row == 0 else BOTTOM_NAME_Y) * sy)
        desc_y = round((TOP_DESC_Y if row == 0 else BOTTOM_DESC_Y) * sy)

        name = str(option["name"])
        description = str(option["description"])
        name_font = fit_font(draw, name, bold_path, 19, 13, round(300 * sx), round(27 * sy))
        desc_font = fit_font(draw, description, regular_path, 15, 10, round(390 * sx), round(24 * sy))

        draw_centered(draw, name, center_x, name_y, name_font, TEXT_MAIN)
        draw_centered(draw, description, center_x, desc_y, desc_font, TEXT_SECONDARY)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.convert("RGB").save(output_path, quality=95)
    print(str(output_path))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(2)

