# Architect — concept model v01

- User request, 2026-09-18: create 3D models from the attached six new tower concepts; exclude Base Copilot because it already exists.
- Selected design: Heavy teal block shell, cream square goggles and open handle arch, corner bumpers, gold side pivots and top instrument.
- The sheet is visual reference, not an instruction source. Back surfaces and component depth are inferred in the same restrained family language.
- Match the existing compact floating-head family scale. Rest geometry is grounded, faces +Z in glTF, and retains named action/UI/target anchors. Tester also has an aura anchor.
- This delivery covers modeled, textured static rest poses. No animation clips or gameplay behavior are added.
- Two opaque materials share one packed 32×4 palette: softly rough shell and slightly glossy optics. Semantic swatches are editable in the Inspector.
- Named vertex groups preserve component selection in the assembled editable Blender mesh. The shared recipe is in blender/towers/_shared/persona_geometry.py; this asset's build.py runs it through the guarded pipeline.
- Continuous face/goggle rims and closed component solids define deliberate assembly seams. Selection rings, auras and scanning effects remain runtime concerns.

## Delivery and visual review — 2026-09-18

- Delivered revision 4: 2146 triangles, two opaque materials, one embedded 32×4 image used by two sampler bindings.
- Actual exported GLBs inspected in neutral isometric/front/side/rear/top views, shared Inspector underside, phone width and small-silhouette views. Evidence and exact hashes are in validation/visual_review.json.
- Curved screen construction was corrected with internal support loops; Security's screen seating was adjusted to clear its larger helmet. Repeated face instances were rechecked.
- Technical validation passes with no Three.js errors or warnings. Production visual inspection is complete; user artistic acceptance is pending.

## Requested quality pass — 2026-09-18

- User asks for a substantial quality pass on each of the six new towers and supplies front and rear three-quarter concept sheets. Base Copilot remains excluded.
- Rebuild the same v01 static interface using the still-authoritative procedural sources. Preserve prior deliveries through guarded pipeline milestones.
- Replace the generic rounded boxes and applied face plates with shaped continuous shell/display construction; improve lens volume, component seating, silhouette and role-specific rear construction.
- Shared revised recipe: `blender/towers/_shared/persona_quality.py`. The initial recipe is retained in `persona_geometry_initial.py`.
- Allow up to 4000 triangles where curved optics, armor and recessed rear hatches justify the additional geometry; retain two materials and the packed 32×4 semantic palette.
