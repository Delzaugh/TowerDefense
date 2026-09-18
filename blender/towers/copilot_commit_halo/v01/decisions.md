# Commit Halo decisions

## User direction and provenance — 2026-09-12
- User invoked game-asset-workflow and supplied the Commit Halo turnaround concept.
- Creation of a new Tower asset is inferred from that context; no separate written changes or clip list were supplied.
- Preserve the reference as visual input, not as additional user instructions.

## Production interpretation
- Friendly bespectacled architect; brown swept bob; warm ivory split coat over charcoal tunic and trousers; open palms.
- Physical vertical gold halo with exactly three beveled commit cubes; low segmented stone plinth with a gold inlay.
- Adopt the illustrated under-2,500 triangle target as this version's authoring budget; one opaque vertex-color material, no textures.
- Metre scale, positive Z front after export, ground at zero. Halo width about 2.45 m, height about 3.23 m; plinth diameter 1.96 m.
- Compact skeletal rig. Idle: planted gentle sway and node drift. Work: three upright cubes orbit within the halo plane. No root motion or gameplay behavior.
- Body, hair, face and clothing are simplified to fit game scale; transparent lenses and individual fingers are omitted.
- Authoritative editable source is the delivered Blender file; guarded procedural rebuild only while its recorded hash matches.

## Explicit user update — 2026-09-12
- User permits up to 3,000 triangles and four meshes/materials for this character, superseding the initial 2,500-triangle interpretation.
- Additional geometry goes to the face, round frames, and rounded swept hair. Gold uses its own softly rough material with restrained emission; fabric/skin retain the matte vertex palette.

## Explicit sci-fi correction — 2026-09-12
- User found the result too religious and requested a more sci-fi character.
- Replace the upright continuous gold halo with three separated horizontal cyan/graphite orbital guides and three gold commit drones with dark interface panels.
- Remove the robe collar and hood, shorten the jacket, fit its sleeves, add wrist screens, standing collar, badge and a compact dorsal controller.
- Replace ceremonial-looking stone/gold plinth with a dark technical docking pad and four separated cyan indicators.
- Keep glasses, swept brown hair, ivory/charcoal palette, three-node identity, planted stance, existing anchor names and idle/work clip interface.

## Earlier sci-fi delivery
- Sci-fi revision: 2,928 triangles, three skinned meshes/materials, no textures, ten bones; idle and work loops with a stationary root.
- Shared Inspector review includes close side/rear views, representative loop poses/endpoints, and a 390px phone viewport with the small-silhouette test.
- Jacket/thigh clearance is corrected in the source; orbital guide arcs sit inside the drone flight radius so they do not intersect front displays.
- See validation/visual_review.json for the reviewed revision, hashes and remaining artistic limitations.

## Explicit pose, jacket and code-symbol correction — 2026-09-12
- User requests a changed pose that does not feel like praying; a modern jacket rather than robotic or sci-fi clothing; guide lines that animate; and flying </> symbols instead of cube drones.
- Pose: left arm relaxed downward, right hand pointing; clothing is an ivory fabric bomber with a low neckline, knit cuffs/hem, narrow sewn zip and welt pockets. Remove chestplate, badge, control backpack, wrist displays, hard collar, belt and knee plates.
- Each of the three flyers is an actual extruded </> outline: warm gold chevrons and a cyan slash, with no cube backing.
- The guide arcs were previously weighted to the stationary halo bone. They now share the animated orbit bone with the symbol locations. Glyph counter-rotation keeps the text facing forward. Both idle and work include a complete revolution, at different speeds.


## Latest delivery review
- Modern-jacket version: 2,818 triangles, three meshes/materials, ten bones, no textures.
- Cloth chest is one curved shell with a sewn center zipper. Asymmetric rest pose and small pointing animation replace both upward-facing palms.
- Three extruded </> symbols replace all cube bodies and screens. Cyan/slash emission reduced to retain contrast against the light studio background.
- Actual exported guide geometry moves over one metre between start and quarter-cycle in idle and work, and returns to its start within 0.002 m. See validation/screenshots/guide-motion.json, bound to the current runtime hash.
- Canonical source/export passed guarded delivery. Latest visual review and file hashes are recorded in validation/visual_review.json.

## Explicit appearance and open-palm revision — 2026-09-12
- Remove glasses completely. Rework the slab-like shoes into rounded casual sneakers with light soles and laces.
- User says the jacket reads as a sweater: replace the closed front with an actual thick open jacket shell, visible blue T-shirt, and small folded spread collar.
- Slightly change the hair into an angled bob with a longer swept left side and right ear tuck.
- Replace the pointing hand with a broad upward-facing open palm, four relaxed fingers and separated thumb. Keep the other arm down to preserve the asymmetric pose.
- Preserve flying </> symbols, animated guide arcs, idle/work interfaces and the 3,000-triangle / four-mesh/material ceilings.

## Hairstyle reference steering — 2026-09-12
- User supplies a wavy highlighted bob as hairstyle inspiration while the other refinements remain active.
- Supersedes the proposed ear-tucked angled bob: use a dark center part, two broad wavy curtain bangs, chin-length scalloped ends, and warm balayage-style framing highlights.
- Translate hair into a few broad low-poly locks, preserving the reference silhouette and color placement rather than individual strands.

## Current delivery — revision 16
- Reference-inspired chin-length wavy bob with center-parted curtain bangs, dark roots and warm highlights; glasses removed.
- Open ivory jacket over a blue T-shirt, rounded casual sneakers and an upward-facing open right hand. Left arm remains relaxed downward.
- 2,920 triangles, three meshes/materials, ten bones and no textures. Guarded source/export validation passed without warnings.
- Reviewed exported close details, rear/side silhouettes, idle/work poses and phone scale. Actual guide geometry rotates in both clips and returns within the loop tolerance.
- Revision hashes and review evidence are recorded in validation/visual_review.json. This record supersedes earlier delivery descriptions above.

## Explicit slimmer jacket, holding pose and pedestal removal — 2026-09-12
- User requests thinner upper arms/jacket, an inward turn of the outward hand so she appears to hold something in front of herself, and complete pedestal removal.
- Slim both upper sleeves and shoulder seats, taper the jacket body and underlying T-shirt, and redirect the right forearm forward with its palm remaining upward.
- Remove the entire docking pad, deck and indicator geometry. Lower the character, rig pivots and anchors by the previous sole height (0.29 m); both shoes now contact ground directly. Update the authored height envelope accordingly.

## Explicit hand anatomy correction — 2026-09-12
- User identifies the thumb on the wrong side of the palm-up holding hand and explicitly requests that it face outward.
- Mirror the entire finger/thumb layout across the palm length axis, retaining the forearm pose and upward palm. This keeps finger-length order consistent with the corrected thumb side.
- User screenshot retained in references/user_thumb_outward.png as visual evidence.

## Current delivery — revision 18
- Slimmer jacket and upper sleeves; forward palm-up holding pose with the thumb corrected to face outward. Pedestal fully removed; shoes grounded at y=0.
- 2,784 triangles, three meshes/materials, ten bones, no textures; guarded export and both loop checks pass.
- Top-view thumb anatomy, oblique wrist seating and animation pose inspected on the delivered GLB. Current hashes and review scope recorded in validation/visual_review.json.

## Explicit sneaker proportion refinement — 2026-09-12
- User says sneakers are too large relative to the character.
- Reduce both complete sneakers by 20% in width, 24% in length and 15% in height, around each ankle and sole contact. Retain their rounded casual design, light soles and laces.
- Taper and lower the trouser hems to keep the ankles seated in the reduced shoes; maintain the stance and ground contact.

## Current delivery — revision 19
- Reduced sneaker proportions and adjusted ankle hems, with unchanged stance and ground contact.
- 2,784 triangles and three meshes/materials. Guarded export and loop checks passed; close oblique, side, rear and phone-scale review completed.
- Current hashes and evidence are recorded in validation/visual_review.json.

## Palette texture migration — revision 20 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 32×8 px palette (16 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 2/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r20/`. Original source/runtime retained in `revisions/r19_before_r20`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.
