# Developer Tower — source decisions

## User direction — 2026-09-24

Create the Developer Tower model from the five supplied detailed reference sheets.
The images are visual inputs; captions are not additional user instructions.
Original attachments are retained under references/ with descriptive filenames.

## Production brief

- Compact head-shaped Copilot persona, without additional body, stand or prop.
- Orange faceted helmet and three layered backward-swept cooling fins, with real
  negative space between their trailing edges and dark radiator cores inside.
- Thick graphite goggles, continuous beveled frames, solid bridge and opaque,
  softly convex inset teal lenses. Face remains visible below the goggles.
- Dark inset face, paired cyan capsule eyes, continuous angular graphite chin.
- Mirrored ivory octagonal temple housings, inset graphite panels and raised
  ivory curly braces constructed as continuous mitered strokes.
- Graphite rear casing and two recessed horizontal ventilation slots.
- Existing family scale, approximately 2.4 m wide and 2.2 m high, bottom at ground.
- Maximum 5,000 triangles (user raised the budget during the quality correction),
  two opaque materials, one packed 32 x 4 palette image with two sampler bindings.
- Static model pass; no invented motion clips. UI/action/target anchors provided.

## Construction ownership

Local build.py owns the silhouette and details; shared Maker provides mesh helpers,
packed palette authoring and Blender saving. Named vertex groups retain component
selection within the combined editable mesh. Future procedural delivery must use
the guarded source-hash workflow. Gameplay code is untouched.

## Quality correction — 2026-09-24 (subsequently rejected)

The user rejected the initial 2,182-triangle model as low quality, authorized a
5,000-triangle ceiling, reiterated the contour reference, and specifically
challenged the vertically flat front. No project rule requires a planar front.
Do not restore that geometry as an interpretation of low-poly style.

The revised source uses a rounded casing, a shaped orange mantle with boolean-
integrated swept fins, deeper chamfered goggles, continuous curved glass normals,
layered temple housings, and a contoured rear panel with true vent recesses.
The complete front assembly follows a convex profile in both width and height:
cheeks recede, the display bulges, and the jaw rolls underneath. Shared attachment
boundaries receive the same deformation. The frame and lens seats stay aligned.

## Historical revision 4 review — superseded by user rejection

Revision 4: 4,456 triangles, two materials, 2.54 x 2.17 x 2.18 m. Guarded delivery
passes without errors or Three.js warnings. Static model, no animation authored.
Personally inspected exported front, side, rear, top, close front-oblique,
rear-oblique, underside, phone-width and small-silhouette views. Eye/goggle
readability and the three-fin silhouette persist at small size. User artistic
acceptance remains pending; technical validation does not imply approval.
The rejected first-pass recipe and prior source/export milestones are retained.

## Subsequent user rejection and audit — 2026-09-24

The user reports that revision 4's general body shape remains far from the
original contour/silhouette and requests evaluation of both geometry and process.
Revision 4 fails design fidelity despite passing technical delivery checks.
See validation/shape_audit.md for the grounded comparison and required next
method. The positive review above records checks performed, not a successful
shape match. Do not use the generic section loft plus global wrap_front as the
accepted design basis. A new landmark-driven primary-form blockout is required.

## Landmark reconstruction and second review — 2026-09-24

Current delivery is revision 8: 4,228 triangles, two materials, approximately
2.39 x 2.20 x 2.29 m. Source and runtime identities are in asset.json and
validation/visual_review.json. The 5,000-triangle ceiling remains in effect.

The body now uses authored horizontal cross-sections with explicit front, rear,
width and height landmarks. Crown and fin roots/tips follow the enlarged side
contour; front widths reconcile the front contour. Coordinates and assumptions
are retained in build.py and validation/landmarks.json. Illustrated sheets are
not perfectly orthographic; the contour sheet governs the outline, while the
colored views govern material boundaries, thickness and accessory construction.

The chin projects at the front before receding underneath. Goggles and temples
remain rigid fitted components. The orange cheek edge follows the crown boundary,
temple sockets seat into the casing, and rear vents are recessed into the body.
The earlier global front deformation and separate projecting rear hatch are gone.

The second review found and corrected crown/casing protrusions, cheek seating,
temple clearance, and degenerate triangles in hidden vent backings. Reviewed
fixed front/side/top views, close front-oblique, reverse, underside and phone/small
views of the exported reconstruction, then rechecked the affected final views.
Source checks report zero boundary/non-manifold edges, loose vertices and
zero-area triangles. Runtime validation and the Inspector review have no errors.

Under uniform-height, aspect-preserving diagnostic alignment, front silhouette
overlap rises from 0.8620 to 0.9138 and side from 0.7752 to 0.9306. The overlays
are retained in validation/landmark_comparison; these measurements do not judge
surface joins or constitute user acceptance. Author review is complete; user
artistic acceptance is not inferred. Static model: no rig or animation clips.

The complete task retrospective and proposed shared workflow changes are in
docs/design/Developer_Asset_Workflow_Retrospective.md at the project root.

## User acceptance — 2026-09-24

The user accepted revision 8 with 'Much better! Great work' and requested that
the successful method improve the shared game-asset workflow. Acceptance is
recorded against revision 8's source/export hashes in validation/visual_review.json.
The model geometry and materials were not changed during the workflow update.



## Animation pass — 2026-09-24

- User accepted the model at revision 8, then explicitly requested the missing
  baseline animations. No additional animation permission question was needed.
- User chose "Gentle hover/glide (recommended)" for this limb-free body. No limbs
  or walking contacts were added. Grounded authoring Rest Pose remains unchanged;
  ready/playback height is 0.14 m above the ground.
- Accepted baseline: r8_approved_model_before_animation, source hash
  6b8a76f7885fc796f8c27c2d3cc3bc15e1f0690faf12fb803e0fa0878d5f2b3f;
  GLB e5627fa1339cd99e2ddf471e24e6d992d9684f0ec3f1a158cfaf9dd4446d2711.
- Revision 9 adds body, eye_l and eye_r bones. The shell/goggles/fins remain rigid.
  Action and target anchors follow body; UI anchor remains root-relative. Rest
  positions, topology, UVs, palette bytes and materials match the accepted model.
- Rest Pose is an unanimated Inspector state. Authored at 24 fps: idle 60 frames
  (2.5 s), work 40 (1.667 s), move 32 (1.333 s), place 26 (1.083 s), hit 14
  (0.583 s), resolve 30 (1.25 s). All clips begin at frame zero and include their
  final sample. `move` is the game contract's Walk/locomotion name.
- Idle: quiet hover and blink. Work: forward focus/nod and narrowed eyes. Move:
  gentle glide lean/sway. Place: descending arrival and soft settling. Hit:
  quick backward recoil and display flinch, recovering to ready. Resolve:
  compact power-down exit; holds a 3.5% terminal body scale to avoid singular
  skin transforms. Presentation removes the resolved entity on simulation state,
  not on an animation outcome. One-shots use clamped endpoints in the Inspector.
- `animate.py` is called from the authoritative build recipe. Source is saved
  with muted NLA tracks, no active action and rest bones. Root remains stationary;
  authored pose motion never translates the simulation entity.
- Validation/evidence: validation/animation/runtime_audit.json, loop and one-shot
  boards, and shared Inspector playback/phone captures. Review acceptance of the
  new animation revision remains pending user feedback, separate from model r8.

- Second author pass: r9 Resolve compacted too near the floor for its intended
  exit. Revision 10 raises the shrinking center to retain the original face-level
  focus and drift upward. Rechecked actual GLB rest parity, all 96 Hz clip samples,
  transition blends, phone poses, two normal-speed loop cycles, one-shot holds
  and Rest Pose resets. Final animation user acceptance remains pending.


## Digital lifecycle effects — revisions 11–12, 2026-09-24

- User explicitly authorized the discussed block-disintegration Resolve. Revision
  11 replaces whole-body shrink with full-size display power-down plus runtime
  grid dissolve, cyan edges and surface-colored cube fragments. R10 source/export
  were preserved in revisions/r10_before_digital_resolve.
- User praised the result ("looks amazing!") and requested the reverse for Place.
  Revision 12 uses the same 1.25-second presentation timeline backwards, with
  reversed eye animation. Place starts invisible and ends exactly at Idle ready;
  Resolve ends invisible. Accepted model geometry and other four clips are intact.
- User then requested this pair as the default for any tower. The guide and both
  asset skills now apply it in authorized tower animation passes, while preserving
  model review before the animation offer. This does not silently convert other
  delivered towers. Enemy and Work/task entry/resolve concepts remain unselected.
- Runtime implementation: tools/asset-presentation/digital-resolve.js. Parameters
  live in the manifest's presentation.resolve and matching Blender root extras.
  Shader/debris require the presenter in addition to the GLB pose clips; gameplay
  position, outcomes and entity lifecycle remain simulation-owned.
- Maximum per-instance geometry: 4228 model + 64 cubes x 12 = 4996 triangles.
  Inspector shares a 256-cube budget; exhausted leases fall back to grid dissolve.
  Source samples are prepared during loading to avoid first-play preprocessing.
- Final review: validation/visual_review.json binds source, GLB and renderer hashes.
  Reversal boundary precision was corrected during the second pass; exact ready
  endpoint, Rest reset, replay, seeking, reload, shadows and budget cleanup passed.

## Shared supporting palette — revision 13 (2026-09-26)

User chose to preserve character identities and unify supporting neutrals and small accents. Applied graphite #333E48 to both declared base-colour material bindings in the authoritative packed Blender image. Preserved shell/trim/lens identity colours and, for Security, navy casing. Retained original packed emission image bytes and sampling through separate base-image bindings. Before-source/runtime milestone: before_shared_palette. Geometry, normals, UVs, rig, anchors, morphs, clips and material/emission response pass exact exported parity.

Personally inspected final close iso/rear, phone rest/work and the common-scale roster comparison; no colour bleed or loss of face/casing separation was seen. Second author review and hash-bound validation are in validation/visual_review.json and validation/shared_palette_parity.json. Source/export identifiers: e16057a101143737470a53b48f57d5beccfddab2399ab08c6cde44c8dbf86dc4 / 9fd5a1b9dc6414306847da17caa29a15f7fd1e2a956fb1198ded1d06553d9fb8. User artistic acceptance of this revision remains pending. Shared role values and deliberate exceptions are in docs/design/Shared_Palette.json.
