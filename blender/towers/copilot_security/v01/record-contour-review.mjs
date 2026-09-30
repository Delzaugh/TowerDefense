import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const d='blender/towers/copilot_security/v01';
const m=JSON.parse(await fs.readFile(d+'/asset.json'));
if(m.revision!==10)throw Error('Historical contour review applies only to revision 10; do not replace a later review.');
const r=JSON.parse(await fs.readFile(d+'/validation/visual_review.json'));
const tech=JSON.parse(await fs.readFile(d+'/validation/report.json'));
const audit=JSON.parse(await fs.readFile(d+'/validation/source_geometry_audit.json'));
if(!tech.passed||!audit.passed||audit.sourceHash!==m.delivery.sourceHash)throw Error('Current technical or source geometry check is incomplete');
r.scope='refinement';r.reviewedAt=new Date().toISOString();
r.checks.referenceFidelity={status:'passed',findings:'User rejected r4 contour; its earlier fidelity assessment is superseded. Traced the supplied left contour using a uniform .011 m/pixel mapping. Compared front/side/isometric blockout, then the exported side and equal-height contour comparison. The new helmet has the long sloping forehead, short crown plateau, raised rear bottom, forward jaw and angled lower jaw return shown by the reference. Pods were rebuilt with a swept fore/aft housing, scanner lowered/refitted and goggles wrapped around the brow so a lens remains visible from the side. Palette, head-only anatomy, shield, paired pods and single character-left scanner remain. Illustration and orthographic rendering are not asserted to be pixel-identical.'};
r.checks.construction={status:'passed',findings:'Inspected final shared-Inspector close oblique, both side directions, reverse and underside. Corrected asymmetric housing mirroring, joined the swept jaw into the raised body, and fitted the display eye graphics to the curved screen after the shape change. Brow halves follow the angled lens frames. Scanner glint received real thickness to remove duplicate cap faces. Audit found zero-area triangles in the thin beveled rear vent wells; rebuilt those hidden wells as simple solids and repeated audit: zero degenerate triangles and zero loose vertices. Final export has no Blender mesh warning. The cyan strip is an intentionally open surface inlay, not a watertight solid.'};
r.checks.readability={status:'passed',findings:'Inspected final phone-width image and the small-model test. Goggles, eyes, white jaw band, broad side pods and scanner remain distinct after the contour correction. Close-up facial display remains open. The smallest view reduces the shield to a white mark, consistent with its role as a secondary symbol.'};
r.checks.motion={status:'not_applicable',findings:'User requested contour correction. Model-only; animation remains pending, with no placeholder clips.'};
r.secondPass={status:'passed',findings:'Reassessed the revised contour against the user crop, not against the rejected old proportions. Primary volume now has the forward chin wedge and a rear lower edge above the jaw ground plane. Then repaired goggle wrap, jaw/body connection and eye seating exposed in side/underside views. Rechecked opposite-side symmetry, oblique attachment, reverse vent recesses and phone scale. Final vent-well cleanup preserved the contour and now passes the independent zero-area/loose-vertex audit. Hashes in the Inspector capture and current source/export match this revision.'};
r.evidence=[];
for(const name of ['side','side-silhouette','front','iso','contour-comparison','inspector_detail','inspector_left','inspector_bottom','inspector_rear','inspector_phone','inspector_small']){
 const path=d+'/validation/'+name+'.png';r.evidence.push({path,sha256:createHash('sha256').update(await fs.readFile(path)).digest('hex'),view:name});
}
r.userAcceptance={status:'pending',note:'Revision 4 explicitly rejected by the user for contour mismatch. This corrected revision awaits the user\'s assessment; no acceptance inferred.'};
r.limitations=['Low-poly bevels and true orthographic views interpret the illustrated contour rather than reproducing raster line thickness.','Animation remains pending; this is a model refinement.'];
await fs.writeFile(d+'/validation/visual_review.json',JSON.stringify(r,null,2)+'\n');
await fs.writeFile(d+'/decisions.md',`# Security decisions and contour correction

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

## Validation and author review

Revision ${m.revision}: ${tech.triangles} triangles, two materials, one packed 32x4
palette image used by two runtime texture instances. Dimensions W/H/D:
${tech.dimensions.map(v=>v.toFixed(3)).join(' / ')} metres. Technical delivery passes.
Source audit: zero degenerate triangles, zero loose vertices, 39 named parts.
Runtime hash: ${m.delivery.sha256}
Source hash: ${m.delivery.sourceHash}

The repair pass caught and corrected pod mirroring, a lower jaw/body gap,
floating eyes, duplicated scanner-glint caps and zero-area triangles caused by
beveling very thin hidden vent wells. Final source/export passed after those
repairs. Close oblique, front, both side directions, rear, underside, phone and
small views were inspected. See validation/visual_review.json. Artistic
acceptance remains pending; the prior r4 rejection is not overwritten.

## Animation

Model refinement only. No animation authorization added by the contour request.
Baseline animations remain pending; no placeholder clips or gameplay integration.
`);
console.log('Current contour refinement review recorded.');
