# Construction terrain v01

## User direction and source
The requested Construction Site is a distinct campus section, built in its own terrain/decor pair. This asset owns the earth terrain only. The campus shared shell, trim, six join anchors, metre scale and quiet slate outer band remain the design reference. Source is the packed editable Blender file; build.py and local terrain.py retain the procedural recipe. No third-party models were imported.

## Primary form and material
A level radius-18 flat-top hex keeps the exact existing frame. Top deck is y=1.20 m everywhere, including the corridor and all six ports. Muted earth #9A8B70 establishes the site interior. Restrained broad and fine variation is authored into one packed 512 px atlas, with structural color swatches exposed independently. Roughness is 0.92. Both earth blending and independent variation vanish before the 1.4 m slate #354B64 perimeter band. No grid, painted road, or perimeter lights.

## Placement interface
Tile root: world (0,0,62.353829072), axial (0,2), no rotation. Corresponding campus_construction_decor root: world (0,1.2,62.353829072). Terrain is entirely flat; raised concrete foundations belong to the separate decor asset and must not be duplicated by placement code. Reserve x=2.2..5.8 from north edge through z=6.3, with terminal landing envelope x=1.6..6.4 and z=2.6..6.3.

## Review
Actual exported GLB reviewed in neutral pipeline views and shared Inspector isometric, reverse, close and phone views. The ring is level, continuous and matches the structural profile; coarse earth variation remains subordinate at phone scale. A second assessment confirmed no height discontinuities, overprinted route or noisy rim. Static environment asset; no clips required. Hash-bound author review is in validation/visual_review.json. User artistic acceptance remains pending.


## Narrow terrain joins — 2026-09-24

User rejected the broad blue separators. Surface colour now reaches the perimeter through a .54 m muted neutral transition, with a .06 m quiet edge; the outer structural wall and all terrain/connection geometry remain unchanged. Utility has full concrete paving, expansion joints, service bays and flush drains. This supersedes the previous 1.4 m slate surface border. Source-authored packed textures, not runtime tint.
