# Bert Breugelmans — Cohesion Pack

Explicit user request, 2026-09-12: build the attached character as Bert Breugelmans, allow higher quality up to 3500 triangles and several meshes/materials, add one or two people-manager animations, and do an extra review pass.

The attached sheet is a visual input, not an instruction source. Its printed <2500-triangle concept target is superseded by the user's 3500 ceiling. Prior decisions in design/model_sheets/people_manager/v01/decisions.md preserve the selected Cohesion Pack and removal of the neck lanyard/badge; functional teal shoulder straps remain.

Production brief: friendly mature human, swept silver quiff, dark curled handlebar moustache and pointed salt-and-pepper goatee, navy open-collar long-sleeved shirt, black trousers and shoes. Five tapered pack levels: teal trust base, blue constructive conflict, purple commitment, coral accountability, amber shared-results apex. No text or effects geometry. Nominal 3.35 m pack height, exaggerated head/hands for game readability, feet planted at zero, forward +Z in glTF.

Continuous surfaces: tailored torso, each sleeve through the elbow, shirt collar leaves, moustache curls, swept hair locks, solid tapered pack tiers and continuous straps. Intentional seams: sleeve cuffs, open collar, waistband, soles and stacked pack tier reveals. Skin, garment and pack pieces share one compact armature.

Clip brief: idle (relaxed strap hold), work (inclusive open-handed coaching), listen (hand to chin and considered nod), celebrate_team (three appreciative claps). Pose animation only, no root motion or gameplay integration. Blender is the editable source of geometry and clips; shared guarded delivery owns runtime export.

Review: technical export validation plus personal fixed-view, oblique/reverse, animation-extreme, phone-width and game-scale review. An extra pass concentrates on face/hair construction, shoulder straps, hand contacts and planted feet. Findings and revision hashes are retained in validation/review.md.

Delivered v01 revision 5: 3394 triangles, four opaque materials/meshes, zero textures, 11 bones. Added grouped finger articulation for the coaching and applause gestures. Extra review corrected shoulder shape, palm facing/contact, hairline and smile overlaps, crotch shape and arm rest-pose continuity. All four clips have exact rest endpoints and no base/root motion. Facial expression remains static. Canonical source remains procedural and hash guarded; ordinary export should be used after any manual Blender edits.

## Hand and relaxed-pose refinement — revision 8

Subsequent explicit user requests: improve the hands specifically, then give Bert a more relaxed open pose with his arms. These supersede the original strap-holding rest pose. Lowered elbows, arms slightly away from the body and softly open palms are now the source rest pose and all animation endpoints.

Both hands are rebuilt as single connected closed skin surfaces: tapered wrist/palm, shared finger-root webbing, staggered rounded fingertips and a thumb emerging from the palm rather than overlapping it. Two stages of grouped finger articulation plus thumb movement preserve silhouette through coaching, listening and applause. Sleeve ends and cuffs taper to the slimmer wrists. Clap spacing is adjusted to the new palm thickness; coaching hands now turn upward naturally.

Final revision 8: 3482 triangles, 4 meshes/materials, no textures, 15 bones. Hand topology audit passes on each hand (one connected closed component, no nonmanifold edges or zero-area faces). All clip endpoints return to the new rest pose, with no root/base motion. Personally reviewed close front/isometric/side hand views, intermediate gestures and clap contact, plus full-model reverse/phone-scale checks. The existing Inspector tab was confirmed on revision 8. Evidence and exact hashes: validation/review_hands_r8.md.

## Pyramid, wrist orientation and listen correction — revision 11

Later explicit requests supersede the initial palette and no-text brief: align pyramid colors to the attached reference (green trust base, blue conflict, yellow commitment, gray accountability, orange results apex), label the lowest tier TRUST, correct the twisted resting palms, and correct the listen animation. The triangle maximum is explicitly increased to 4000.

TRUST is centered on the broad outward/rear face of the lowest tier as flat dark geometry following its slope. Other pyramid labels from the reference were not requested. Teal functional straps retain their separate color role. Resting fingers now follow the forearms downward, with palms facing inward and thumbs forward. Listen uses a lower hand target, softer finger curl and a guided elbow path below the shoulder; the shoulder skin blends with the torso to keep strap seating through the gesture. Source rest and all clip endpoints remain synchronized.

Delivered revision 11: 3529 triangles, four meshes/materials, zero textures, 15 bones. The larger ceiling allows restoration of the prior seven-sided quiff locks after the temporary lettering-budget optimization. Export validation and clip audit pass. Frame-by-frame listen audit confirms the elbow stays at least 0.089 m below the shoulder, with no abrupt rotation flip. Final review: validation/review_r11.md. User's existing Inspector was confirmed on revision 11, listen paused at 1.71 s.

## Nose, backpack and clip removal — revision 12

User explicitly requested better nose construction, deletion of the clipping navy backpack backing box, direct strap connections into the green tier, and removal of listen. The nose became one continuous bridge/tip surface with reduced projection. Both straps now seat inside the green tier at their upper and lower ends; the backing box was deleted. Listen was removed from the source actions, manifest and current review sampling. The Inspector discovers clips dynamically and has no named listen consumer; the coordinated v01 contract now contains only idle, work and celebrate_team. This supersedes all earlier listen approval or correction notes. Revision 12 used 3477 triangles.

## Reference-led hair and clean nose — revision 17

User then explicitly removed nostril marks, requested a detailed hair pass, and supplied a photograph to define the hairstyle. Preserve the stylized character, but follow the photo's short silver sides, open forehead and fuller side-parted top swept backward. This supersedes the original three transverse quiff locks.

Nostril overlay geometry is removed. The final hair uses a denser fitted side shell and a continuous shared-vertex top with shallow longitudinal comb ridges, an offset part and a rearward taper. Five separate trial rolls were replaced by the continuous volume after close-up review. The 4000-triangle ceiling remains authoritative: revision 17 has 3977 triangles, four meshes/materials, zero textures and 15 bones. Existing palette, TRUST label, relaxed hands and three remaining clips are retained. Editable source stays procedural and hash guarded.

Personal runtime review includes front, both profiles, oblique, top, rear backpack attachment, coaching and clap samples, and phone scale. The existing user Inspector was confirmed on revision 17. Exact hashes and limitations are in validation/review_r17.md. Photographic strand-level detail is interpreted as broad low-poly form; artistic acceptance remains the user's decision.

## Pyramid clearance — revision 18

User requested removal of pyramid clipping through the head/hair, a slight scale reduction and tilt. The full five-tier pyramid and TRUST glyphs now use a shared 90% uniform scale about the base center, with an 8-degree backward tilt away from the head. Both upper/lower strap endpoints follow the new green-tier attachment positions; the shoulder route blends into those endpoints. The UI anchor is lowered with the new silhouette, retaining its name and purpose. Overall height is now approximately 3.16 m.

Revision 18 retains 3977 triangles and all three clips. Personal close profile, oblique, rear attachment and phone reviews pass. A read-only Blender audit finds zero triangle intersections between the five pyramid tiers and head/hair over all 231 authored animation frames. The smallest sampled head-vertex-to-pack distance is 0.0491 m during celebrate_team (a vertex sample, not an exact global surface-distance bound). Evidence and exact hashes: validation/review_r18.md.

## Move animation — revision 20

User explicitly requests a move animation. Add move as a looping 32-frame / 1.333-second in-place walking cycle. Alternate planted steps and lifted swing feet, knee flexion, opposing relaxed arm swing, gentle pelvis motion and torso/backpack sway. The source rig adds a pelvis and paired thigh/shin/foot bones (22 total), reweights the existing trouser/shoe surfaces, and retains the same 3977 triangles. Named root/base and anchors remain; there is no root motion or gameplay implementation. Clip discovery in the Inspector is dynamic. The bone-budget expansion is recorded with the requested articulation as its reason.

Move starts and ends in its matching gait pose, not the idle rest pose. Presentation should crossfade when entering or leaving it. Author the move strip from frame zero so the exported loop has no extra initial hold. Planted shoes move backward at constant speed in model space; runtime forward translation is required for walking through the world (nominal stance-matching speed approximately 0.425 m/s at 1x playback).

Revision 20 export and four-clip audit pass. A read-only contact audit checks all 33 authored sample frames: grounded support soles within 0.000001 m, no meaningful ground penetration, swing sole clearance about 0.0897 m. Head/pack intersections remain zero across all four clips. Personal runtime review covers side, front, rear and oblique walking poses, including lift, contact and loop samples. Existing user Inspector is playing move on revision 20. See validation/review_r20.md for exact hashes and evidence.

## Ears and shoe proportions — revision 23

User requests an ear-quality pass on both sides and smaller shoes. Each ear now uses one closed pinna surface with a rolled outer rim, recessed concha and a softly tapered lobe; the old separate protruding inner ellipsoid is removed. Ear seating was adjusted forward/outward after profile review exposed a hair intersection inside the bowl. Both mirrored ears now have clear interiors.

Shoe footprint is 20% shorter and 12% narrower, with soles reduced from 0.065 to 0.050 m. The ankle collar remains fitted to the trousers rather than scaling the whole shoe indiscriminately. Its upper ring follows the shin while the sole and forefoot follow the foot, preserving a covered joint during the walk. The toe box retains the dark leather style.

Revision 23: 3993 / 4000 triangles, four meshes/materials, zero textures and 22 bones. Current four clips remain intact. Close front/both-profile ear review, oblique/profile shoe review, walking swing/rear and phone views complete. Walk contact and pack-clearance audits pass. Existing Inspector confirmed revision 23 while playing move. See validation/review_r23.md.

## Palette texture migration — revision 24 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 32×16 px palette (20 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 2/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r24/`. Original source/runtime retained in `revisions/r23_before_r24`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.

## Natural celebration refinement — revision 26 (2026-09-17)

User requests a deep animation refinement because Celebrate feels clunky and unlike a natural person. Preserve the established three appreciative claps for the team. This pass specifically reauthors `celebrate_team`; `idle`, `work`, and `move` remain unchanged.

The original repeated symmetric motion held the elbows near shoulder height. The new performance keeps the elbows lower and the claps closer to the chest, staggers the hand lift and release, varies the opening amplitudes and clap intervals, and adds restrained anticipation, torso/head overlap and a small supported weight shift. Feet stay planted using baked compensation on the existing leg bones. Palm tilt and spacing were calibrated against the actual deformed hand surfaces. Three contacts occur at frames 28, 40 and 54 of an exact 0–96-frame / four-second clip at 24 fps. Both endpoints return to rest; the root remains stationary. Facial expression remains the existing static smile.

Edited the authoritative packed `.blend` directly, using ordinary guarded export. The shared `celebrate.py` authoring module is also called by `build.py`, so future guarded recipe builds retain the refined performance. Added readable performance markers in Blender. The coherent pre-refinement source, manifest and GLB remain at `revisions/r24_before_natural_celebrate/`.

Revision 25 was an intermediate motion pass. The first export attempt was rejected because Playwright was not resolved; supplying the installed runtime dependency fixed that environment issue. A later dedicated contact audit exposed finger intersections in the first pass. Those were fixed in revision 26 with palm tilt and calibrated spacing, rather than accepting the initial pipeline pass as sufficient.

Final checks: 3993 triangles, 22 bones, four meshes/materials and one packed 32×16 palette; no loader warnings/errors. All four exported clips pass endpoint/root/channel checks. The 193-sample celebration audit finds no hand intersections, about 1.2 mm sampled vertex-to-surface clearance at each clap, and less than 0.006 mm planted-sole drift. Elbows remain at least 0.250 m below their shoulders. Geometry, UVs, weights, packed image bytes and all other source animation curves are unchanged against revision 24. All four clips retain zero sampled head/pack intersections.

Personally reviewed the exported front pose sequence, close front/oblique/profile wrists and sleeves, reverse poses, phone-width view and small silhouette. The shared Inspector was refreshed to revision 26 and left playing Celebrate at 1× for user review. Evidence and hashes: `validation/review_celebrate_r26.md`, `validation/celebrate_r26/`, `validation/celebrate-audit.json`, `validation/clip-audit.json`, and `validation/pack-clearance.json`. Technical validation and this visual review do not imply the user's artistic acceptance.

## Calm Work and strap fit — revision 28 (2026-09-18)

User identifies sleeves clipping through the backpack straps, explicitly accepts residual clipping if a clean fix is not easy, raises the maximum to 4500 triangles, and requests Work to feel like explaining/talking with a calm, relaxed, inspiring vibe. The screenshot is retained as `references/user_strap_clipping_r26.png`.

Work is reauthored as a five-second loop at 24 fps. One open hand introduces a point, the second opens to include the team, then they settle on separate timing. Elbows remain low, fingers stay softly open, and small torso turns and gentle head acknowledgements follow the gesture. Exact rest endpoints, stationary root and planted feet are retained. This is gesture-based conversation with the existing static smile; no lip sync is implied.

Both straps now use continuous, closed, 16-section ribbons with shallow beveled edges, an inboard chest route and a fitted return around the lower torso. Original green-tier anchor positions are preserved. The source has 4361 / 4500 triangles, four meshes/materials, one packed palette and the existing 22 bones. Celebrate's hand reach moves slightly forward and its elbow plane opens to reduce sleeve interference; its established three contacts, timing, palm orientation and four-second duration are preserved.

Residual limitation: arm/strap overlap is reduced visually, but not eliminated during the tight Celebrate poses. The dedicated intersection audit still fails its strict zero-overlap condition for that clip (76 of 193 half-frame samples); this result is retained and is not described as passing. Idle, move and the new Work have zero sampled sleeve/strap intersections. Per the user's explicit allowance, stop short of a more intrusive redesign of arm proportions or deforming strap rig. Standard guarded export, clip continuity/root checks, hand contacts, head/pack clearance and strap topology all pass independently of this known limitation.

The character meshes, UVs, weights, packed image bytes, idle and move curves are unchanged against `revisions/r26_before_work_and_straps/`. All non-strap backpack faces and role colors are unchanged. Shared authoring modules `straps.py` and `work.py` are used by the direct source edit and `build.py`; `celebrate.py` retains the clearance adjustment. Source saved in rest pose with actions cleared and NLA tracks muted. No gameplay changes.

Personally inspected the exported Work sequence in front and isometric views, wrists and straps in close front/both-profile/oblique views, rear attachments, Celebrate extremes, phone width and small silhouette. Review and exact hashes: `validation/review_work_straps_r28.md`; screenshots: `validation/work_straps_r28/`. User artistic acceptance remains separate.

## Work wrists, proportions and natural Move — revision 30 (2026-09-18)

User finds Work hands too flat and requests a slight inward/downward tilt, questions the long legs and thick shoes, and requests a substantial improvement to the robotic Move. References are retained as `references/user_flat_work_hands_r28.png` and `references/user_proportions_r28.png`. The 4500-triangle maximum and prior allowance for residual Celebrate strap clipping still apply.

Work retains the calm staggered five-second explanation. The offered hand orientation now slopes inward/downward with soft finger curl, instead of becoming horizontal at the gesture peaks. Both wrists keep their neutral rest endpoints.

Hip-to-ground height is reduced 10% (1.34 to 1.206 m). Shoe geometry below the original 0.265 m collar is reduced 20% in height, including the sole (0.050 to 0.040 m). The intervening trouser length is smoothly remapped between shoe and hip; upper geometry moves down 0.134 m while retaining its silhouette. Bone pivots, anchors and gesture heights follow the source change. Footprint width/depth, palette, topology, UVs and weights remain intact. Total asset height is now 3.022 m, so the manifest's lower height bound intentionally changes from 3.1 to 2.95 m. No viewer scaling is used.

Move is reauthored as a 36-frame / 1.5-second in-place walk at 24 fps. Heel strike rolls to a flat support foot, then into toe push-off. Swing trajectories join the support path with matched velocities. Weight transfer, small pelvis rotation, counter-rotation of the torso and a stabilized head support the steps. Shoulder, elbow and wrist timing overlap; hands follow the arms instead of holding a fixed world orientation. An initial overly crouched stance was corrected during side-view review, and a first subframe contact audit failure was fixed by aligning contact transitions to authored frames. The nominal stance-matching translation speed is 0.4145 m/s at 1x. Root motion remains disabled; gameplay/presentation code is unchanged.

The canonical packed Blender source was edited directly and exported through guarded delivery. `proportions.py`, `move.py`, `work.py` and `celebrate.py` are shared with the procedural recipe. Proportion application is idempotent; Celebrate's existing choreography is retargeted to the lowered upper body. The coherent baseline is `revisions/r28_before_proportions_walk/`.

Revision 30 remains 4361 / 4500 triangles, four meshes/materials, one packed 32x16 palette and 22 bones. Guarded export and exported clip endpoint/root checks pass. A 145-sample walk audit measures 0.571 mm maximum support-plane error, 0.135 mm maximum contact-path error, and 0.111 m peak swing clearance. The preservation audit confirms the exact requested vertex-height remapping, unchanged topology/UVs/weights/idle curves/packed image, and preserved nonintersecting three-clap hand contacts. Head/pack intersections remain zero in all four clips.

Known limitation retained honestly: the strict sleeve/strap audit remains false for Celebrate (76/193 half-frame samples, unchanged from revision 28). Idle, Work and Move have zero sampled sleeve/strap intersections. Source is saved at rest, active action cleared, NLA tracks muted. Personally reviewed front/profile/rear/isometric proportions and walking sequences, close Work wrists from both sides, Celebrate contact, and phone/game-scale views. Evidence and hashes are in `validation/review_proportions_walk_r30.md` and `validation/proportions_walk_r30/`. These checks do not imply user artistic acceptance.

## Hand design, inward palm roll and relaxed walking arms — revision 33 (2026-09-18)

The user explicitly rejects revision 30's Work tilt as bending outward and still finds Move's arms robotic. That correction supersedes the earlier artistic assessment of the wrist direction. During this pass, the user also requests a hand quality/design refinement because the long angular fingers look creepy; the screenshot is retained as `references/user_hand_quality_r31.png`. The 4500-triangle ceiling remains authoritative.

Both hands are rebuilt as compact, continuous closed surfaces. Fingers are shorter with fuller sections, more rounded eight-sided distal rings, softer tapered tips, and staggered lengths. A shorter three-section thumb and fuller thumb mound replace the angular hooked projection. Wrist seating remains inside the existing cuffs. Finger/thumb pivots are fitted to the new geometry while retaining the same bone names and 22-bone interface. New hands contribute 120 extra triangles, bringing the asset to 4481 / 4500.

Work now uses an explicit anatomical orientation frame: the palm normal points toward the body centreline while the fingers point forward/down. This replaces the ambiguous mirrored Euler construction. At the offered-palm peaks, inward palm roll is approximately 30 degrees and the actual fingertip-to-wrist line slopes down about 14 degrees. The source audit measures inward-facing palms throughout the loop, rather than inferring the direction from a front render. The calm five-second gesture timing remains.

Move's former baseline held the elbows bent forward, producing a stiff carried-arm silhouette. The new arm carriage hangs lower with approximately 22–25 degrees of elbow flexion, a restrained shoulder arc, elbow follow-through and softly cupped hands facing the thighs. Separate sinusoidal wrist motion is removed. Forearm/shoulder spacing is fitted around the shirt and lower strap returns; an intermediate collision with those returns was corrected. Leg timing, support, pelvis, torso and head curves remain unchanged from r30.

Celebrate keeps its established three-clap timing and body performance. Contact spacing is recalibrated for the smaller hands: all three contacts have approximately 1.316 mm sampled surface clearance, with no hand intersections across 193 half-frame samples. A contact-distance bound was added to the contact audit so separated air-claps cannot be described as passing.

The canonical packed source was edited directly and delivered by ordinary guarded export. Shared `hands.py` supplies geometry and digit pivots to the direct edit and procedural recipe; the recipe preserves the new hand shape when applying leg proportions. `work.py` and `move.py` retain the corrected poses. The baseline is `revisions/r30_before_inward_palms_relaxed_arms/`. No gameplay code changed.

Final checks: closed, connected hands with no nonmanifold edges, degenerate faces or non-adjacent self-intersections; no sampled hand self-intersections in any of the 316 authored clip frames; no finger/clothing or arm/pack-tier intersections in Work or Move; zero sleeve/strap intersections in idle, Work and Move; clean exported endpoints and stationary root/base. Non-hand geometry, UVs, weights, packed texture, idle and body/leg motion are preserved. Guarded export passes with four meshes/materials and the existing packed 32x16 palette.

Residual limitation: Celebrate still intersects the straps in 83/193 half-frame samples, with at most 72 face pairs, after its reach was fitted to the redesigned hands. The dedicated strict strap audit remains false; it is not claimed as passing. This is retained under the user's earlier allowance for residual strap clipping.

Personally reviewed the final exported hands from front, oblique, both profiles and reverse; wrist/cuff seating; Work palms; lowered walking hands at opposite phases; clap contacts; full motion sequences; and phone/game-scale readability. The user's existing Inspector shows revision 33. Evidence and exact hashes: `validation/review_hands_motion_r33.md`, `validation/hands_motion_r33/`, and `validation/proportions_walk_r33/`. Artistic acceptance remains the user's decision.

## Straightened thumbs and closed neckline — revision 36 (2026-09-18)

The user identifies a crooked thumb in revision 33, superseding that revision's assessment of the thumb shape. Both thumb centrelines now progress continuously outward and toward the tip without the former reversed segments. The first section is narrowed slightly to clear the index-finger root. The closed, rounded hand design and fitted clap contacts remain. Reference: `references/user_crooked_thumb_r33.png`; milestone: `revisions/r33_before_thumb_alignment/`.

The user then identifies the hollow body seen from above the collar. The shirt's V-shaped opening previously surrounded a narrow neck cylinder with no upper-chest surface. `neck.py` replaces that cylinder with a closed, flared upper chest seated beneath the entire collar rim, blending body weights into the moving neck. Its hidden lower closure uses a low triangle fan so the V-shaped boundary cannot triangulate across the exposed chest. The existing shirt/collar silhouette remains. Reference: `references/user_hollow_neckline_r34.png`. Both direct source edits and the recipe use the shared geometry modules; delivery remains an ordinary export of the authoritative edited source.

Revision 36 has 4499 / 4500 triangles, four meshes/materials, one packed palette, and 22 bones. Hand and neck surfaces are closed and have zero sampled self-intersections across 316 authored animation frames. Forty-eight coverage rays around the neckline in each frame all hit outward-facing chest surfaces; there are no uncovered samples. Work palms remain inward, Move retains lowered shoulder-led arms, and all three claps keep approximately 1.316 mm sampled clearance without hand intersections. Exported endpoints and stationary root pass. Other art and body/leg/idle motion are preserved; the preservation audit explicitly excludes the two requested geometry replacements.

Intermediate revision 34 had a thumb/index-root intersection, and revision 35's nonplanar lower neck cap could expose its underside across part of the V. Both were caught by the focused checks and corrected, not waived. Final runtime views were personally inspected from elevated front/both sides and oblique views through head gestures, close thumb profiles, and phone scale. The user's existing Inspector was refreshed to revision 36 without changing their camera or idle playback. Existing Celebrate sleeve/strap clipping remains under the user's earlier allowance; its strict test is still a known failure, documented in the revision 33 evidence. Full hashes and final evidence are in `validation/review_hands_neck_r36.md`. Technical validation does not establish user artistic acceptance.
