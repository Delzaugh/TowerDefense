# Shape construction and detail review

Use this for geometry work and visual review. Apply checks to the affected parts and their repeated instances; a palette-only edit does not require rebuilding topology. Asset dimensions, tolerances and budgets belong in the manifest, not in this reference.

## Choose the connection before modeling

Read the reference silhouette from front, back and thickness views where available. A cut or fold that changes the outline needs corresponding geometry; a colored triangle on an uncut rectangle cannot provide that outline. Distinguish these connections:

| Intended relationship | Construction criteria |
| --- | --- |
| One continuous shell or graphic | Use shared boundaries or a coherent outline. Material regions can share one surface. Avoid crossing bars or stacked plates that leave notches, exposed ends or coincident faces. |
| Separate panel, trim or inset | Define its seat, thickness and edge clearance. An intentional seam should be consistent, with no floating edge, accidental exposed backing or coplanar flicker. |
| Articulated joint | Define the pivot, socket and moving parts. Preserve visible attachment and clearance through the intended range of motion; see animation.md. |

Connected appearance does not require welding the whole asset. Separate moving components, inlays and hidden attachments may be appropriate. Check manifoldness for parts intended to be closed solids; a manifold result alone does not establish good silhouette, clean shading or absence of intersections.

For continuous borders, symbols and elbows, prefer a closed ring or a single mitered outline over intersecting beveled bars. Preserve consistent stroke width and sensible corner radii. Bevel the intended outer edges; do not accidentally bevel an internal color boundary into a groove. Look for bevel collisions, sliver faces, duplicate surfaces, flipped normals and triangulation artifacts at concave corners.

When an overlap is wrong, resolve the underlying construction. Welding shared boundaries, trimming the backing, seating a separate part or replacing intersecting primitives can each be appropriate. A tiny depth offset is useful for a deliberate surface layer, but is not a substitute for a clean structural join. Inspect from the opposite side before accepting it.

## Align repeated and changing details

Use common centers, baselines, spacing, stroke widths, corner profiles and surface depths for repeated parts. Center the symbol inside its frame and align each row to its associated detail. Inspect the whole group for rhythm and symmetry, then a close-up for individual joins. Preserve intentional asymmetry from the design.

For alternate visual states, define what persists, what is replaced, and what becomes hidden. If a filled state replaces an outline, match their intended silhouette and eliminate unintended backing lips. A shared frame can also be deliberate; do not automatically hide every border. Check symbol inset, depth order and visibility from oblique and rear views as applicable.

Inspect the default, representative intermediate and final states, plus reset. For independent controls, exercise each control and a relevant combination with body motion so one state cannot move or overwrite unrelated parts. Use focused geometric assertions when they establish a useful invariant: matching bounds, a symbol contained within its tile, a retracted backing, or a maintained clearance. Do not impose every possible state combination on a large system.

## Review the delivered geometry

Inspect the GLB in the shared Inspector with neutral lighting, without relying on a tint, shadow or camera angle to conceal a seam. For the changed area use:

- A fixed front or side view for centers, silhouette and spacing.
- A close oblique view for thickness, seating, bevels, overlaps and shading.
- A reverse/underside view when a cut, fold or attachment affects that side.
- Relevant state or animation extremes, followed by phone/game scale.

Use wireframe or Blender topology inspection to diagnose a visible defect, then return to the shaded runtime result to judge the repair. Automated reports can miss coincident surfaces, awkward elbows and exposed backing, even when bounds and triangle counts pass.

Resolve visible defects in the requested area, export, and inspect the new revision from the views that exposed them. Recheck nearby geometry and affected states after a structural fix. Stop iterating when the requested construction is clean and the relevant checks pass; do not turn detail review into unrelated redesign or an approval gate. Record the reviewed revision, useful views/times and any remaining limitation beside the source. Keep evidence outside runtime.
