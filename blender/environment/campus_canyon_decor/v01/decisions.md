# Canyon district source decisions

## User direction
User requested a real recessed canyon section and separate thematic decoration, placed in the existing campus. This implements original low-poly static scenery without gameplay or animation. No external reference image or package was used. Shared frame and existing walkway sources are project references.

## Geometry and scale
Hex radius18, thickness1.2, bottom0; slate outer1.4m band at y1.2. Six unchanged edge anchors plus anchor_surface. Shell consists of perimeter walls and bottom only: there is no full top face beneath the basin. Actual recessed bed y.15 and river y.175. Layered warm rim height3.50564. Central traversal deck spans x=-2.6..0.6, z=-6.588457268..5.411542732 at y1.28 when decor is placed at tile center +y1.2. Deck top .08 relative to decor root; rails at x=-2.77 and.77 clear full3.2m width. North/south aliases and start/end anchors are explicit. Approach terrain is level1.2.

## Separate decor
Bridge, shelter and plants share scene-relative coordinates and origin0. Survey shelter center(6.5,10.7); footing bounds x3.9..9.1,z8.8..12.6, base0 relative to decor root. Moved shelter outward1m after checking original footprint against terrain rim; final four corner raycasts all1.2. Plants remain outside route. Parent places tile at world(-27,0,15.588457268) and decor at(-27,1.2,15.588457268). Bridge endpoints become world(-28,1.28,9) and(-28,1.28,21).

## Materials and ownership
One packed512 atlas per asset contains spatial quiet slate border and solid editable swatches; roughness .92. No vertex-color exception. Source recipes belong to these two assets; decor calls the tile-owned recipe helper. Canonical Blender source is editable; subsequent rebuild uses guarded export. No shared helper, catalog or gameplay files edited.

## Review
Actual GLB iso, rear/top and combined reverse/close images were inspected. Shared border, terraced interior and river remain readable at game scale. Bridge openings unobstructed, no top plane over canyon, shelter posts seated. Technical and hash-bound author reviews pass; user artistic acceptance remains pending. Parent handles project-root thumbnail cleanup once parallel Blender jobs finish.

## Normal and shadow repair
Campus integration exposed reversed isolated terrain normals. Corrected source winding for all top patches, river, bed and foundation underside; triangulated warped strip quads so normals match actual delivered triangles. All unique positions remain identical to r2, anchors and placements preserved. Tile r4 and decor r3 were inspected together with directional2048 PCF shadows; bed and water clean, bridge shadows coherent. Author review refreshed, artistic acceptance pending.
