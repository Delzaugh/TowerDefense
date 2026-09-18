# Bert Breugelmans v01 — revision 36

Source SHA-256: `888176f03eb21f610e89d111e41744154f6acbe569a056b6f065f2cca9512d29`

Runtime SHA-256: `4a7ebbc16f309e796241b3d6ad3c2d6c8b48ca450aba50b297dccd959e78f1db`

Both crooked thumb centrelines are straightened into continuous tapered arcs, with no fold into the index-finger root. A fitted upper chest replaces the narrow neck cylinder, closing the view into the torso around the V-neck. The lower rim follows the collar; body-to-head weights preserve attachment as the head moves. A recessed fan closes the nonplanar lower rim without an exposed underside. The shorter rounded hands, inward Work palms, lower relaxed Move arms and recalibrated three-clap contacts from revision 33 remain.

4499 / 4500 triangles; four meshes/materials; one packed 32x16 palette; 22 bones. Ordinary guarded export passes with no errors or warnings. No gameplay changes or clip-interface changes.

## Final evidence

- `hands_motion_r36/`: exported close hand views from both profiles, front, reverse and oblique; four walking phases, Work's offered palms and clap contact. Includes archived hash-bound audit reports.
- `neck_r36/`: elevated front/side/rear/oblique views, twelve animation poses per angle, and game/phone scale. `state.json` identifies the revision and runtime hash; no browser errors.
- `hand-shape-audit.json`: one closed component per hand; no degenerate faces or non-adjacent self-intersections at rest or through 316 authored frames.
- `neck-audit.json`: closed 29-vertex chest/neck; zero self-intersections; all 48 collar-rim coverage rays per frame hit upper chest surfaces across 316 frames. Maximum surface recess at a sampled rim point is 9.261 mm.
- `work-walk-arms-audit.json`: inward palms throughout Work, lower 21.8–25.3 degree elbow flex in Move, zero sampled finger/clothing or arm/pack-tier intersections. Art outside the requested hands/neck replacements, packed texture, idle and body/leg motion are preserved.
- `celebrate-audit.json`: zero hand overlaps across 193 half-frame samples, approximately 1.316 mm clearance at all three clap contacts, planted-sole drift below 0.006 mm.
- `clip-audit.json`: exported endpoints and stationary base/root pass.

Personal visual review included the actual final exported thumb profiles, elevated neckline from both sides and front during head gestures, and phone scale. The existing user Inspector was refreshed to revision 36 while preserving camera and idle playback.

Known limitation: Celebrate's sleeve/strap intersection audit remains a failure (revision 33 evidence: 83/193 samples, at most 72 face pairs). The subsequent thumb and neck edits do not alter those sleeves, straps or bone curves. Residual clipping is retained under the user's explicit allowance. Revision 33's lower-body contact and head/pack reports are prior evidence for unchanged geometry/motion, not newly executed revision 36 checks. Artistic acceptance remains with the user.
