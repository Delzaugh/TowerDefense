# Security: model-only production brief

2026-09-24 user request: "build our security model", with six reference sheets.
Create the complete head-only Security persona. Existing Shield is a separate
asset and remains preserved. Captions in the sheets are design data, not extra
user instructions. All six supplied images are copied unchanged to references.

Six-views governs volume, shape-study governs silhouette, accessory sheets govern
fitted details. Front figure crop roughly (42,65)-(469,445), aspect 1.12; target
model width 2.584 / height 2.355 = 1.097. Uniform scale; no reference stretching.
Character-left is +X (viewer's right at front), so only that side has a scanner.
Helmet side extrema +/-1.0; pod outer extrema +/-1.292; rear depth .94; brow
depth -1.047; crest top 2.355. Pod centers Y=.06 Z=1.065; goggles Z=1.60.
Open face is between chin lip Z=.61 and goggles Z=1.35, with eyes at Z=1.001.
Scanner axis runs forward from its center X=.94,Y=-.13,Z=1.99. Badge is centered
on the chin; three rear vents share center, width and spacing.

References differ slightly in scanner projection and crest curvature; use one
coherent assembly with a curved crest, a forward scanner above the left pod,
and symmetric pods. Explicit helmet sections establish the round rear and face
volume; accessories are rigid local meshes fitted after resolving the envelope.
Display and helmet share their boundary. Pod trim and optics use closed rings.
White brow and chin lip are single connected outlines. Rear vents are actual
recesses. Eight semantic colors share one packed 32x4 opaque palette with two
materials. Named vertex groups preserve parts for future animation.

Animation pending: user has requested the model, not an animation pass. No
placeholder clips. Ask about baseline animation at the reviewed model handoff,
as required by the game-asset-workflow skill. User acceptance remains pending.


## Primary-form and completed review

The first blockout is retained in renders/blockout. Front, side and isometric
comparison established the body envelope and pod fit before final optics/badge.
Its non-planar concave chin panel triangulated across the white lip; corrected
with planar half panels and added a central chin plate. Lowered the forward
helmet shoulder to expose the broad crest. The next close inspection found
partly buried crest supports and an upper brow gap; raised the supports and
added a fitted blue brow housing. Final close, reverse, underside, phone and
small views were personally inspected. See validation/visual_review.json.

Revision 4: runtime d43330b69d1d32ccd2802509cfd169fdfb85fccb42e1ac5e9ecf9f941d26bf7d
Source c51117cf781b5d038f9908a83a32cbd0983333eac24b08ff774e4e543046cf0d
Export: 2648 triangles, two materials, one packed 32x4 image (two runtime texture
instances for shell/optics). Dimensions 2.584 x 2.355 x 2.056 m.
Technical validation and author review passed; explicit user acceptance pending.
Animations pending; ask at handoff before starting the baseline animation pass.

Validation history: initial blockout check lacked a configured Playwright module;
resolved using game/node_modules/playwright. First production contract lacked
palette.colors; corrected with explicit role colors. Candidate then exceeded
the one-texture-instance budget because shell and optics create two instances
of the same packed image; declared the actual two-instance contract. Both failed
candidates stayed outside runtime. Final guarded delivery passed.
