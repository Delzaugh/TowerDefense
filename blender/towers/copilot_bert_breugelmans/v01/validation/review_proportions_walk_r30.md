# Bert Breugelmans v01 — revision 30

Source SHA-256: `12f246e1a4734ad12104b53c65a57da0fa09d1deaf172ec5235db6644778422e`

Runtime SHA-256: `3fc9bbe93c118cfc16caa212fa71586979aa155816a92d17853be5081fc15296`

Requested refinement: inward/downward Work hands, shorter leg proportions and thinner shoes, and a natural Move. Previous Celebrate refinement remains, retargeted to the new height.

Delivered geometry: 4361 triangles; four meshes/materials; 22 bones; one embedded 32x16 palette. Rest dimensions approximately 1.474 x 3.022 x 1.157 m. Ground preserved. Hip height reduced 10%, shoe height reduced 20%. Contract minimum height was intentionally updated for the new silhouette.

Move is a 1.5-second in-place loop. Heel strike, foot flat, toe push-off and foot swing replace flat sliding support and stopped swing endpoints. Pelvis weight shift, counter-rotation, arm follow-through and head stabilization are baked into the existing bones. Simulation still owns world translation; nominal matching speed is 0.4145 m/s at 1x.

Work keeps its five-second timing with a more oblique palm orientation, downward fingers and gentle curl. No facial animation or lip sync was added.

## Validation

- Guarded runtime delivery passed with no browser loader errors. Exported clip endpoints match, expected rest endpoints remain, and root/base have no motion.
- Quarter-frame source walk checks: 145 samples, maximum support-plane error 0.571 mm, maximum stance-contact path error 0.135 mm, peak sole clearance 0.111 m. Heel/flat/toe support phases are checked using the actual evaluated contact vertices; all sole vertices are checked for penetration.
- Requested geometry remapping matches the retained r28 baseline. Topology, UVs, weights, packed texture bytes and idle curves are unchanged.
- Celebrate retains zero hand intersections across 193 half-frame samples, approximately 1.21 mm sampled hand-surface clearance at all three contacts, and under 0.006 mm planted-sole drift.
- Head/hair versus backpack: zero sampled intersections across all four clips.
- Sleeve/strap audit: zero sampled intersections in idle, work and move. **Strict audit remains failed for celebrate_team**, with 76/193 intersecting samples and at most 56 face pairs, the same residual as r28. The user explicitly allowed this limitation if a clean fix was not easy.

## Personal runtime review

Reviewed actual exported GLB screenshots in `proportions_walk_r30/`: front, profile, rear and isometric rest; walking samples including heel strike, toe-off and swing; close Work frames 38/64/76 from front, oblique and both profiles; Celebrate frame 28; phone width and small silhouette. Side-view review corrected excessive initial crouch. Contact timing was also corrected after an initial numerical audit failure, without weakening the contact thresholds.

The Work profile shows fingertips descending from the wrist and palms angled inward. Shoes retain covered ankle joins and a lower silhouette. Walk support and swing remain readable at game scale. The shared Inspector is the live preview, using the registered runtime only. Technical validation and personal review remain separate from user artistic acceptance.
