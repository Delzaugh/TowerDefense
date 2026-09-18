# Bert Breugelmans v01 — revision 33

Source SHA-256: `d3bce572f7fd790ddf29239fd3c0d8131dc75d22610938d2c39dde934783968c`

Runtime SHA-256: `5873186b9f91a0ba8915eba1ad652ff870135ff461de3369c89f745b88a97f58`

The user rejected the prior Work wrist direction and robotic walking arms, then requested a design pass on the creepy-looking hands. The delivered revision combines all three refinements.

## Changes

- Compact fingers with fuller, rounded distal sections and softer fingertips; shorter thumb with a continuous fuller palm join. Both hands remain closed connected surfaces with fitted articulation and covered wrist joins.
- Explicit inward palm orientation for Work. Actual palm normals stay inward throughout the animation; peak roll is approximately 30 degrees toward the centreline, and fingertips descend about 14 degrees from the wrist. Five-second timing is retained.
- Lower hanging Move arms, approximately 22–25 degrees of soft elbow flexion, shoulder-led arcs, elbow/hand follow-through and palms facing the thighs. No independent sinusoidal wrist waggle. Leg/body timing remains unchanged.
- Recalibrated Celebrate spacing fits the redesigned hands at the same three clap times.

4481 / 4500 triangles, four meshes/materials, one packed 32x16 palette, 22 bones. No gameplay changes. Source saved at rest, with actions cleared and NLA tracks muted. Ordinary guarded export delivered this revision.

## Evidence

`hands_motion_r33/` contains close front/oblique/profile/rear views of the resting hands, four walking phases, Work's offered palms and clap contact. `proportions_walk_r33/` contains full walking/Work sequences, loop samples, and phone/small-silhouette checks. The final exported images were personally inspected; the current user Inspector was observed on revision 33.

- `hand-shape-audit.json`: each hand is one connected closed component; no nonmanifold edges, degenerate faces or non-adjacent self-intersections. No hand self-intersections across 316 authored animation frames.
- `work-walk-arms-audit.json`: non-hand art, packed image, idle and body/leg motion preserved; inward palm direction throughout; zero sampled finger/clothing and arm/pack-tier intersections for Work and Move.
- `celebrate-audit.json`: zero hand intersections across 193 half-frame samples; all three clap distances about 1.316 mm; planted-sole drift below 0.006 mm.
- `walk-contact.json`: 145 quarter-frame samples; support-plane error below 0.571 mm and contact-path error below 0.135 mm.
- `clip-audit.json`: all exported endpoints match; expected rest endpoints retained; stationary base/root.
- `pack-clearance.json`: zero sampled head/hair versus pack intersections in all four clips.
- `straps-work-audit.json`: zero sleeve/strap intersections in idle, Work and Move. **Strict test remains false for Celebrate**, with 83/193 intersecting half-frame samples and at most 72 face pairs. This residual is retained under the user's explicit earlier allowance; it is not a passing result.

Intermediate review caught and corrected lower-strap interference from the relaxed arm carriage. The hand redesign required a new clap contact calibration; separated hands are now rejected by the contact-distance check. These technical checks and personal visual review do not establish the user's artistic acceptance.
