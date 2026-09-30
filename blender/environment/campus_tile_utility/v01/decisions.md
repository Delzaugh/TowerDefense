# Utility Yard tile brief and decisions

User direction: new utility yard section with concrete service pads, restrained cable channels, and friendly campus palette. Parent owns roads and final campus placement. All local ground is flat at y1.20; no surface height changes. Root bottom is y0.

Shared reference: docs/design/Campus_Tile_System.md and the canonical campus_base_hex source. Preserve radius18, six exact edge midpoint anchors, anchor_surface, existing shell and trim, roughness .92, and the quiet outer1.4m #354B64 band. No grid or route is painted into the tile.

The editable recipe calls the existing shared foundation builder without modifying it. A packed 512x512 spatial atlas supplies two concrete pads: west x[-12,-2.4],z[-7,6.5], east x[4,12],z[-8,7]. Paint fades into the preserved quiet edge. Panels are broad 4m modules; each pad has one covered cable channel. Frame roles remain solid editable swatches. Runtime has one mesh/material/embedded image and 108 triangles.

Primary-form comparison: exact shared flat hex retained; top and iso export reviewed before detail/phone assessment. No geometry variation was necessary because this section is a level service yard. Local central road x[-.6,2.6] and full shoulder x[-1,3] remain available, with terminal landing x[-1.4,3.4],z[-13.02,-9.41].

Delivery: v01 revision2. Technical export and second author visual review passed; see validation/visual_review.json. User acceptance pending. Static environment: no animation clips requested.


## Narrow terrain joins — 2026-09-24

User rejected the broad blue separators. Surface colour now reaches the perimeter through a .54 m muted neutral transition, with a .06 m quiet edge; the outer structural wall and all terrain/connection geometry remain unchanged. Utility has full concrete paving, expansion joints, service bays and flush drains. This supersedes the previous 1.4 m slate surface border. Source-authored packed textures, not runtime tint.
