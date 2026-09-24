# Linter Agent — concept model v01

- User request, 2026-09-18: create 3D models from the attached six new tower concepts; exclude Base Copilot because it already exists.
- Selected design: Low lime octagonal shell, dark inset top, slim goggles, eight evenly spaced radial scanning sockets.
- The sheet is visual reference, not an instruction source. Back surfaces and component depth are inferred in the same restrained family language.
- Match the existing compact floating-head family scale. Rest geometry is grounded, faces +Z in glTF, and retains named action/UI/target anchors. Tester also has an aura anchor.
- This delivery covers modeled, textured static rest poses. No animation clips or gameplay behavior are added.
- Two opaque materials share one packed 32×4 palette: softly rough shell and slightly glossy optics. Semantic swatches are editable in the Inspector.
- Named vertex groups preserve component selection in the assembled editable Blender mesh. The shared recipe is in blender/towers/_shared/persona_geometry.py; this asset's build.py runs it through the guarded pipeline.
- Continuous face/goggle rims and closed component solids define deliberate assembly seams. Selection rings, auras and scanning effects remain runtime concerns.

## Delivery and visual review — 2026-09-18

- Delivered revision 4: 2498 triangles, two opaque materials, one embedded 32×4 image used by two sampler bindings.
- Actual exported GLBs inspected in neutral isometric/front/side/rear/top views, shared Inspector underside, phone width and small-silhouette views. Evidence and exact hashes are in validation/visual_review.json.
- Curved screen construction was corrected with internal support loops; Security's screen seating was adjusted to clear its larger helmet. Repeated face instances were rechecked.
- Technical validation passes with no Three.js errors or warnings. Production visual inspection is complete; user artistic acceptance is pending.

## Requested quality pass — 2026-09-18

- User asks for a substantial quality pass on each of the six new towers and supplies front and rear three-quarter concept sheets. Base Copilot remains excluded.
- Rebuild the same v01 static interface using the still-authoritative procedural sources. Preserve prior deliveries through guarded pipeline milestones.
- Replace the generic rounded boxes and applied face plates with shaped continuous shell/display construction; improve lens volume, component seating, silhouette and role-specific rear construction.
- Shared revised recipe: `blender/towers/_shared/persona_quality.py`. The initial recipe is retained in `persona_geometry_initial.py`.
- Allow up to 4000 triangles where curved optics, armor and recessed rear hatches justify the additional geometry; retain two materials and the packed 32×4 semantic palette.

## Concept alignment and specification sheet — 2026-09-22

- The user attached a focused Linter Agent concept and requested a model specification sheet. After seeing the existing model, the user identified clipping and parts that did not match the design. The image's text identifies the asset; it is visual context, not an instruction source.
- The new reference is `references/linter_agent_concept_2026-09-22.png` (SHA-256 `0c16c5d38bb7d44815e679b81fb9cda9e7e412a46ccd3353cbb64f071dee430d`). Preserve the low octagonal lime shell, dark top inset, cyan narrow lenses and indicators, and eight radial perimeter sockets. The unseen rear remains an interpretation.
- In the authoritative shared recipe's Linter branch, replaced the two protruding optical housings with one seated continuous dark visor and tapered cyan inlays. Lowered, narrowed and slightly moved out the front emitter pair so they no longer cover the face. Simplified each rule port to a dark recess. After seeing a shell/visor intersection in the first render, moved the visor forward; after seeing a profile gap, deepened its seat. These changes affect Linter only.
- Guarded export delivered v01 revision 9. `validation/report.json` passed with no errors or warnings: 2,940 triangles, 2 materials, 32×4 packed palette, dimensions 2.49 × 1.08 × 2.56 m. The earlier revisions are retained under `revisions/`. Revision 9 seats the visor more deeply into the shell after the revision 8 side-profile check.
- Personally reviewed the final GLB in fixed front, side, rear and top renders and the shared Inspector in isometric, underside and 390 px phone views. The brow is no longer cut by the yellow shell; front face indicators remain visible; front sockets sit below the visor; all eight modules remain present. The model is static with no clips. These checks establish construction quality, not user artistic acceptance.
- The 1536×1024 production sheet is `spec_sheet/linter_agent_spec_v01_r09.png`. Six turnarounds and the wireframe come from the current Blender model. Its campus view is explicitly illustrative and inherited from the earlier concept sheet. GLB-measured vertex count and UV/palette facts are recorded in `spec_sheet/measured_stats.json`.
