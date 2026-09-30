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

## Glitch body reveal — revision 11 (2026-09-24)

User chose Glitch breach for enemies, explicitly scoped to Bug first then review. Retained the accepted source/runtime milestone before authoring. Added spawn and replaced the shrink resolve with full-size 1.25-second pose tracks and shared presentation coverage. Existing move, hit tracks and all rest art, normals, UVs, palette and independent morph data retain exact runtime parity. Source opens in rest with muted NLA and no active actions. The user then requested no breach portal in Spawn: spawnPortal is false in both manifest and Blender root extras. Resolve retains its erase sweep and thin streaks. The arrival slot is fulfilled by spawn; no duplicate place alias is added.

Actual Inspector tests and final desktop/phone author review pass; evidence is under validation/lifecycle and validation/visual_review.json. 2320 model + at most 156 effect triangles = 2476 / 2500. User acceptance of this final animation revision remains pending. The complete effect requires the shared lifecycle presenter; the GLB alone contains its pose tracks. This replaces the earlier shrink-terminal behavior; simulation still owns outcomes and removal.

Source SHA-256: 2201813dba398071a3421289a1f40cba918f3399f9d8214dc97cb2fe742fc075. Runtime SHA-256: a44e0e584813cff6196010273cec3d6c872d8a85a6b3bc8c3a9f4004e8355a51.

## Approved category reference — 2026-09-24

The user approved the current enemy and Work animations and requested them as category defaults. The accepted Bug reference has no Spawn portal; its jagged reveal and erase/streak Resolve are the default for authorized enemy animation work. The user also authorized implementation on the remaining production enemies; the Bug palette comparison experiment is excluded.

## Material consistency — revision 12 (2026-09-27)

User requested continuation on the roster review and the identified Bug material-response issue. Compared uniform white emission at 0.08, 0.02 and zero under neutral/gameplay-like lights, close and small-scale views, and light/slate backgrounds. Selected zero: cobalt facets and red accents read more cleanly, with better-defined dark joints. Preserve the exact palette image and all seven used swatches; roughness remains 0.72 and metallic 0. No new emissive mask, texture, material or geometry was added. Lifecycle reveal/erase effects remain unchanged and presentation-owned.

Saved the authoritative Blender material with Emission Strength 0 and updated build.py to retain this on future guarded rebuilds. Ordinary guarded export delivered revision 12. Retained revision 11 under before_material_refinement. The full exported binary payload is byte-identical; JSON differs only by removal of the uniform emissiveFactor. The GLB is 80 bytes smaller. Proof: validation/material_parity.json.

Personally inspected final close iso/rear, small phone Move, Spawn/Resolve midpoint, terminal Resolve and reset, plus the refreshed roster lineup. Second author review is complete in validation/visual_review.json. User artistic acceptance remains pending. This intentionally supersedes retaining uniform white emission for the earlier appearance-preserving palette migration; that migration's historical comparison remains valid.

Source SHA-256: c066855500b9ef9f1e50118e1cc3b8fdfc4c9b41d0ff3ef0abbc207b43c1a26a. Runtime SHA-256: c065c487c7669562106e12753aa2759bdf194b28bb4214a676fb613871225c41.

## Palette acceptance and cleanup — 2026-09-27

User said "looks good" and requested deleting test/sample files and checking alignment. Recorded acceptance of the final displayed palette for revision 12; source c066855500b9ef9f1e50118e1cc3b8fdfc4c9b41d0ff3ef0abbc207b43c1a26a, runtime c065c487c7669562106e12753aa2759bdf194b28bb4214a676fb613871225c41. Read-only Blender packed-pixel audit and fresh guarded runtime validation pass. Source, recipe, production GLB, current validation evidence and named rollback milestones are retained; disposable staging exports are removed.

## Cinematic acting — 2026-09-30

User explicitly requested expressive cinematic animation polish for these existing cast models. The retained `cinematic_model_baseline` source/export milestone is the model handoff. Preserve accepted rest art, materials, rig, anchors and all existing gameplay clips. Author only the added story clips on the existing rig; animation authorization is explicit, artistic acceptance remains pending. Editable Blender source now owns the added actions; ordinary guarded export is required. Placement root and gameplay outcomes remain scene/simulation owned. Clip timings: story_lurk 2.5s loop, story_grab 1.5s once, story_haul 1.3333333333333333s loop.

## Cinematic acting — 2026-09-30

User explicitly requested expressive cinematic animation polish for these existing cast models. The retained `cinematic_model_baseline` source/export milestone is the model handoff. Preserve accepted rest art, materials, rig, anchors and all existing gameplay clips. Author only the added story clips on the existing rig; animation authorization is explicit, artistic acceptance remains pending. Editable Blender source now owns the added actions; ordinary guarded export is required. Placement root and gameplay outcomes remain scene/simulation owned. Clip timings: story_lurk 2.5s loop, story_grab 1.5s once, story_haul 1.3333333333333333s loop.

Final revision 14: authored support-floor correction avoids penetration in added rigid-body lunge/gait poses. Guarded validation passes; geometry, materials and old clips match baseline bytes. Final source `f6d425f7cc94e67d5410f5bf75e48765c9c3441222b64df31a147e893d957381`, GLB `225f1c9f81e540febb5a353b1417e963a7636463dd4437e7ef8be40634b66d3c`. Animation author review is current; user acceptance pending.

## Cinematic gait repair — 2026-09-30

Explicit cinematic polish scope: replace story_haul and add story_creep using baked two-link IK on the existing sixteen bones. Preserve baseline move/hit/spawn/resolve, geometry/materials/anchors. Frame periods 32/44 at24fps (1.333333/1.833333s); stance sweeps .35/.325m correspond to .70/.65m travel percycle. Temporary analytical targets bake only standard pose channels; no constraints, helper nodes or gameplay root motion are delivered. Actual mesh sole and centroid corrections yield planted tripod stance and .15m recovery lift. Runtime revision15 validated; original clip/geometry/material bytes preserved. Source SHA256 `79f6b55872508ed56d3047a364baccf7a283f7669fc73826a64a60d6a1d16137`, GLB `31c00f89be05ed76157bbaac3d8922c5fd44db652fba2c5345379044ba62074b`. Hash-bound motion author review complete; user acceptance remains pending.
