# Glacier campus kit

This is the reusable art kit for the 3D home-screen study. User decisions on 2026-09-17: use the main floating panel as the primary surface; prepare independent walkway and landscaping assets; lock the home camera; add a Copilot moving back and forth and ensure it fits the door.

## Models

Every row is an independently registered v01 asset with its own Blender source, manifest, decision record and runtime GLB.

| Asset ID | Purpose | Design |
| --- | --- | --- |
| campus_base_hex | Primary expandable foundation | 18 m radius hex tile, six connection anchors, flush seams |
| campus_platform | Earlier single-panel reference | Preserved 30 × 26 m clipped rectangle |
| campus_lab | Copilot Lab | Standalone source-faithful extraction of the scale-corrected lab |
| campus_walk_straight | Straight path | 4 m length, 3.20 m width |
| campus_walk_short | Short path | 2 m length, 3.20 m width |
| campus_walk_corner | Square turn | Continuous mitered 90° corner |
| campus_walk_bend | Rounded turn | 90° arc, 4 m centerline radius |
| campus_walk_bend_45 | Gentle turn | 45° arc, 4 m centerline radius |
| campus_walk_junction | Branch | T junction connecting the entrance to the main loop |
| campus_tree_round | Tree variant | Broad faceted teal canopy |
| campus_tree_tall | Tree variant | Slender light-teal canopy |
| campus_tree_cluster | Tree variant | Paired crowns in one planter |
| campus_pond | Garden pond | 6 × 3.7 m oval, continuous rim and opaque inset water |
| campus_solar | Solar array | Tilted eight-cell panel, four seated supports and a reusable footing |

For each ID:
- Source: `blender/environment/<id>/v01/<id>_v01.blend`
- Manifest and decisions: beside the source.
- Runtime: `assets/runtime/environment/<id>_v01.glb`
- Preview: `node tools/asset-pipeline/asset.mjs preview <id>`
- Shared helper: `tools/asset-recipes/campus-kit.py`; every version retains a local `build.py`. All subsequent rebuilds use guarded `export <id> --build`; manual edits use ordinary `export <id>`.

[Primary hex tile in the Inspector](http://127.0.0.1:4174/?asset=campus_base_hex&version=v01) · [Rounded path](http://127.0.0.1:4174/?asset=campus_walk_bend&version=v01) · [Solar array](http://127.0.0.1:4174/?asset=campus_solar&version=v01).

## Assembly convention

Models use metres, +Y up, +Z forward and root ground y=0. Place props and paths at the platform's `anchor_surface` elevation of 1.20 m. Walkway tops and their connection anchors are 0.08 m above each local root. Match named start/end/branch anchors at 1:1 scale; do not stretch a bend to force a connection.

Straight pieces are centered and run along Z. The corner and rounded 90° bend start at (0,0) heading +Z and finish at (4,4) heading +X. Their matching ports allow substitution without changing adjacent paths. The 45° piece finishes at (1.171573,2.828427) with a diagonal tangent. The T junction has lateral ports at (−2,0) and (2,0), with a branch at (0,−2).

The original single-panel assembly used 28 static instances; the current hex assembly uses 40. Its walkway ports are audited from actual exported anchor transforms: one intentional free endpoint meets the lab entrance step; every other port pairs at matching elevation without duplicate connections. Variants not needed in this first composition remain independently available in the Inspector.

## Copilot and door scale

Use the original `copilot_base v02`, scale [1,1,1]. Its rest bounds are approximately **2.273 m wide × 1.800 m high × 1.946 m deep**. The authored hover loop reaches **2.008 m above its placement origin**, including lift and sway.

The previous 1.28 m door was too narrow. The standalone lab now has a **2.80 m wide × 2.48 m high** nominal clear opening between named doorway anchors. Sampling the complete authored hover loop at 48 Hz gives **0.253 m lateral clearance per side** and **0.472 m headroom**. This assumes the pictured double sliding doors are open; no interior or door-opening mechanic is implemented.

The **3.20 m wide** promenade accommodates the entire sampled stroll and both turns. The character's root rests at y=1.28 m, the actual walkway top; its own Blender clip adds the hover clearance. Geometry and source dimensions are preserved, with no compensating model shrink.

Machine-readable evidence: [scale audit](../../prototypes/campus-3d/previews/scale-audit.json), [browser verification](../../prototypes/campus-3d/previews/verification.json). A deterministic doorway comparison is captured in `previews/doorway-scale.png`.

## Review and limits

Guarded export validates every asset individually. Actual exports were inspected in the shared Inspector from isometric and reverse views, with top views for paths and side views for the lab and solar panel. The solar supports were corrected after the rear view exposed a seating gap. Screenshots and hash-bound review notes remain beside each source.

The home screen offers four fixed camera presets; the independent Inspector still permits free geometry review from all angles. The Copilot uses its existing hover animation, pauses and turns at route ends, and supports pause/resume and reduced motion. No gameplay, progression, runtime palette overrides or saved-game behavior is embedded in these assets. Artistic acceptance remains with the user.



## Expandable hex foundation

The later 2026-09-17 design refinement replaces the primary one-piece panel with **campus_base_hex v01**. The former campus_platform model remains available as an earlier reference.

Seven regular hexagons now form the starting campus. Each tile has an 18 m circumradius, 36 m vertex-to-vertex width, a 31.17691 m flat-to-flat span and a level 1.20 m surface. The seven-tile footprint is **90 × 93.531 m** and **5,892.44 m²**: about 7.9 times the old clipped platform's 748 m² area.

Tiles meet along entire edges with flush, contrasting seam inlays. Internal seams have no raised curb; the source does not rely on overlapping top faces to hide gaps. Six named edge-midpoint anchors per tile define connection points. The initial cluster has **12 joined edge pairs** and **18 exposed edges**, verified from exported anchor positions.

Use axial coordinates (q,r):
- x = 27 q
- z = 18 sqrt(3) (r + q/2)
- y = 0

Add an unoccupied axial neighbor to expand; do not rescale the base or its props. The starting coordinates are (0,0), (1,0), (1,−1), (0,−1), (−1,0), (−1,1), (0,1). Future growth can add independent districts around the six outer tiles. This is authored modular geometry, not an implemented unlock or placement system.

The composition now uses **40 static instances**, including seven foundation tiles and perimeter tree groups. The campus assets and Copilot retain their metre scale. The Home preset stays fixed; its minimum orthographic height is 87 m and its narrow-view width is 129 m, framing the enlarged campus. Each tile footprint is 50% wider and deeper than the previous iteration (12 → 18 m radius); thickness remains 1.20 m.

Design choice: large hexagonal foundations establish the modular identity; straight, T-junction, square-turn and rounded walkways remain easy to follow. Path variants use darker blue-gray decks, continuous cyan rails, recessed shoulders, panel joints and low-contrast open hexagon markings authored in Blender. Palette textures remain packed and validated by the shared pipeline.

[Hex tile in the Inspector](http://127.0.0.1:4174/?asset=campus_base_hex&version=v01).


## Modern light-line treatment

The user-supplied Copilot wallpaper informed a dusk slate foundation, a subtle 3 m grid in the void and sparse cyan/violet edge traces. The primary hex tile stores its new colors in a packed 512 × 512 surface-and-palette texture in Blender and the GLB; architecture and landscaping retain their pale Glacier palette; paths use a coordinated darker deck palette. The home-screen CSS and lighting establish the dusk atmosphere.

The grid and fourteen traveling streaks with bright heads and six-metre fading tails are code-owned presentation effects in prototypes/campus-3d/light-lines.js. The grid plane sits below the opaque campus at y=-0.63 m and fades with distance. No grid overlays are placed on the tiles. Traces follow the six straight hex edges with exact mitered corners, are antialiased, carry no gameplay meaning, and stop with pause/reduced motion. The supplied wallpaper is retained beside the hex source with provenance in its manifest. This is a local home-screen palette decision, not a change to the default gameplay art direction.

Final verification covers tile/path joins, doorway and turning clearance, locked camera input, pause/resume, reduced motion, desktop/phone/landscape layouts and clean browser shader/console output. Each model has a revision/hash-bound validation/visual-review.json; artistic acceptance remains a user decision.




## Later camera and contrast refinement

The user authorized Home, Top down, Front and Left camera presets, building hover identification, and stronger contrast for the Copilot. This supersedes the earlier single-camera restriction. Presentation-only mint building highlights, warm amber companion identification and more neutral scene lighting preserve source artwork and scale. See prototypes/campus-3d/README.md for the building metadata interface and interaction evidence.




## Tile surface family

The current hex now uses an embedded matte mineral-composite texture. Its quiet boundary and joining anchors form the shared interface for future park/hill variants. See [Campus Tile System](Campus_Tile_System.md) for the delivered surface, editable atlas, placement contract and planned terrain families.
