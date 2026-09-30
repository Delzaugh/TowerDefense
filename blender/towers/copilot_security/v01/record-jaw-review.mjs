import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {glbDocument} from '../../../../tools/asset-pipeline/palette-parity.mjs';
const folder = 'blender/towers/copilot_security/v01';
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const m = await read(folder + '/asset.json');
assert.equal(m.revision, 17, 'This review records the inspected revision 17 only.');
const a = glbDocument(await fs.readFile(folder + '/revisions/r16_before_jaw_rim_refinement/copilot_security_v01.glb'));
const b = glbDocument(await fs.readFile(m.runtime));
function accessor(asset, index) {
  const item = asset.g.accessors[index], view = asset.g.bufferViews[item.bufferView];
  assert(!item.sparse, 'Unexpected sparse animation accessor');
  const width = {SCALAR:1, VEC2:2, VEC3:3, VEC4:4, MAT4:16}[item.type] * {5121:1, 5123:2, 5125:4, 5126:4}[item.componentType];
  const data = Buffer.alloc(width * item.count);
  for (let i=0; i<item.count; i++) {
    const start = (view.byteOffset || 0) + (item.byteOffset || 0) + i * (view.byteStride || width);
    asset.bin.copy(data, i * width, start, start + width);
  }
  return data;
}
assert.equal(a.g.animations.length, b.g.animations.length);
for (const old of a.g.animations) {
  const current = b.g.animations.find(animation => animation.name === old.name);
  assert(current);
  assert.deepEqual(old.channels, current.channels);
  assert.equal(old.samplers.length, current.samplers.length);
  old.samplers.forEach((sampler, i) => {
    assert.equal(sampler.interpolation, current.samplers[i].interpolation);
    for (const key of ['input', 'output'])
      assert.deepEqual(accessor(a, sampler[key]), accessor(b, current.samplers[i][key]), old.name + ' ' + key);
  });
}
const nodeInterface = nodes => nodes.map(({name, children, translation, rotation, scale, matrix, skin}) => ({name, children, translation, rotation, scale, matrix, skin}));
assert.deepEqual(nodeInterface(a.g.nodes), nodeInterface(b.g.nodes));
assert.equal(a.g.skins.length, b.g.skins.length);
a.g.skins.forEach((skin, i) => {
  assert.deepEqual({...skin, inverseBindMatrices:0}, {...b.g.skins[i], inverseBindMatrices:0});
  assert.deepEqual(accessor(a, skin.inverseBindMatrices), accessor(b, b.g.skins[i].inverseBindMatrices));
});
const technical = await read(folder + '/validation/report.json');
const geometry = await read(folder + '/validation/source_geometry_audit.json');
assert(technical.passed && geometry.passed);
assert.equal(geometry.sourceHash, m.delivery.sourceHash);
const parity = {revision:m.revision, sha256:m.delivery.sha256, sourceHash:m.delivery.sourceHash, passed:true, exactAnimationChannelsAndSamples:true, exactRigAnchorTransformsAndBindMatrices:true, clips:b.g.animations.map(a=>a.name), technicalPassed:true, geometryAuditPassed:true, inspectorLoadedHashPrefix:'baf8fd704583', inspectedViews:['front close-up','isometric close-up','underside','390 px phone-width','work paused at 0.75 s']};
await fs.writeFile(folder + '/validation/jaw_refinement_check.json', JSON.stringify(parity,null,2)+'\n');
const review = await read(folder + '/validation/visual_review.json');
assert.equal(review.sha256, m.delivery.sha256);
review.scope = 'refinement';
review.reviewedAt = new Date().toISOString();
review.checks.referenceFidelity = {status:'passed', findings:'Applied the explicit 2026-09-26 request to remove the moustache reading of the upper jaw. Removed the protruding white applique and flattened the central blue rim, retaining a shallow upward turn at the sides. Preserved the agreed 88% jaw projection, shield, goggles, pod contours and palette. The new user direction supersedes the older white jaw strip.'};
review.checks.construction = {status:'passed', findings:'Inspected exported front and oblique close-ups in the shared Inspector and the fixed side render. The rim is the actual blue jaw surface, with no separate stripe or exposed ends. The broad centre is level, both ends turn into the cheeks, and the shield/armor remain seated without blue breakthrough. Underside inspection retains the jaw attachment. Source audit reports zero degenerate triangles and zero loose vertices. Source preservation checks retain unrelated vertices, UVs and all weights.'};
review.checks.readability = {status:'passed', findings:'Inspected the full front, side and isometric renders plus the Inspector at 390 px phone width. The face remains open beneath the cyan eyes; the blue jaw reads as one armor volume and the white shield remains the lower-face focal point. The scalloped white moustache shape is gone.'};
review.checks.motion = {status:'passed', findings:'All six exported clips have byte-identical sample times, outputs, channel targets and interpolation versus revision 16; rig, anchor transforms and inverse bind matrices are exact. Retained body weights keep the revised jaw rigid. Guarded validation samples every clip and passes. Reviewed the phone-width work pose paused at 0.75 s: rim continuity, display clearance and shield seating remain intact. Existing animation timing and lifecycle presentation are retained.'};
review.secondPass = {status:'passed', findings:'After the first exported front/side/isometric review, inspected the close oblique rim, underside attachment, phone-width silhouette and paused work pose in the current shared Inspector (revision 17, hash baf8fd704583). Reassessed central flatness, shallow end transitions and shield clearance. No floating strip, jaw/armor breakthrough or new scoped defect was visible, so no further geometry adjustment was needed. This is an author assessment; user acceptance remains pending.'};
review.evidence = [];
for (const [name, view] of [['front.png','front rim and shield'],['iso.png','oblique jaw surface'],['side.png','retained jaw projection'],['source_geometry_audit.json','source topology audit'],['jaw_refinement_check.json','exported animation parity and Inspector observations']]) {
  const path = folder + '/validation/' + name;
  review.evidence.push({path, sha256:createHash('sha256').update(await fs.readFile(path)).digest('hex'), view});
}
review.userAcceptance = {status:'pending', note:'User requested the moustache-like upper jaw edge be reworked. Revision 17 implements the refinement and awaits their artistic assessment.'};
review.limitations = ['The new continuous blue rim intentionally replaces the previous white jaw stripe; its artistic acceptance remains pending.'];
await fs.writeFile(folder + '/validation/visual_review.json', JSON.stringify(review,null,2)+'\n');
console.log('Revision 17 jaw review recorded; exact exported animation and rig parity passed.');
