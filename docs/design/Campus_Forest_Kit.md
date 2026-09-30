# Campus forest kit

User direction, 2026-09-24: offer trees without their bases, design a forest concept and bulk forest pieces, and include color and shape variation.

The concept is a quiet campus woodland: faceted crowns, visible trunks, mixed canopy heights, and irregular gaps. Teal trees connect to the existing campus; sage, moss and blue-green expand the natural palette. Muted amber and gold provide an autumn edge. Single trees, ground-free groups and an assembled hex tile serve different placement scales.

## Pieces

| Asset ID | Shape / color | Placement |
| --- | --- | --- |
| `campus_tree_round_bare` | Original round teal crown | Grounded single, no planter |
| `campus_tree_tall_bare` | Original narrow light-teal crown | Grounded single, no planter |
| `campus_tree_cluster_bare` | Original paired teal crowns | Two trunks, no planter |
| `campus_tree_pine_bare` | Tiered blue-green evergreen | Grounded single |
| `campus_tree_spreading_bare` | Wide sage/moss canopy | Grounded single |
| `campus_tree_autumn_bare` | Asymmetric amber/gold crown | Grounded single |
| `campus_forest_mixed` | Mixed grove, 9 placements / 10 trunks | 10 × 10 m ground-free group |
| `campus_forest_dense` | Evergreen thicket, 13 trees | 10 × 10 m ground-free group |
| `campus_forest_edge` | Lower autumn edge, 7 trees | 12 × 6 m ground-free group |
| `campus_tile_forest` | 42 trees, mixed woodland and central clearing | Complete campus hex, 18 m radius |

## Assembly

- Bare trees and groups have their contact plane at y=0. On a flat campus tile, place their root at y=1.20. The existing planter versions remain separate registered assets.
- Groups have no floor, border or plinth. Their module envelopes include crowns; their cardinal anchors lie at the envelope edge. Groups can be stamped at 10 m centers (edge group: 12 × 6 m), rotated and mixed. The rectangular envelopes are placement conventions, not visible geometry or gameplay collision.
- The complete forest tile already includes the park terrain. Its root stays at y=0; do not stack it on another terrain tile. Retain the existing hex lattice: neighboring centers differ by (27, ±15.588457) or (0, ±31.176915) in X/Z. Six surface edge anchors stay at y=1.20.
- A central clearing and a north–south opening retain room for a future path. Tree geometry leaves at least 4 m clear across that opening. This is scenery composition; gameplay routing and collision need separate integration.
- Use individual trees for boundaries and uneven ground. Bulk groups have a flat common contact plane and should not be stretched over hills. Rotate whole groups to reduce repetition; avoid arbitrary nonuniform scaling of crowns.

## Sources and delivery

Each ID resolves through `assets/asset_catalog.json`, with its editable `.blend`, manifest, build wrapper, decisions and review under `blender/environment/<id>/v01/`. Runtime GLBs live in `assets/runtime/environment/`. The shared authoring recipe is `tools/asset-recipes/campus-forest.py`.

The three original forms derive from retained Blender snapshots. The assembled tile retains a snapshot of the current park source. Recipe dependency snapshots preserve the original art even if the original assets later change. All foliage shares the same packed 64 × 4 palette design; the full tile adds the park's packed terrain atlas. The GLBs are self-contained. Consumers may deduplicate the identical foliage material/texture and instance singles; instancing is not implemented by these art files.

## Reviewed delivery

All ten exports passed the guarded Three.js validation and author visual review, including close, reverse, underside and phone-width views. The three original planted sources and runtime files remain intact. Singles use 48–144 triangles; the three groups use 772, 1,068 and 650 triangles, each in one mesh/material. The complete 42-tree tile uses 3,986 triangles and two meshes/materials. Artistic acceptance remains pending user review.

[Kit overview](../../blender/environment/campus_tile_forest/v01/renders/forest-kit-overview.png) · [Hash-bound delivery inventory](../../blender/environment/campus_tile_forest/v01/validation/forest_kit_delivery.json) · [Forest tile in the Inspector](http://127.0.0.1:4175/?asset=campus_tile_forest&version=v01)
