# Campus pixel Copilot

User request: create a small, simple dedicated model from the attached original pixel Copilot and reuse it in the campus decorations. Preserve purple stepped silhouette, blue goggles and green eyes; this supersedes the approximate violet/cyan badge.

0.60 m W x 0.50 m H x 0.09 m D. Grounded at y=0, +Z front. One connected closed extrusion, shared front color boundaries and dissolved coplanar pixels. No bevels, rig, animation or gameplay behavior. One mesh, one matte material, packed 16x4 texture with four reference colors.

The five decorative consumers append the canonical pixel_copilot mesh from this Blender source, scale it uniformly and remap its swatches without changing colors. Consumer GLBs remain self-contained; canonical source changes require guarded rebuild/export of the consumers. Original reference retained under references/.

## Pixel component delivery review — 2026-09-17

Revision 2: 278 triangles, one mesh/material/texture; guarded validation passed. Personally checked the exported front, side, iso, rear, close-front and phone views. Small consumer badges intentionally read as silhouette/color at distance. Artistic acceptance remains pending user review.

Source SHA-256: 710389702f7c0d56925811152563843e6701969061aea6d823b558188c79f86d
Runtime SHA-256: 501d2cf5a2f9dcb9324fbd0139b5fc68c98d0c104445bd795779590410c9bb1d
Evidence: validation/visual_review.json, validation/{front,side,iso}.png and renders/inspector-{iso,rear,detail,phone}.png; collection board at artifacts/campus-decor/review-board.png.
