# GitHub Octocat 2.0

## User direction — 2026-09-30

Create an additional Octocat 2.0 model using the style named on GitHub's brand
mascot page. This is a separate `copilot_octocat_2_0` identity. Existing Classic,
Classic Low Poly and Modern sources and runtime payloads are preserved. The
existing Modern model is a construction starting point, not the final reference.

## References and primary form

The official brand page's Octocat 2.0 illustration governs fuller cheeks, inset
ears, expressive eyes and the open smile. The unadorned MyOctocat SVG, linked from
that same page, clarifies anatomy and proportions without costume or scenery.
The image's props, island, butterfly, puddle and lighting colours are omitted.
Both are visual inputs, not additional instructions or public-use authorization.

The anatomy audit added the original GitHub Animation Team turnaround and
construction sheets published by Tony Jaramillo at https://www.tonytimetables.com/mona/.
These govern limb topology over the earlier interpretation of posed illustrations.
GitHub's figurine development account independently confirms five tentacles:
https://github.blog/news-insights/company-news/from-sticker-to-sculpture-the-making-of-the-octocat-figurine/.

Reference landmarks: the head occupies approximately the upper half of the
character; two pointed ears have dark triangular interiors; the face has a
shallow central forehead dip and two outward cheek lobes. Five tentacles taper
toward a common base directly beneath the head. In this upright pose, two act
as arms and three support the character: two front feet and one central rear
foot. There is no separate cat tail or humanoid torso. Limb functions vary
with the pose. Flattened undersides, rounded outer surfaces, bulbous tips and
five cups per tentacle follow the construction sheet. The raised right arm
has a broad downturned tip; the left arm curls inward. Preserve negative spaces
under both arms and between the three supports. The official illustration's
open mouth is used for the rest expression; the SVG's closed smile is a pose variation.

The SVG is a three-quarter illustration and the brand scene uses a different
pose, so neither is treated as an orthographic turnaround. The frontal model is
symmetric through the head, cheeks and front feet, with deliberate arm asymmetry.
Blender Z-up is exported to glTF Y-up, facing +Z. Height is uniformly baked to
1.80029 m, matching the established Copilot scale; the placement root is identity.

## Construction and materials

Head/ears and the shared tentacle base/five limbs each form a continuous remeshed organic shell.
Rounded foot volumes and a flattened waving palm blend into their respective
limbs. Facial surfaces follow the resolved skull; the face colour is painted
on that shell rather than a stacked mask. Eyes, glints, mouth, ear insets and
shallow cups are deliberate fitted details. Five source construction paths
and nine accessory/gameplay anchors remain available.

Retain family graphite fur, peach face, brown irises and pale teal suckers.
Add dark ear interiors and a plum mouth with pink tongue; use pale mint eye
whites from the official base reference. One packed 40 x 4 semantic palette
and one packed 512 x 512 face map are embedded in the export. The face map is
an intentional painted boundary, not a solid swatch palette. Two materials.

Use the existing Modern quality envelope of 75,000 triangles for this sculpt;
the Classic Low Poly's explicit 3,500 cap belongs to that separate model.
Crowded-scene performance remains unprofiled. No gameplay integration is in scope.

## Review

Primary-form and final runtime review evidence is retained under validation/ and
renders/. Technical validation, author review and user acceptance are separate.
The hash-bound review records the final reviewed revision. User acceptance is
pending until explicit feedback on that revision.

## Animation handoff

Model-only delivery; animation pending. Planned baseline: rest pose plus `idle`,
`work`, `move`, `place`, `hit` and `resolve`, with the established tower digital
assembly/disintegration effect. No clips or rig are added before the model
handoff and animation authorization. Future locomotion must preserve five
tentacles and respect the three-support rest pose; choose the changing support
pattern and tentacle follow-through in the authorized animation pass.

## Historical model review — revision 4 (superseded by anatomy correction)

This earlier review used posed illustrations and incorrectly treated the fifth
tentacle as a tail. Its two-foot interpretation and 45 cups are superseded by
revision 7. The original statistics and findings below remain historical evidence.

Primary blockout revision 2 was inspected in front, side and isometric runtime
views before fitting details. The broad rounded head, projecting cheek band,
continuous arm roots and two-foot negative space followed the official base.
Shortened the low torso volume before detailing to avoid a central nub between
the legs. The first blockout candidate failed a width minimum intended for the
whiskered final form; the primary-form envelope was corrected and its replacement
passed. Failed staging evidence is retained.

Revision 3 review exposed a smile too close to the chin and a rough face-map
boundary. Raised/reduced the smile, projected its interior on additional rings,
supersampled the face map and moved the UV projection seam away from the cheek
edge. Revision 4 passed the second author review in the shared Inspector, including
close frontal/oblique, reverse, underside, phone and small-silhouette views.

Final: 74,142 triangles, 20 meshes, 2 materials, 2 embedded textures, 0 bones.
Dimensions: 1.45384 x 1.80029 x 0.80259 m. Both head/body shells are connected and
closed with zero degenerate faces; both support contacts are at zero height.
Forty-five shallow cups and nine anchors remain. Guarded validation reports no
errors or warnings. Inspector loaded hash fe8cb0924ebd6530a05c21980d2362a67365a3e47010d4e4c057ebf1e4caa985.
Source hash 774d10ace79c8c8a9d6d0d54b363a518b4ac81787c34ee122e5dfb1fb57c2069. Existing Octocat source/runtime hashes were
rechecked and remain unchanged.

User model acceptance and animation authorization remain pending.
## Anatomy correction and completed model review — revision 7

The user requested reference-backed anatomy verification. Original GitHub Animation
Team sheets reveal that the previous rear-tail interpretation was wrong. Five
tentacles meet beneath the head; the turnaround uses two arm-like tentacles and
three supporting feet in its upright pose. The construction sheet shows five
cups per tentacle, flattened undersides and bulbous tips. The official figurine
article independently confirms five tentacles and a pentagonal arrangement.

Revision 5 rebuilt the shared head-base connection and three-support anatomy.
Revision 6 revised cup seating and spacing. The contact audit exposed front
feet above the rear support. Revision 7 corrected their common contact plane.

Personally reviewed final runtime in front, side, oblique, reverse, underside
and close-face views, then at phone and game scale. The second review compared
the repaired export against creator sheets. User acceptance remains pending.

Final: 68,180 triangles, 20 meshes,
2 materials, 2 embedded textures, 0 bones; dimensions 1.45321 x 1.80029 x 0.82901 m.
Both head/body shells are connected and closed with zero nonmanifold edges or
degenerate faces. All three support contacts are at zero. Twenty-five cups and
nine anchors remain. Guarded validation reports no errors or warnings.
Runtime hash 6df765bcd18a7a7807ae2d8950722a97f88feba8effeb4f82515c3a092e0d3df.
Source hash 992e17a5267f099c730892bf50e7ecb616515f9bcfe9a8d47bc7faf87b2e1d6e.
Existing Classic, Classic Low Poly and Modern source/runtime hashes remain unchanged.

Animation remains pending; the previous two-foot walk/tail assumption is superseded.
## Face UV leak repair — revision 8

User reported peach skin-coloured slivers on the lower side/back of both models,
with a close-up screenshot. This invalidates the preceding positive construction
assessment; rejection and findings are retained in review history. Diagnosis
identified expanded front-depth UV projection onto rear/underside polygons.

Restrict the face projection to front-hemisphere, forward-facing polygons.
All remaining polygons sample one safe graphite texel. Store scaled projection
metadata in the high source; the low recipe uses a new pinned revision 8 source
and explicitly reapplies the mapping after reduction to protect the seam.
The original pinned revision 7 input remains historical.

Reviewed actual runtime underside, side, front, close oblique, phone and game
views after export, followed by a second check of the affected underside/side
boundary. The low-poly user preview was also checked in the exact reported
close-up camera, preserved through Refresh. The sliver disappeared.
Source UV audit: 12249 back-facing/rear polygons,
zero projection failures. Source shell/grounding audit and runtime checks passed.
Final: 68180 triangles, 20 meshes, 2 materials,
2 embedded textures, 0 bones. Animation remains pending.
Runtime hash 02e3657bfe1d0fe392676010d7acb37c378075a4c771976f1a97188ea3646f12.
Source hash c0c000b5b12d0380bdaeb54904fb92b2428912519e10ab09263e70c110eec8cb.
User acceptance of this corrected revision remains pending.

## Animation research — 2026-09-30

User requested deep research into Mona/Octocat's animation, attributes and mindset.
The proposed direction and primary-source evidence are recorded in
[Mona / Octocat animation research](../../../../docs/design/Mona_Octocat_Animation_Research.md).
Public creator walk studies were sampled and their frame timing measured; evidence is preserved
under `docs/research/mona-octocat-animation-2026-09-30/`.

Recommended starting direction: grounded five-tentacle locomotion, elastic
weight support and curls, purposeful nonverbal acting, curious maker/jester
personality and optimistic recovery. Two raised tentacles in upright rest are
a pose choice, not permanent anatomy assignments. Clip timings and rig layout
in the brief are project proposals, not official GitHub specifications.

Research does not record model acceptance or authorize a new animation export.
Source, runtime and current review status remain unchanged; animation is pending.

## Research-led animation applied — 2026-09-30

User authorization: “apply these to both 2.0 octocats”. This supersedes the
research-only animation-pending status above. Preserved static model revision
8 in revisions/r8_before_mona_animation/ before rigging. Its source hash
was c0c000b5b12d0380bdaeb54904fb92b2428912519e10ab09263e70c110eec8cb; runtime
02e3657bfe1d0fe392676010d7acb37c378075a4c771976f1a97188ea3646f12. Model acceptance remains
pending and is separate from this explicit animation authorization.

Delivered animation revision 13: 29 deform bones, five independent elastic
tentacle chains, stationary root, and six clips at 24 fps: idle (2.25 s), work
(1.75 s), move (28/24 s), place and resolve (26/24 s each), hit (10/24 s).
The maker’s attentive inspection/reach/tap, brief surprise and optimistic
recovery apply the published personality direction. Upright rest still has
two raised and three supporting tentacles; grounded locomotion uses all five.
Walk is authored for 0.28 m/s, 78% stance and five phased contacts. Recovery
velocity/acceleration match stance; runtime stance gap is below 2.73 mm.

Independent facial targets and seven presets retain separate display control;
armature properties drive the editable source and sampled GLB weight tracks.
Cup weights/correctives follow underlying skin triangles. Explicit Basis
initialization prevents inherited morph deformation. Rest source geometry,
UVs, palette, smoothing and fitting origins are preserved. Runtime rest
positions/UVs and embedded images/materials match; normal rounding is <0.0001.
The repaired peach-face boundary stays confined to the front hemisphere.

Tower Place assembles digital cells into ready Idle; Resolve reverses it and
ends invisible. 32 temporary cubes fit the existing geometry budget:
68,564 maximum model-plus-cube triangles. No gameplay
position, timing or outcomes are implemented by this art export. A standalone
GLB viewer needs the shared lifecycle renderer for the full effect.

Reviewed actual Inspector phase/extreme/recovery/end frames and normal playback,
loop joins, exposed bends, phone/game scale, shadows, seek/replay/Rest reset,
effect-off fallback, exhausted cube budget, disposal and hash-preserving reload.
Second author review and guarded technical/review checks are hash-bound to:
source d4137359a0e93df115bc5634f99d5a02fc320ff00c9636135f98e3032591a182,
runtime b4a9dabfeaeae1e3770f5f104991b0a24e75ea56da149108a7b76e140e75d63a.
User visual acceptance of this revision remains pending.

See animation.md for the animation interface
and runtime integration notes; research is in docs/design/Mona_Octocat_Animation_Research.md.
