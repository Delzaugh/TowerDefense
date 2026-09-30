import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const folder = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(folder, 'visual_review.json');
const review = JSON.parse(await readFile(file, 'utf8'));
if (review.sha256 !== '395c2cf789b243c4c856a4c07edae32efbb6fca10d19e1e099a901767857d8eb') {
  throw Error('This inspection belongs to revision 10; review the new export before recording findings.');
}
review.scope = 'refinement';
review.reviewedAt = new Date().toISOString();
review.checks.referenceFidelity = {
  status: 'passed',
  findings: 'Personally compared the supplied shape/anatomy/accessory/coverage sheets and isolated front-left study render with the exported front, side, rear, top and isometric renders. The mesh, UVs, component groups and smoothing are exactly the preserved sheet study (source_adoption.json). Six axes are 30/90/150/210/270/330 degrees within 0.00001 degrees. The low octagonal shell, dark crown, three channels, brow and forward-pair clearance match. The actual rendered forward pair is smaller/lower despite the conceptual identical-units caption; preserve the visible geometry rather than change its proportions. Pipeline orthographic front/profile views are level, while sheet views are elevated; no stretched comparison or unsupported pixel-overlap score is claimed.'
};
review.checks.construction = {
  status: 'passed',
  findings: 'Inspected the actual registered r10 GLB in shared Inspector 4175 at close isometric, underside and oblique underside views, in addition to saved fixed views. The lime shoulder does not cut across the continuous visor or cyan eye inlays; both status marks remain uncovered. Pods have consistent side-wall depth and dark port seating; lower forward pods retain the intended clearance. Reverse/underside checks show closed lower chassis and retained radial attachments. No new floating visor edge or flicker was observed. Inspector displayed revision 10 and hash prefix 395c2cf789b2.'
};
review.checks.readability = {
  status: 'passed',
  findings: 'Personally inspected the shared Inspector phone-width viewport and Small silhouette test, then restored the full isometric view. At roughly 64 px the lime puck, dark crown, forward brow and radial pod silhouette remain distinct; the cyan face accents remain visible. Tiny crown latches and grooves are detail for close views rather than required gameplay cues. No tint previews were applied.'
};
review.checks.motion = {
  status: 'not_applicable',
  findings: 'Static model refinement; no clips or rig existed and none were introduced. Baseline animation remains pending the model-first handoff and explicit user authorization, recorded in decisions.md.'
};
review.secondPass = {
  status: 'passed',
  findings: 'After replacing the superseded eight-pod source with the exact six-pod study and completing the five-view export check, reviewed the finished r10 again in the live Inspector, including close visor/pod construction, reverse/underside, phone width and small silhouette. Largest prior mismatch (eight pods rather than six) is resolved. No further geometry edit was needed: the geometry/UV signature is identical to the supplied study, face clearance is preserved, and light/shading differences from Blender beauty renders do not represent palette drift.'
};
review.evidence = review.evidence.filter(item => item.mode === 'shaded');
review.userAcceptance = {status: 'pending', note: 'Delivered for user model review; do not infer acceptance or animation authorization from self-checks.'};
review.limitations = [
  'No baseline animations authored; awaiting user authorization after model review.',
  'Six 60-degree sectors are visual/design metadata only; simulation targeting and firing were not changed.',
  'Preserves actual supplied rendered geometry: the forward pair is slightly smaller and lower than the other four pods despite the conceptual identical-units caption.',
  'Palette is identical to the study; appearance varies with Blender versus runtime studio lighting.'
];
await writeFile(file, JSON.stringify(review, null, 2) + '\n');
console.log('Recorded personal review of Linter v01 revision 10.');
