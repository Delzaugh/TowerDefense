# Spaghetti Code — production brief and decisions

## Request and provenance — 2026-09-12

The user invoked game-asset-workflow and supplied a Spaghetti Code enemy concept sheet. This is interpreted as a request to create that game asset. The original image is retained at references/concept.png. Its labels, budget target and presentation claims are reference content, not user instructions or verified model statistics.

Explicit user refinement: "the weave is too linear, spagethi code is more chaotic". Preserve irregular curves, varying strand directions and depths, and asymmetry in subsequent revisions; do not restore the orderly straight paired wraps of revision 4.

## Authoring choices

- Compact rounded knot, lime and teal closed strands, orange diamond with dark exclamation mark. No limbs, face, environment geometry or baked shadow.
- Six continuous closed strands have complete octagonal sections. Individually phased nonlinear curves break up regular paired wraps; contact relaxation provides separation between their actual polygonal paths. They remain separate solids with deliberate over/under passages. The badge is a chamfered solid on a short mounting boss; punctuation is shallow seated geometry.
- One matte vertex-color material with editable palette roles, no textures. The manifest permits 2,500 triangles to support the six-strand silhouette (reference ceiling adopted as an authoring choice). The delivered model uses 2,424 triangles and one deform bone.
- Approximately 1.19 m wide, 1.18 m tall and 1.40 m deep. Ground contact is y=0 in glTF, front is +Z. Root is stationary; anchor_ui and anchor_target are included.
- Idle gently compresses the knot; movement is a grounded squirm with the badge facing forward. Hit recoils and returns. Resolve twists and shrinks at the ground. These are authoring choices, not user-approved motion requirements. All four clips are visual only.
- A single rigid deform bone preserves strand clearance and badge attachment across motion. Ground compensation is calculated for each authored keyframe.
- The canonical Blender source is initially procedural. Subsequent rebuilds must use the recorded source hash guard; manual Blender edits take precedence.

## Review

Revision 8: GLB SHA-256 `54e938cb37f664245dafd790211cac3d1e976ac34655389dc947abbce462be1e`; source SHA-256 `7ddeed26e70ba23362c850caff51cf28d92c44b3aa00b1763bd215edb0bd76d8`.

- Guarded export passed: 2,424 triangles, one mesh/material/bone, zero textures, four clips, correct anchors, dimensions and grounding, no Three.js errors or warnings. Idle and move endpoints match. Maximum sampled movement ground penetration is below one micrometre.
- Personally inspected actual exported iso/front/rear/side/top views and hit/resolve midpoint renders. Badge is readable and seated; closed strand paths have varying curves and directions. Read-only source BVH check found zero triangle intersections between the six strands; see validation/strand_clearance.json.
- Shared Inspector revision 8 checked with ground shadows, phone-width viewport and small silhouette test; knot silhouette and warning icon remain legible. Movement checked live and paused at 0.34 seconds; badge attachment and strand clearance remain stable. Full-width isometric rest view restored for delivery.
- R2's first validation attempt could not resolve Playwright. Configuring the installed bundled Playwright path fixed the dependency issue; subsequent guarded validation passed. Failed staging remains separate from runtime.
- Artistic acceptance remains with the user. Motion is a restrained rigid squirm; strands do not independently unravel in resolve. Review screenshots are runtime evidence, not new concept art.

## Badge clearance correction — revision 9

Explicit user report: "the ! part is overlapping with the weave". Source inspection confirmed the diamond housing intersected strands 2 and 4; revision 8's check had covered only strand-to-strand intersections, so its badge seating assessment was incorrect.

The housing and punctuation now move outward along the actual tilted badge normal. The whole rear housing plane has 20 mm of authored separation from the weave. The connector extends back to its original attachment region, with deliberate strand contacts. The chaotic strand geometry is preserved. Overall depth is now 1.52 m; other dimensions, triangle count and clip interface are unchanged.

Guarded delivery and expanded geometry validation passed: no housing/punctuation-to-strand intersections, no strand-to-strand intersections, and connector contact with strands 1, 2 and 4. Reviewed actual runtime front, iso, side and top renders, a close side Inspector view, and the hit pose at 0.25 s. The visible rear connector is intentional. The Inspector was refreshed to revision 9.

## Palette texture migration — revision 10 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 32×4 px palette (5 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 2/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r10/`. Original source/runtime retained in `revisions/r9_before_r10`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.
