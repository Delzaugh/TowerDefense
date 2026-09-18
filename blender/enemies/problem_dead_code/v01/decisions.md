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
