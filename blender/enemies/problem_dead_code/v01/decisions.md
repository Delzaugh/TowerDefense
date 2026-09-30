# Dead Code — v01

## User decisions and provenance

- 2026-09-12: User invoked the game-asset-workflow skill with the supplied Dead Code turnaround sheet. Interpreted as a request to create this game model. Original image preserved in references/concept.png.
- User explicitly selected: add idle, move, hit, and resolve clips.
- Text inside the image is reference content, not additional user instructions. Printed statistics are placeholders; exported measurements come from validation/report.json.

## Production brief and authoring choices

- Preserve the tombstone silhouette, low plinth, broad slate-blue face, raised ivory curly braces, single continuous coral X, dark inactive front slot and recessed rear panel. No lettering or emissive activity.
- Height 1.45 m; footprint approximately 1.16 x 0.50 m. Face +Z in glTF, ground contact at zero. One opaque matte vertex-color material, no textures, one mesh, one deform bone. Shared baseline-enemy budget: 1,500 triangles.
- Slab and plinth form an intentionally seated assembly. Braces and X use individually closed, beveled polygon outlines. Recesses are cut into the slab. All details stay rigidly attached during animation.
- Authoring choice: limb-free rocking hops with support-height correction and no root motion. Idle 2 s; move 1.5 s; hit 0.75 s; resolve 1.25 s. Resolve stays small at the endpoint for the presentation layer to remove; it does not change gameplay state.
- Root and UI/target anchors remain stable. Blender owns geometry and keyframes. No gameplay or presentation code changes are part of this delivery.
- Technical validation and agent visual review do not imply user artistic acceptance.

## Delivered visual review — revision 3

- 868 triangles; one mesh, one opaque material, zero textures, one bone. Measured size: 1.1553 x 1.4500 x 0.5000 m in glTF W/H/D.
- Guarded export and Three.js validation pass without browser warnings. Closed-solid manifold assertions pass in the Blender recipe. The first export attempt stopped on missing Playwright resolution; rerunning with the bundled dependency passed.
- Rear-view review found the inset color applied to a large surrounding polygon because of a centroid-only test. Revision 3 tests the complete polygon boundary instead; the corrected exported rear was inspected.
- Reviewed front/isometric/rear/profile runtime images, close oblique symbol seating, both move extremes, side-view hit recoil, resolve midpoint/end, idle at phone width, and the small silhouette test. No remaining visible construction defects in these views.
- Exported durations include the exporter first-frame offset: idle 2.0417 s, move 1.5417 s, hit 0.7917 s, resolve 1.2917 s. Loops return to the same pose; root stays fixed. Resolve ends at 3.5% scale for presentation-owned removal.
- Detailed hash-bound review: validation/visual_review.json. Artistic acceptance remains with the user.

## User refinement — hovering move

- User explicitly requested hover movement instead of the rocking-hop move animation.
- Replace move with a continuous 1.5 s hovering loop, nominal clearance 0.18 m and gentle 0.022 m bob. Tiny 0.008 rad sway keeps the rigid marker calm. Start/end stay airborne; no takeoff or landing is baked into the repeating clip.
- Author move from frame 0 to avoid a grounded export lead-in. Authoring rest and idle remain grounded; the presentation layer may crossfade between their heights and the hover loop. Simulation still owns path position and facing.
- Supersedes the original hopping locomotion choice only.
- Revision 4 delivered and visually inspected in the shared Inspector: lowest hover at 1.125 s front view; highest hover at 0.375 s at smaller isometric scale; exported move midpoint. All 13 validation samples remain above ground (0.158–0.202 m), loop endpoints match, root stays fixed. Source and runtime hashes are recorded in validation/hover_review.json.

## Palette texture migration — revision 5 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 32×4 px palette (6 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 1/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r5/`. Original source/runtime retained in `revisions/r4_before_r5`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.

## Enemy Glitch breach — revision 6 (2026-09-24)

User approved the Bug enemy lifecycle as the default for this asset. The old shrinking resolve is superseded by a full-size 1.25-second grounded reaction under the shared erase sweep; new spawn uses a jagged reveal directly on the marker, brief registration slip, and no portal. `presentation.lifecycle` and root extras set `glitch_breach` version 1, root anchor, `#FF497C`, `spawnPortal: false`, and twelve thin streak fragments. The combined ceiling is 868 + 12 sweep + 144 streak = 1024 of 1500 triangles. The plinth remains grounded throughout these clips. The user-chosen hovering `move` remains byte-identical and elevated; grounded rest/idle and hover locomotion remain intentionally separate, with their height transition owned by the presentation layer. Earlier idle/move/hit clips and accepted rest art are unchanged. The asset-local `animate_lifecycle.py` is called by the recipe for future guarded builds; this delivery used ordinary export of the edited authoritative Blender source.

Milestone: `revisions/r5_before_glitch_breach/`. Guarded runtime verification, saved-source audit, personal close/phone visual review, and second pass are recorded in `validation/lifecycle/` and `validation/visual_review.json`. Technical and author review pass; user acceptance of this asset's new lifecycle is pending. The complete coverage effect requires the shared `tools/asset-presentation/lifecycle.js` presenter.

## Shared Problems palette — revision 7 (2026-09-27)

User direction: preserve character identities while unifying neutrals/accents, then trial a maximum of eight distinct base colours per Problem. Cool shared slate, paper braces and Bug warning red retain the raised X, brackets, bevel and rear inset contrast. Grounded rest and elevated hover sample remain unchanged. This supersedes earlier authoring palette values, while preserving explicit shape and animation decisions. The delivered palette uses 6 distinct values; semantic roles stay independently editable.

Shared definitions and role bindings: docs/design/Problems_Palette.json. Source packed base image and manifest updated together; ordinary guarded export passed. Prior source/GLB retained under the before_problem_palette milestone. Exact parity and actual Inspector role checks pass (validation/problem_palette_parity.json); final close/reverse and phone Rest/Move evidence personally inspected with a second author review. Geometry, UVs, rig, clips and emission are unchanged. No atlas-size, draw-call or FPS reduction is claimed. Artistic acceptance remains pending. Current source/runtime hashes are bound in validation/visual_review.json.

## Palette acceptance and cleanup — 2026-09-27

User said "looks good" and requested deleting test/sample files and checking alignment. Recorded acceptance of the final displayed palette for revision 7; source 607eab58386040201a0495e5c1fc07380fbdce6cafd9a2b94f479c7d1ca4b6da, runtime 4f1ba014aad4d26238d25336ee915211a36ddb962cfc6c862d5c7e6cb13d38f1. Read-only Blender packed-pixel audit and fresh guarded runtime validation pass. Source, recipe, production GLB, current validation evidence and named rollback milestones are retained; disposable staging exports are removed.
