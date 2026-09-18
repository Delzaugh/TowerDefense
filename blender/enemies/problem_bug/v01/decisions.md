# Bug decisions

- Original user concept establishes a chunky beetle silhouette; Copilot is a form/material reference.
- User requested removal of the small lightning bolt. Keep it removed.
- User requested aligned front and middle leg attachment points. Preserve the continuous collar/upper-leg/knee connections during edits.
- Clear red accents replace cyan: eyes, antenna tips, dorsal seam, shoulder collars and knee caps. Preserve the cobalt shell.
- User raised the triangle ceiling to 2,500. The closed-carapace revision is 2,320 triangles.
- Existing move, hit and resolve clips remain the v01 interface. Gameplay position and outcomes remain simulation-owned.
- Registration revision 3 corresponds to the existing detail pass. Legacy filenames are retained deliberately.

## User-approved print refinement — 2026-09-13

The user identified a hollow shell and a floating red line between the shell cracks, then explicitly approved rebuilding the shell, seam and belly as one closed body with a supported shallow red groove. The supplied screenshot is retained as `references/user_hollow_shell_floating_seam_r6.png`; it is visual evidence, not an additional instruction source.

Revision 7 replaces the separate left/right shell closures, open edge strips, zero-thickness red strip and overlapping belly ellipsoid with one connected cross-section mesh. It retains the original six longitudinal shell profiles, broad cobalt facets, jagged seam path, 52 mm red floor width, 80 mm groove opening, rolled dark rim and a dark faceted belly. The groove floor is 25 mm below the shell lip, shares vertices with its dark sidewalls, and has continuous body volume beneath it. At 100 mm overall model height, those dimensions are about 3.54 mm red width, 5.44 mm opening and 1.70 mm depth. Groove endpoints close into the front and rear body faces. No internal partition or loose seam sheet remains in the torso.

The body still uses its original rigid body bone. Head, antennae, shoulder collars, upper/lower legs, anchors and all move/hit/resolve keyframes remain unchanged. No static union is applied across animated joints in the game source. Whole-figure posed-print preparation, merging articulated components where required and slicer support checks remain separate; this revision's watertightness claim is specifically for the torso. The closed volume does not require 100% slicer infill.

Guarded rebuild confirmed the revision 6 source hash and retained its source/runtime/recipe under `revisions/r6_before_closed_carapace/`. Revision 7 passes runtime validation without errors or warnings: 2,320 / 2,500 triangles, one mesh/material, no textures, 16 bones and three clips. Source hash: `db013687564dc6f5edd6e186a79c789e5dec2e79b7a559506b0595cf3d6d1ddf`. Runtime hash: `f90170f0ad988f63dd86063826b9de96bfaa5ff7cf8a30c3529e78c7f3486ea5`.

`validation/check_closed_carapace.py` inspects both the saved source and an independent import of the actual delivered GLB. In both, the torso has 126 welded vertices, 248 triangles, one connected component, zero non-manifold edges, zero zero-area triangles, positive enclosed volume and no detected nonadjacent surface intersections. The ten red floor triangles have downward backing throughout the sampled face centers (minimum 0.414 m in authored geometry). GLB hard-normal/color vertex splits are welded only within the rigid torso for topology analysis. Results and source/runtime hashes are in `validation/closed-carapace-report.json`.

Personally inspected actual exported top, isometric, rear, side and move/hit/resolve renders; then inspected the shared Inspector's underside, close top groove, oblique walking pose at 0.75 seconds, phone-width preview and small silhouette. The belly is closed, the red line remains seated in its groove, and inspected attachments retain their connection. Canonical evidence is under `validation/`. Technical validation is complete; artistic acceptance remains with the user.

The current launcher selected the compatible protocol-4 server at http://127.0.0.1:4176/?asset=problem_bug&version=v01. Reused the existing inspector tab and left it displaying the revised Bug in rest/isometric view.

## Palette texture migration — revision 8 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 32×4 px palette (7 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 2/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r8/`. Original source/runtime retained in `revisions/r7_before_r8`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.
