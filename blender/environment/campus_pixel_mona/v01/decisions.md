# Campus pixel Mona

User request (2026-09-18): also make pixel versions of Rubber Duck and Mona after the dedicated pixel Copilot. These are small reusable decorative emblems, not replacement towers.

Head-only Mona, matching the existing purple GitHub Mona Head rather than the separate full-body Octocat assets: stepped cat ears, lavender face, large white/dark eyes, small nose and subtle smile.

Match the pixel Copilot family: one connected closed stepped extrusion; color boundaries share the front surface; plain character-color back and sides. Square 0.025 m pixels on a 22 x 20 grid, 0.55 m wide x 0.50 m tall x 0.09 m deep. One mesh, one matte opaque material, packed 32 x 4 palette. No rig or animation. Bottom at ground, front +Z, root at origin.

Source references remain unchanged. Editable grid/palette are in pixel_design.json and asset.json; build.py delegates construction to tools/asset-recipes/pixel-emblem.py. Append the named pixel_mona mesh from the canonical Blender source for future reuse. Existing decorations are unchanged because no new placement or replacement was requested.

## Delivered review — 2026-09-18

Revision 2: 260 triangles, one mesh/material/texture, no bones or clips. Guarded validation passed with no warnings. Personally inspected front, side, iso, rear, close-front and phone evidence. Closed silhouette and shared color boundaries are clean. Plain rear is intentional; fine face detail is secondary at distant decoration scale. User artistic acceptance remains pending.

Source SHA-256: 2eba9a8230146fe97174e3ba4f10412761c80750bb8b54c0fc97b08524daf009
Runtime SHA-256: 158d4f849f5a10df3668ad0d023c8cb225f1dd3696eb4ab567d66b72f7083902
Evidence: validation/visual_review.json and artifacts/campus-pixel-family/review-board.png.
