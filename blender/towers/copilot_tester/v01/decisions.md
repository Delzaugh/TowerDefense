# Tester — Boundary Watcher source decisions

## User direction — 2026-09-30

- Create a new Tester tower concept, evolving Base Copilot and remaining a tower character.
- User selected option04 Boundary Watcher, then requested model specifications.
- User requested the production model and opening the Inspector in the sidebar for review.
- Model-only delivery; user model acceptance and animation authorization remain pending.

## Reference priorities and landmarks

The selected original front in references/tester_concept_sheet.png is authoritative. Image-generated six-angle, anatomy, shape and accessory sheets are supplementary concept references; their hidden contacts and rear forms are not measured facts.
Uniform scale chosen from the original04 silhouette: full width2.80m, height1.795m (width/height1.56). No independent horizontal/vertical image stretching. Front shell max half-width0.98m, lower contact at0m, upper dome1.59m, crown1.80m before grounding. Guard extrema +-1.40m; vertical stems near+-1.31m. Goggles centered+-0.425m, height1.145m; separate eyes centered+-0.23m, height0.565m. These are the authored coordinates, not measurements claimed for the concept art.

## Primary-form comparison

Revision2 is the retained primary-form blockout. Personally inspected front, side and isometric Three.js renders against selected04. Broad head/guard aspect, crown, connected hexagonal goggles and open brackets agree. The first contacts created visible end-cap pads; corrected rather than retaining them as extra equipment. The body is a landmark-defined sixteen-point front profile with multiple depth sections, not an inherited generic head. The side depth reconciles the proposed rounded rear with the front outline.

## Construction and materials

- Shell, front lip and recessed face share boundaries. Curved depth and deliberate facets avoid a planar slab.
- Each guard is one continuous mitered outline with real thickness and controlled corner bevel. Its center seats behind the separate inner ear housing; top/bottom clearance stays open. Concealed physical contacts are authoring choices, not extra user decisions.
- Twin six-sided goggle rims have continuous bevel loops, inset opaque teal lenses and solid bridge. Goggles remain above the paired lower display eyes.
- Rear lower graphite region uses a horizontal shared-surface split, avoiding stepped or triangular color wedges.
- Small packed32x4 palette image; two opaque palette/optics materials and explicit semantic texture swatches. UVs target swatch interiors. Supporting graphite/display/cyan use shared family values; mint and warm ivory preserve selected concept identity. No baked aura ring.
- No visible torso, limbs, stand, antennas, check badge, straps or concealed electronics.

## Repairs and review

Revision3 restored capsule eyes and side strips and removed the initial cap pads. Its interim visible connecting bars and rear fan color wedge were rejected during author review. Revision4 removes visible bars, seats guards behind ears and splits the rear color seam geometrically at a consistent height.
Inspected finished r4 front, side, rear, top, isometric, close isometric, close rear, underside, phone and small-scale Inspector views. Inspector loaded hash matched canonical GLB. Technical report passes with1100 triangles,2 materials,2 meshes,2 runtime texture bindings,0 bones, no browser warnings/errors. Packed image and root/UI/action/target/aura anchors validated. Open upper/lower bracket gaps, distinct goggles and paired eyes remain readable at phone/small scale.
Generated reference sheets are approximate; artistic acceptance of this model remains with the user. Hash-bound findings and evidence are in validation/visual_review.json.

## Animation handoff

Model revision4 is delivered for user review. Baseline animations are pending, not authorized by this model request. Planned locomotion is hover/glide preserving limb-free anatomy. After user consent, plan idle/work/move loops and place/hit/resolve one-shots, with digital cube assembly and reverse disintegration from the shared tower default. No empty clips were added to the export.

## User contour correction and r6 refinement — 2026-09-30

User explicitly identified the r4 front as too flat and requested higher model quality using the remaining triangle budget. This supersedes the r4 author assessment above; r4 was not accepted by the user.

Rebuilt the front as a broad convex cap in both horizontal and vertical axes, with forehead, cheek/display and chin curvature. Added surface rings and contour subdivisions, then fitted goggles to the brow and capsule eyes to the display. Refined hexagonal rim corners, convex lens surfaces, bridge bevels and two-step guard bevels. Repaired front and lens shading after the first geometry pass. Colours and character anatomy remain unchanged.

Measured total GLB depth increased from 1.782000 to 2.086972 m; width 2.800000 and height 1.794875 m stay unchanged. Total depth includes goggles. Final r6 uses 2,292 of 2,500 triangles, two materials and two texture bindings. Source hash d0d42b4908135c1e67ca34c7eea8648464dfe3bd8043767c56e234dcf70ad9a7; runtime hash d17c05d5720f7ef9f514a186770445e842bb32a4ef4101df3a1922b17d5a6070.

Personally reviewed final exported fixed views, close oblique/rear/underside, phone and small silhouette. The comparison board and audit are in validation/contour-comparison.png and contour-audit.md. Reference images retain aspect ratio; they are illustrative, not exact measurement targets. Final technical checks pass without errors or warnings. User acceptance remains pending. Animation remains deferred awaiting authorization; this refinement adds no clips.

## Ear housing refinement — revision 8

User requested improved ear housing quality with the Boundary Watcher accessory sheet. Replaced stacked casing/plate surfaces with a continuous shared-boundary ivory rim and recessed graphite face. Added a rear taper, broader front bevel, eight-point clipped corner contour and beveled rounded cyan capsule. Repeated modules use mirrored local geometry fitted to the existing head and guards. No palette or anatomy changes.

Final runtime 5e201200886f49dcc2dde3d554d10ec968c304dea73636462d2bb0bc73f520de, source 2be8aeef086845e9eaf532a9b4e804a5ec39c78114dc28e710806d095c5f5907. Technical validation passes at 2,468 / 2,500 triangles with unchanged overall dimensions and two materials. Reviewed front/side, close oblique/reverse/underside and phone/small captures, then a second pass after the corner refinement. User acceptance pending; animation deferred.

## Animation authorization — 2026-09-30

User approved model revision 8 (5e201200886f49dcc2dde3d554d10ec968c304dea73636462d2bb0bc73f520de): "looks good! make the animations". Approved model and review preserved before animation. Limb-free hover/glide uses grounded Rest Pose and 0.14 m ready clearance. Three-bone rigid body/paired-eye rig. Six baseline clips; Work scans side to side. Shared Place/Resolve cube effect uses two fragments (24 triangles) so maximum combined geometry is 2,492 / 2,500. No mesh-quality reduction or gameplay implementation.

## Animation delivery — revision 9

Six baseline actions authored at 24fps, three rigid bones, stationary root. Idle 2.5s, Work 40/24s, Move 32/24s, Place/Resolve 1.25s, Hit 14/24s. Grounded rest is preserved; playback ready is 0.14m above ground, with measured minimum above 0.114m. Body and eye expression controls remain separate bones; action/target anchors follow the body, UI/aura retain rest root placement.

Approved model preserved in revisions/r8_approved_model_before_animation. Model generation recipe retained as model-build.py; active build.py loads that accepted source and authors the rig/actions without reconstructing geometry. NLA actions are muted and cleared in saved rest source. Exact rest geometry/UV/material/image checks and near-exact normal checks pass. All motion channels vary, loops close, transition clearance and exact reset pass. Runtime digital effect tests include reversed coverage, seeking/replay, invisible exit, assembled ready, phone shadows, budget fallback and disposal.

Personally inspected clip progress boards, normal-speed playback frames and phone evidence, then a second finished-export assessment. No scoped visual repair remains. Source 557452cc10faac74859db7b27ca9a3194d4058acb4ba9452e59e1e85befc30fe; GLB d0d0a68c4ee364a6c6855622e1536bd98fde9da04a432c3ba95b5462ab1fde65. Model acceptance remains r8; animation acceptance pending. Complete lifecycle visuals require the shared presentation module beyond the GLB.
