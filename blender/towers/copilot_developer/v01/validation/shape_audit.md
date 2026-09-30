# Revision 4 — design fidelity audit, 2026-09-24

Status: **Fails the supplied contour/silhouette design.** The technical export
passes, but that does not establish a successful model. No geometry changed in
this audit. The user's latest wireframe screenshot and original shape/six-view
sheets are the comparison inputs.

## Visible mismatches

| Area | Reference relationship | Revision 4 problem |
| --- | --- | --- |
| Main body | Compact, faceted helmet with a continuous brow/cheek/jaw/rear profile | Generic section-loft core remains legible as a separate box-like mass beneath an orange cover |
| Front profile | Deliberate changes of direction at brow, recessed display and substantial chin | Polynomial front warp creates a bowed face and retreating lower jaw; it does not reproduce the designed profile |
| Orange cheek | Shaped armor around the temple with angled transitions into crown and chin | Broad slab-like side wall with a long simple lower termination |
| Cooling fins | Tapered rearward continuations of the helmet; root thickness and channels establish the silhouette | Three relatively straight rails above the body; fusion into the shell did not fix their proportions or the channel shapes |
| Temple assembly | Octagonal fitted housing establishes the side's proportions and surrounding armor | Constructed independently and subsequently distorted by the whole-model front warp |
| Rear | Rounded/chamfered casing with integrated twin recessed slots | Additional projecting vent panel creates a separate rear layer absent from the reference |
| Goggles | Brow-fitting manufactured frames with clear planar faces and chamfers | Detail is developed ahead of the head; frame shape and seating inherit the global deformation |

## Construction causes

- build.py lines 37–38 begin from an arbitrary softened octagon and hand-picked
  section scales, without traced reference landmarks.
- The mantle and three blades are separately parameterized and boolean-unioned.
  Connection alone does not produce the intended shared crown/fin contour.
- wrap_front is applied to **all** a.v vertices. It changes already-authored
  goggles, housings and symbols along with the face. This was a broad correction
  for a local profile problem and should not become the next base shape.
- Boolean cuts and bevels generate long diagonals and localized dense topology.
  The wireframe also shows hidden surfaces; crossing lines alone do not prove a
  defect. The useful finding is that edge placement does not follow the main
  form changes needed for controlled silhouette editing.
- The review checked loading, component readability and gross intersections but
  did not perform aligned contour comparisons. Its positive wording overstated
  design fidelity. The shared workflow did not require the flat or generic body.

## Measured triangle allocation

Read-only inspection of the delivered .blend, total 4,456 triangles:

| Component | Triangles |
| --- | ---: |
| Core and display | 350 |
| Orange shell and fins | 1,210 |
| Goggles and lenses | 1,000 |
| Temples and symbols | 976 |
| Rear panel and vents | 580 |
| Chin, eyes and radiator cores | 340 |

Increasing the budget added detail without establishing correct primary forms.
The total is sufficient for this style; vertex placement and proportions are the
first-order problem. See shape_allocation.json for the measurement.

## Required next modeling method

1. Preserve revision 4 as rejected history. Start a clean, low-detail primary-form
   blockout, using the front and side contour sheet as the principal targets.
2. Establish a common baseline and scale, then trace brow, face boundary, chin
   tip/bottom, rear curve, temple center/radius, and all fin roots/tips. The sheets
   are illustrative and not perfectly orthographic; reconcile small differences
   using the oblique views rather than copying each independently.
3. Build body sections from those landmarks. Control the jaw, cheeks and rear
   directly. Build the crown and swept-fin roots as one designed surface.
4. Compare flat-shaded and black-silhouette renders at matched front, side, rear
   and oblique views. Use aligned overlays and explicit landmark deviations.
   Keep details hidden until the primary volume matches.
5. Fit rigid temple housings and goggles to the resolved shell; use their local
   orientation and seats instead of deforming the entire finished assembly.
6. Add bevels, symbols, optics and integrated vents. Allocate the 5,000-triangle
   budget after the shapes are resolved, then repeat runtime and visual review.

Success criterion: recognizable contour agreement without color or accessories,
with each major direction change and attachment landmark explained by the
reference. A higher triangle count or a passing GLB validator is not a substitute.
