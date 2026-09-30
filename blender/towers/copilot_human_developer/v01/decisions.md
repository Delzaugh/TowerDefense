# Human Developer — design and source decisions

## User direction — 2026-09-24
Create a normal human developer in casual wear. The user selected open hoodie,
T-shirt, jeans and sneakers. This is a separate human asset; the existing
head-shaped Copilot Developer is a different character.

## Original design brief
Friendly chunky low-poly human, approximately 3 m tall at Tower character scale.
Muted teal open hoodie, cream T-shirt and sneakers, indigo jeans, warm tan skin,
short swept brown hair. Relaxed planted stance; closed laptop held under the left
arm is the focal developer accessory. No photograph or likeness requested.
Palette and personal appearance are proposed art choices awaiting user review.
Local Visual Asset Guide governs form/materials; no external reference images.

Primary landmarks in Blender metres: sole 0–.09, ankle .24, knee .67, crotch 1.045,
hoodie hem 1.17, shoulders 1.88, neck 2.12, chin 2.135, eyes 2.52, hair apex 2.98.
Head is .71 wide, shoulders .95 wide. Front negative spaces are the leg gap,
open hoodie and a narrow gap beside the hanging arm; side volume includes full
cranium, dropped hood, bent carrying elbow and laptop thickness.

## Construction
Section-built face, trousers and T-shirt. Hoodie is a thick continuous open shell
with inner surfaces and bound edges; the dropped hood is a concave fabric bowl.
Swept hair uses an irregular hairline and crown; laptop is a separately fitted
solid. Shoes have grounded soles. Simple mitten hands are intentional at game
scale. One opaque rough material with a packed and embedded 32 × 8 palette;
semantic color roles remain editable in the inspector. Named vertex groups retain
part selection. Recipe owns geometry; guarded pipeline owns runtime delivery.

## Review milestones
Primary blockout review pending. Finished export and second author review pending.
Technical validation is separate from user artistic acceptance.

## Animation handoff
Model-only delivery. Animation pending; no clips or rig invented in this pass.
After model review, ask whether to add idle, work, in-place walk (move), place,
hit and resolve. Place/resolve follow the shared digital cube default when that
pass is authorized. The laptop work pose can be designed in the animation pass.

### Primary-form inspection
Inspected actual exported front, side and isometric blockout renders (revision 2).
Head/body ratio, leg separation, shoe contact and laptop profile match the brief.
Found T-shirt protruding through shoulder fabric and sleeve caps too angular at
the shoulder. Narrowed the underlying shirt and seated sleeve roots farther into
the torso before adding facial and clothing details. Original blockout is retained
by the guarded revision milestone. Initial palette row-origin mismatch failed
technical validation; corrected atlas/UV origin before the first promoted GLB.

### Final model review — revision 4
Delivered 2,526 triangles, one opaque material, one packed/embedded 32 x 8 texture,
three anchors, 1.62 x 2.976 x .83 m. Technical validation and hash-bound author
review pass. Inspected final front, side, isometric, flat silhouette, close front,
laptop-side, laptop oblique, rear/underside oblique, phone and small-scale views.
After shoulder repair, moved the smile to the cheek surface so it remains visible.
Second assessment confirms connected accessories, shoulder coverage, grounded
shoes and readable casual outfit. Laptop sticker is a secondary close-view detail
partly hidden by the supporting forearm. Source/export identities are recorded
in validation/visual_review.json. No user acceptance inferred.

Animation remains pending; user has not yet authorized the animation pass.

## Registered tower naming — 2026-09-26

User requested the `copilot_` prefix for all tower assets. Renamed
`human_developer` to `copilot_human_developer`, with matching catalog, manifest,
Blender source and runtime paths. Source and GLB bytes are unchanged; geometry,
materials, rig, animation and artistic acceptance retain their previous state.
Historical snapshots keep their original recorded identities; their containing
folder and asset filenames have moved with this asset. Existing internal Blender
component/material names and provenance tags remain stable.
