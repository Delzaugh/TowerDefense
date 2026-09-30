# Asset brief and decisions

## Explicit user request — 2026-09-12

“Let's turn this Lag Spike into a model”, using the attached concept sheet and game-asset-workflow skill. The user explicitly distinguishes attachment content from their instructions.

Reference preserved at references/concept.png from codex-clipboard-e7976115-89a8-41d2-bd9f-b3bb89039b00.png. No third-party mesh or texture is used.

## Initial authoring interpretation

See brief.md. Cube-headed humanoid, violet-charcoal planes, cyan eyes, and broken horizontal trails. Use the project baseline of 1,500 triangles and one opaque material, with rigid-weighted articulated limbs. The reference's technical notes are design inputs, not additional user directives. Fragment motion is character-relative; no gameplay implementation is included. Art approval remains pending user feedback.

## User overlap feedback — 2026-09-12

User requested review of spike/character collisions and identified excessive shoulder/arm overlap (references/overlap-feedback.png). Revision 5 moves and shortens the spike banks behind the full arm sweep, replaces overlapping color boxes with single segmented prisms, and separates the transverse fragments. Shoulder/elbow blocks become narrow octagonal hinges; outer arm shells stop short of pivots, and narrow internal links keep articulation connected. Intentional hidden connector seating remains. Palette and clip interfaces are preserved.

## User lag-effect feedback — 2026-09-12

User judged revision 5 spikes too disconnected and requested that they reflect the lag effect (references/disconnected-trails-feedback.png). Revision 6 replaces the single far-back clearance plane with local contours: head strips closely flank and follow the head, torso strips start immediately behind the back, and limb strips flank the arm/leg silhouette. Leading cyan tips remain close while trailing segments stretch and catch up at different phases. Unequal lengths and offsets break the detached-rack arrangement. The corrected arm joints are retained. Close placement is checked per convex part rather than requiring all spikes to sit behind every limb.

## User head-lag animation request — 2026-09-12

User asked to improve move and idle by having the head lag out of position. Revision 7 replaces the tiny head twitch with staged position errors: idle shifts up to 10.5 cm sideways and 6.5 cm rearward, holds, then catches up with a small overshoot. Moving uses two unequal delayed offsets per cycle, up to 12.5 cm sideways and 15.5 cm rearward, with 4-5.5 cm lift for deliberate separation. Head curves use linear interpolation so frozen intervals stay still and one/two-frame corrections stay crisp. Head-attached trails travel with the displaced head. Feet, arm articulation, hit and resolve are preserved. Root remains stationary.

## User direction correction — 2026-09-12

User requested no left/right lag. Revision 8 removes all lateral head translation and yaw from idle and move, preserving the rearward delay, slight lift, hold timing and forward catch-up. This supersedes revision 7 lateral offsets.

## Palette texture migration — revision 9 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 32×8 px palette (9 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 1/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r9/`. Original source/runtime retained in `revisions/r8_before_r9`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.

## Portal-free Glitch breach — revision 10 (2026-09-24)

The user approved the enemy category default and authorized its rollout after the Bug reference. Revision 9 source and runtime were retained as `before_glitch_breach`. Added a 1.25-second `spawn` and replaced only the shrinking `resolve` with a full-size pose. The shared presenter supplies the jagged body reveal, erase sweep and horizontal streaks; no Spawn portal is created. The head briefly lags rearward during Spawn, without the lateral head movement explicitly rejected in revision 8. Resolve retains the lag echo as full-size geometry with a restrained twitch. Idle, Move, Hit, the rest art, UVs, normals, packed palette, rig and anchors retain exact exported parity. The asset-local recipe now reapplies the clips and root metadata on a guarded rebuild.

Nine streaks plus sweep yield a conservative combined ceiling of 1,496 / 1,500 triangles. Guarded export and actual renderer checks passed; source is saved with muted NLA, no active action and rest bones. Inspected close and phone Spawn/Resolve frames, then rechecked terminal ready and invisible frames. Evidence and hash-bound author review: `validation/lifecycle/` and `validation/visual_review.json`. The complete effect requires `tools/asset-presentation/lifecycle.js`; the GLB alone carries the pose tracks. Artistic acceptance of this new revision remains pending.

Source SHA-256: `42deab141f321a002ba2a7d8a8dbcb743c1de429413eddf38b1b4651864424b2`. Runtime SHA-256: `846f7736718f2b6b24d7efea30892db27c78c498f3e377fe27668eff5aa77938`.

## Shared Problems palette — revision 11 (2026-09-27)

User direction: preserve character identities while unifying neutrals/accents, then trial a maximum of eight distinct base colours per Problem. Blue-grey head and body now share the family neutral range. Cyan eyes and segmented blue/cyan/ice trails remain distinct; pale trail tips retain contrast in small and grayscale views. This supersedes earlier authoring palette values, while preserving explicit shape and animation decisions. The delivered palette uses 7 distinct values; semantic roles stay independently editable.

Shared definitions and role bindings: docs/design/Problems_Palette.json. Source packed base image and manifest updated together; ordinary guarded export passed. Prior source/GLB retained under the before_problem_palette milestone. Exact parity and actual Inspector role checks pass (validation/problem_palette_parity.json); final close/reverse and phone Rest/Move evidence personally inspected with a second author review. Geometry, UVs, rig, clips and emission are unchanged. No atlas-size, draw-call or FPS reduction is claimed. Artistic acceptance remains pending. Current source/runtime hashes are bound in validation/visual_review.json.

## Palette acceptance and cleanup — 2026-09-27

User said "looks good" and requested deleting test/sample files and checking alignment. Recorded acceptance of the final displayed palette for revision 11; source a6ebec2a19ce6f6dce5b8a72e4743d3cccf9589bfe152ec6ed90423027821914, runtime 57b50be10be8426bf8639494d49e339d03a9ca9809124285bd998f4b99e12f89. Read-only Blender packed-pixel audit and fresh guarded runtime validation pass. Source, recipe, production GLB, current validation evidence and named rollback milestones are retained; disposable staging exports are removed.
