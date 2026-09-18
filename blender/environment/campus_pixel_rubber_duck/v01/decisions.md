# Campus pixel Rubber Duck

User request (2026-09-18): also make pixel versions of Rubber Duck and Mona after the dedicated pixel Copilot. These are small reusable decorative emblems, not replacement towers.

Front-facing rubber duck with stepped round head and body, two dark eyes, a broad orange bill and wing pixels. Warm yellow/gold identity follows the existing Rubber Duck model.

Match the pixel Copilot family: one connected closed stepped extrusion; color boundaries share the front surface; plain character-color back and sides. Square 0.025 m pixels on a 22 x 20 grid, 0.55 m wide x 0.50 m tall x 0.09 m deep. One mesh, one matte opaque material, packed 32 x 4 palette. No rig or animation. Bottom at ground, front +Z, root at origin.

Source references remain unchanged. Editable grid/palette are in pixel_design.json and asset.json; build.py delegates construction to tools/asset-recipes/pixel-emblem.py. Append the named pixel_rubber_duck mesh from the canonical Blender source for future reuse. Existing decorations are unchanged because no new placement or replacement was requested.

## Delivered review — 2026-09-18

Revision 2: 330 triangles, one mesh/material/texture, no bones or clips. Guarded validation passed with no warnings. Personally inspected front, side, iso, rear, close-front and phone evidence. Closed silhouette and shared color boundaries are clean. Plain rear is intentional; fine face detail is secondary at distant decoration scale. User artistic acceptance remains pending.

Source SHA-256: 0871bda20f69b0a3ad420a52872d50f39c546798c639b12d6395028e99bda152
Runtime SHA-256: c51ea1add9a9fd897ef2b8ee4a340c9af22a90a0367d41f7345ccfa97bcade7c
Evidence: validation/visual_review.json and artifacts/campus-pixel-family/review-board.png.
