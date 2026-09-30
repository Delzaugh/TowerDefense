# Security decisions and contour correction

## User direction and authoritative source

2026-09-24: "build our security model" with six visual sheets. The user then
rejected revision 4: "contour shapes dont match", supplying a side contour and
the rejected Inspector view. That feedback supersedes the initial positive
reference-fidelity assessment. The earlier model/recipe is retained under
revisions/r4_rejected_contour_r4; the rejected review is in review_history.

Current recipe: build.py delegates to refine_jaw.py, which loads the immutable
animated revision 16 in revisions/r16_before_jaw_rim_refinement and applies the
2026-09-26 jaw correction. animate.py retains the earlier animation recipe and
model_geometry.py the earlier model construction reference. Canonical editable
source: copilot_security_v01.blend.
Keep the head-only anatomy, cobalt/white/navy palette, goggles, shield, paired
pods, three rear vents and one character-left scanner. No gameplay changes.
References and their captions are design inputs, not additional instructions.

## Reference priority and measured construction

The latest feedback-left-contour.png governs the corrected side outline. The
original six-views and accessory sheets govern front width, colors and fittings.
Uniform reference mapping: Blender Y=(pixel_u-103)*.011, Z=(670-pixel_v)*.011.
The trace has crown top around v456, long forehead slope toward (u26,v511),
back shoulder around (u197,v536), rear bottom near v650, and a projecting chin
ending around v670. Source is Blender -Y forward, +Z up; +X is character-left.

Replaced the old front-to-back rounded-box shell with nine horizontal sections
carrying explicit front/rear pixel landmarks and widths from the front sheet.
Built a separate swept jaw from a YZ profile; tapered its bottom width to keep
the front silhouette round. Its rear tip overlaps the body below the pod.
Rebuilt the asymmetrical fore/aft pod housings with mirrored local profiles so
both sides share the same longitudinal shape. Kept the rigid trim/center rings.
Lowered and refitted the scanner, adding small pitch/yaw to match the reference.
Wrapped each rigid goggle by .43 radians and constructed a matching white brow.
The emissive eye graphics follow the display surface; rigid optics do not warp.

Primary blockout and its source are retained in renders/contour-blockout. Viewed
side/front/isometric before final accessories. The comparison board shows the
user contour, rejected r4 screenshot and current exported side at equal height,
uniform per-image scale and aligned ground; it does not stretch image widths.
Crop/alignment data is in validation/contour-comparison.json.

## Latest user refinements — 2026-09-24

The user identified a blue artifact above the shield and requested a stronger
upward slope toward the back of each pod. Source ray queries confirmed that the
blue jaw penetrated its armor plate by about 7.5 mm near the shield apex. The
plate now has 20 mm more real wall depth, with its rear still embedded. The
shield rear embeds 2 mm into that plate. The adjacent white lip is fitted to the
jaw surface; its old fixed plane also allowed shell breakthrough near the ends.

Both complete pod assemblies rotate 12 degrees about the helmet X axis, so
both rise toward +Y (the back). Preserve this direction when mirroring them.

The user then requested: "the jaw is very extruded, pull it back 33%" and
"the white border should allign with the blue shoulder join contour".
Revision 13 used Y_new=.03+.67*(Y_old-.03). The user then said the jaw was pulled
back too far and requested half the cut restored in revision 14 (.835 factor).
The latest explicit decision is exactly 12% shorter than the original projection.
The CURRENT revision uses Y_new=.03+.88*(Y_old-.03).
The rear attachment is fixed. Width and height are unchanged. White lip fits the
jaw; the rigid armor and shield retain their frontal outlines and are relocated
and pitched to the new slope. This jaw length supersedes the original side trace.

White pod borders now share the actual 14-corner blue housing shoulder profile.
Their bevels use constant-width inward offsets, eliminating the independently
sized regular octagon. Cobalt and navy nested profiles follow the same housing.
This contour alignment supersedes the old inset-octagon interpretation.

The four latest feedback screenshots are retained under references/feedback-*.
Revision 10's earlier construction pass missed the plate intersection; its
superseded review is preserved in review_history. Source/export snapshots before
each guarded delivery remain under revisions/.

## Approved model validation and author review

Revision 15: 2854 triangles, two materials, one packed 32x4
palette image used by two runtime texture instances. Dimensions W/H/D:
2.614 / 2.339 / 2.226 metres. Technical delivery passes.
Source audit: zero degenerate triangles, zero loose vertices, 39 named parts.
Runtime hash: aabd2b42dc8233ea2cda102246f341a82626af2f4a6c94806114f5f523430b7e
Source hash: f023fd4b2d1f008018e0d378e6b59c0a95510c7271b1d387fa9b26db3f09768e

Reviewed exported shield front/oblique, both pod close-ups, both side directions,
front, isometric, rear, underside, phone and small-model views. Shield and trim
intersections are resolved; both borders follow the housings. Existing Inspector
tabs were refreshed to this revision without changing their camera context.
This review is preserved in revisions/r15_approved_model_before_animation.
The user subsequently accepted this model and authorized animation below.

## Animation authorization and delivery

2026-09-24: user said "looks good, make the animations" after selecting the jaw
at 88% of its original projection. Model revision 15 is approved. Its source,
export, recipe, decisions, review and side view are preserved under
revisions/r15_approved_model_before_animation. The manifest records both hashes.

The animation recipe loads that immutable accepted Blender model. No rest art,
palette, normals or anchor positions may change. Rig: rigid body, two independent
display eyes and one rigid scanner. Head-only anatomy supports an in-place hover
glide; ready clearance is .16 m, with all world travel owned by simulation.

Delivered revision 16: idle 2.5 s, work/security sweep 2 s, move/hover 2 s, place 1.25 s,
hit 14/24 s, resolve 1.25 s. Place/Resolve use the established shared digital
cube effect in reverse directions. The body remains full-size. The 2854-triangle
model leaves room for 12 cubes (144 triangles), combined ceiling 2998.
Four bones keep the body and scanner rigid while independently animating the
two cyan display graphics. The scanner action anchor follows its bone; the
target anchor follows the body, and the UI anchor stays on the stationary root.
Rest Pose is unanimated and retains the approved model's original dimensions.

The source art signature is unchanged from the approved model. Comparing the
actual exported GLBs gives maximum rest vertex difference 7.1e-8 m, normal
difference 1.2e-7 and zero UV difference. No rest mesh or palette was remodeled.

Technical validation and author animation review pass. The asset-specific
runtime audit in validation/animation/review.json checks repeated loops, ready
transitions, one-shot holds, seeking, replay, reset, full disappearance and a
fragment-pool fallback. Sampling all six exported clips gives minimum hover
clearance .0914 m, above the .06 m requirement. The action anchor stays attached.
Source geometry has no degenerate triangles or loose vertices.

Inspected all six pose contact sheets, scanner and blink close-ups, plus all
phone-scale captures with ground and shadows. Motion and role details remain
readable; scanner seating is retained. Place finishes in the Idle ready pose;
Resolve leaves no model or residual shadow. Review-harness rounding and frame
synchronization were corrected before the final passing run; no animation art
repair was needed after the initial delivered pass.

Runtime hash: 3c16b59dc80a72487fabd93fd92427414c6b85564319946fbdc1e853d3181719
Source hash: 3bbc73490bf7a13f61f73086ccd807d2143b09a8c2f643b8c43c3f660dbf7bde
See validation/visual_review.json for the hash-bound author review and evidence.
User acceptance of the new animations remains pending; model approval persists.

The cube assembly/disintegration visuals require the shared presentation
lifecycle renderer, already enabled in the Inspector. Standalone GLB players
show the skeletal clips only. Game integration should use createLifecycleEffect
from tools/asset-presentation/lifecycle.js; simulation continues to own travel,
timing and outcomes. No gameplay implementation is part of this art delivery.

## Upper jaw refinement — 2026-09-26

User: "Let's rework the top edge of the jaw, it feels like a bad moustache."
The attached close-up is retained as references/feedback-jaw-rim.png. This request
supersedes the previous wavy white jaw strip while retaining the agreed .88 jaw
projection and the existing rig and animations.

Revision 17 removes the separate protruding white applique and raises the
centre of the blue jaw to form a broad level rim between the +/- .54 m stations.
The last .19 m on each side gently rises into the existing cheek attachment.
The adjustment blends out above the chin armor, retaining the shield seat,
lower chin and ground contact. Eight upper-jaw vertices move vertically;
28 applique vertices are removed. No depth or width coordinates change.
Unrelated positions, UVs and all retained vertex weights are checked against
the immutable animated source. Exported animation and rig parity is recorded
in validation/jaw_refinement_check.json.

The delivered model has 2802 triangles, two materials and four bones. Its
existing digital effect adds at most 144 triangles (2946 combined). All six
baseline clips remain present. Guarded technical delivery and source geometry
audit pass. Front, side, oblique, underside, phone-width and paused work views
were inspected for rim continuity, clean shield clearance and readability.
See validation/visual_review.json for the current hash-bound author review.
User artistic acceptance of the revised jaw remains pending.

## Shared supporting palette — revision 18 (2026-09-26)

User chose to preserve character identities and unify supporting neutrals and small accents. Applied screen #041D2A, cyan #00E5EF to both declared base-colour material bindings in the authoritative packed Blender image. Preserved shell/trim/lens identity colours and, for Security, navy casing. Retained original packed emission image bytes and sampling through separate base-image bindings. Before-source/runtime milestone: before_shared_palette. Geometry, normals, UVs, rig, anchors, morphs, clips and material/emission response pass exact exported parity.

Personally inspected final close iso/rear, phone rest/work and the common-scale roster comparison; no colour bleed or loss of face/casing separation was seen. Second author review and hash-bound validation are in validation/visual_review.json and validation/shared_palette_parity.json. Source/export identifiers: 061af0a754bacc3da2b04cede7f50b6580fd63aca905bcfd6e1b81c6d73e9d5c / 717eba681251162ec79f837bea3c934be45f871e70d3f80528ed31c7ce9c154b. User artistic acceptance of this revision remains pending. Shared role values and deliberate exceptions are in docs/design/Shared_Palette.json.
