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
