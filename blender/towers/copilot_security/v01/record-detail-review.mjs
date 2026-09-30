import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const d='blender/towers/copilot_security/v01';
const read=async p=>JSON.parse(await fs.readFile(d+'/'+p));
const m=await read('asset.json'),r=await read('validation/visual_review.json');
const tech=await read('validation/report.json'),audit=await read('validation/source_geometry_audit.json'),inspector=await read('validation/inspector_check.json');
if(m.revision!==15||r.revision!==15||!tech.passed||!audit.passed||audit.sourceHash!==m.delivery.sourceHash||inspector.sha256!==m.delivery.sha256)throw Error('Review requires the inspected revision 15 and matching checks.');
r.scope='refinement';r.reviewedAt=new Date().toISOString();
r.checks.referenceFidelity={status:'passed',findings:'Applied the latest explicit user direction: set the jaw exactly 12% shorter than its original projection, for a current factor of .88 about the fixed rear attachment. Both pods retain their 12 degree rise toward the back and white borders derived from the blue shoulder housing profile. The white band follows the housing corners and slopes with constant-width inset edges; nested cobalt and navy profiles follow the same outline. Latest user changes supersede the longer illustrated jaw and regular inset octagons.'};
r.checks.construction={status:'passed',findings:'Read-only source ray queries identified the swept jaw penetrating its chin armor near the shield peak. Increased actual armor wall depth while retaining an embedded rear, seated the emblem rear 2 mm inside the plate, and refitted the white jaw strip to the swept surface. After shortening the jaw, refitted the rigid shield/armor without scaling their frontal outlines. Inspected final exported front and oblique shield close-ups: blue patch and adjoining white-band intersections are gone. Inspected both pod close-ups: housing and white perimeter share the same contour; slope is consistent on both sides. Rear and underside confirm attached housings and chin. Geometry audit reports zero degenerate triangles and zero loose vertices.'};
r.checks.readability={status:'passed',findings:'Inspected final front, side, isometric, 390-pixel phone and small-model views. The shortened chin remains separate from the face, with the white shield readable at phone size. White pod borders remain continuous at small scale and the scanner is unobstructed.'};
r.checks.motion={status:'not_applicable',findings:'Model-only geometry refinement. Animation is still pending, with no clips added.'};
r.secondPass={status:'passed',findings:'After the initial shield/pod edits, oblique inspection exposed the adjacent white lip intersecting the jaw; repaired its surface fit. Revision 13 implemented the 33% jaw reduction and contour-following borders. The user restored half the reduction in revision 14, then specified exactly 12% shorter than original. Exported revision 15 at .88 projection and reassessed its side profile, frontal chin, oblique shield/lip and phone view: projection is intermediate, shield remains seated and white lip has no shell breakthrough. Final geometry audit and Inspector captures match this source/export pair. User artistic acceptance is not inferred.'};
r.evidence=[];
for(const name of ['inspector_iso','inspector_front','inspector_right','inspector_pod_right','inspector_pod_left','inspector_shield','inspector_shield_oblique','inspector_bottom','inspector_rear','inspector_phone','inspector_small']){
 const path=d+'/validation/'+name+'.png';r.evidence.push({path,sha256:createHash('sha256').update(await fs.readFile(path)).digest('hex'),view:name});
}
r.userAcceptance={status:'pending',note:'User specified the jaw should be exactly 12% shorter than its original projection. Revision 15 implements that adjustment and awaits their assessment.'};
r.limitations=['The user-directed shorter jaw and housing-following pod borders intentionally update the original illustrated shapes.','Animation remains pending.'];
await fs.writeFile(d+'/validation/visual_review.json',JSON.stringify(r,null,2)+'\n');
const referenceNotes={
 'feedback-shield-artifact.png':'User screenshot identifying the blue patch at the shield apex, 2026-09-24. Design evidence for fixing intersecting jaw/chin armor.',
 'feedback-pod-slope.png':'User screenshot requesting pods slope upward more toward the rear, 2026-09-24.',
 'feedback-jaw-projection.png':'User screenshot requesting jaw retraction by 33%, 2026-09-24. This explicit direction supersedes the longer jaw in the original contour sheet.',
 'feedback-pod-border.png':'User screenshot requesting white pod border alignment with the blue shoulder join contour, 2026-09-24. This explicit direction supersedes the separate regular octagonal border.'
};
for(const [name,provenance] of Object.entries(referenceNotes)){
 const path=d+'/references/'+name;if(!m.references.some(ref=>ref.path===path))m.references.push({path,provenance});
}
await fs.writeFile(d+'/asset.json',JSON.stringify(m,null,2)+'\n');
let decisions=await fs.readFile(d+'/decisions.md','utf8');
decisions=decisions.replace(/## (?:Latest user refinements|Validation and author review)[\s\S]*?## Animation/,`## Latest user refinements — 2026-09-24

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

Revision ${m.revision}: ${tech.triangles} triangles, two materials, one packed 32x4
palette image used by two runtime texture instances. Dimensions W/H/D:
${tech.dimensions.map(v=>v.toFixed(3)).join(' / ')} metres. Technical delivery passes.
Source audit: zero degenerate triangles, zero loose vertices, 39 named parts.
Runtime hash: ${m.delivery.sha256}
Source hash: ${m.delivery.sourceHash}

Reviewed exported shield front/oblique, both pod close-ups, both side directions,
front, isometric, rear, underside, phone and small-model views. Shield and trim
intersections are resolved; both borders follow the housings. Existing Inspector
tabs were refreshed to this revision without changing their camera context.
See validation/visual_review.json. User artistic acceptance remains pending.

## Animation`);
await fs.writeFile(d+'/decisions.md',decisions);
console.log('Revision 15 detail refinement review and explicit user decisions recorded.');
