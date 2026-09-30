# Security decisions and contour correction

## User direction and authoritative source

2026-09-24: "build our security model" with six visual sheets. The user then
rejected revision 4: "contour shapes dont match", supplying a side contour and
the rejected Inspector view. That feedback supersedes the initial positive
reference-fidelity assessment. The earlier model/recipe is retained under
revisions/r4_rejected_contour_r4; the rejected review is in review_history.

Current recipe: build.py. Canonical editable source: copilot_security_v01.blend.
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

## Validation and author review

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
See validation/visual_review.json. User artistic acceptance remains pending.

## Animation

Model refinement only. No animation authorization added by the contour request.
Baseline animations remain pending; no placeholder clips or gameplay integration.
