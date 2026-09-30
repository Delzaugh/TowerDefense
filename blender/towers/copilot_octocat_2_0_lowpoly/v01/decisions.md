# GitHub Octocat 2.0 Low Poly

## User direction — 2026-09-30

Create a separate low-poly version aiming for about 4,000 triangles. Hard delivery
ceiling: 4,000. Preserve the corrected revision 7 anatomy, palette, expression,
wave pose and accessory anchors. The original model remains unchanged.

## Reference priorities and landmarks

Pinned original source owns identity and proportion; the GitHub Animation Team
turnaround and construction sheets published at https://www.tonytimetables.com/mona/
own anatomy. Exactly five tentacles meet beneath the head: two act as arms, three
support this upright pose. Preserve bulbous tips, flatter inner faces, five cups
per tentacle, two pointed inset ears, shallow forehead dip, broad cheek lobes,
open smile and four whiskers. Compare front, side, reverse/underside and isometric
negative spaces against the original before handoff.

## Construction

Use region-specific topology reduction of the pinned editable sculpt, giving the
head silhouette and body most of the budget. Refit facial surfaces to the reduced
head and cups to the reduced skin. Keep original 40 x 4 palette and 512 x 512 face
map packed/embedded. Preserve authored scale, placement root and nine anchors.
Smooth normals on deliberate low-density planes retain the friendly rounded look.
The shared pipeline owns export; the recipe only saves a staged Blender source.

## Animation handoff

Static model milestone; animation pending. No placeholder clips. Future baseline:
idle, work, move, place, hit, resolve, with three-support rest anatomy and shared
tower digital assembly/disintegration effects. User acceptance is separate from
author review and remains pending.
## Completed low-poly review — revision 4

Final: 3,961 triangles, two meshes, two materials, two embedded textures and
no bones/clips. Reduction from the 68,180-triangle original is 94.19%. Named
part_* vertex groups retain palette components for source editing. Head map
remains a separate mesh/material. Nine anchors and the five construction paths
are preserved. All three feet contact the plane at zero.

Revision 2 review exposed partial cup occlusion by coarse body triangles.
Revision 3 used triangle interior/edge sampling to clear cups and cheek patches.
Revision 4 consolidated palette geometry. Personally inspected final front,
side, oblique, reverse, underside, face close-ups, phone and small silhouette
views, then completed a second reference/attachment/readability assessment.
Technical validation and the source anatomy audit passed. Original source and
runtime hashes are unchanged. User artistic acceptance remains pending.

Runtime hash cce0b58ce52f8a470aa7de57e44e0453bdebff3bf854bfecd6de1b8af02fb7ee.
Source hash e7b3f4e99b114f7b75d72660845762b2abb2fdac21ff54517a40d7962d5ed0bf.
Animation remains pending.
## Face UV leak repair — revision 5

User reported peach skin-coloured slivers on the lower side/back of both models,
with a close-up screenshot. This invalidates the preceding positive construction
assessment; rejection and findings are retained in review history. Diagnosis
identified expanded front-depth UV projection onto rear/underside polygons.

Restrict the face projection to front-hemisphere, forward-facing polygons.
All remaining polygons sample one safe graphite texel. Store scaled projection
metadata in the high source; the low recipe uses a new pinned revision 8 source
and explicitly reapplies the mapping after reduction to protect the seam.
The original pinned revision 7 input remains historical.

Reviewed actual runtime underside, side, front, close oblique, phone and game
views after export, followed by a second check of the affected underside/side
boundary. The low-poly user preview was also checked in the exact reported
close-up camera, preserved through Refresh. The sliver disappeared.
Source UV audit: 708 back-facing/rear polygons,
zero projection failures. Source shell/grounding audit and runtime checks passed.
Final: 3961 triangles, 2 meshes, 2 materials,
2 embedded textures, 0 bones. Animation remains pending.
Runtime hash b16e408dc3409a139609abda088fae9d368bccae599b82114c516f253d4454ee.
Source hash a264b9081b1d2994551b5e656635f9b0cb287bee24185e23dff8700784d1290f.
User acceptance of this corrected revision remains pending.
