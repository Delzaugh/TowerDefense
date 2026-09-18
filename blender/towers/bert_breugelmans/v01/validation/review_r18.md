# Pyramid clearance — revision 18

Runtime SHA-256: `4cd95be7342a35ffa2126a46cea393d77010e4194b87f8f772c1afa8c3b0ec3b`

Source SHA-256: `50ee8568ecc6a2d29c631544a6d50872a8ce1b256ccca57d2bb33c0ec1e1f0e8`

3977 / 4000 triangles; 4 meshes/materials; 0 textures; 15 bones. Height approximately 3.16 m.

The pyramid and seated TRUST lettering are uniformly scaled to 90% and tilted 8 degrees backward around the base center. The upper and lower strap ends follow the transformed green-tier anchors, with a blended shoulder route. The named UI anchor is lowered to match. This directly addresses the user-reported head/hair intersection without changing the hairstyle.

Personally reviewed the delivered GLB's close left/right profiles, elevated oblique, rear TRUST and strap view, clap contact at 1.26 s and phone-scale rest. The profiles show a clear gap between the tiers and the rear hair/head; both strap routes remain connected. Current screenshots and hash-bound states are in `nose-pack/` and `extra-review/`.

`report.json` passes without errors or warnings. `clip-audit.json` passes all three clips. `pack-clearance.json` checks evaluated Blender geometry over 61 idle, 73 work and 97 celebrate_team frames: zero triangle intersections between pyramid tiers and the head/hair. Minimum sampled head-vertex distance is 0.0491 m; this is supplementary evidence, not an exact minimum distance between entire surfaces. The source was not saved or mutated by the audit.

The existing Inspector was refreshed while preserving its left-view context and confirmed revision 18, hash prefix 4cd95be7342a. Technical and personal review are complete; artistic acceptance remains separate. Existing static face, grouped fingers and simplified hair-detail limitations remain.
