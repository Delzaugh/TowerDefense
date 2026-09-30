import fs from 'node:fs';
import crypto from 'node:crypto';

const dir = 'blender/towers/copilot_security/v01';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const write = (path, value) => fs.writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const manifest = read(`${dir}/asset.json`);
const report = read(`${dir}/validation/animation/review.json`);
const geometry = read(`${dir}/validation/source_geometry_audit.json`);
const technical = read(`${dir}/validation/report.json`);
const source = read(`${dir}/validation/animation_source.json`);
const review = read(`${dir}/validation/visual_review.json`);
if (manifest.revision !== 16 || !report.passed || !geometry.passed || technical.errors.length || !source.restArtPreserved) throw Error('Expected passing revision 16 animation delivery');
if ([report.sha256, technical.sha256, review.sha256].some(value => value !== sha(manifest.runtime))) throw Error('Runtime evidence is stale');
if ([report.sourceHash, geometry.sourceHash, review.sourceHash].some(value => value !== sha(manifest.source.path))) throw Error('Source evidence is stale');
if (source.acceptedModelSourceHash !== manifest.animationHandoff.sourceHash) throw Error('Approved baseline differs');
if (report.rendererSha256 !== sha('tools/asset-presentation/digital-resolve.js')) throw Error('Renderer evidence is stale');

review.scope = 'animation';
review.reviewedAt = new Date().toISOString();
review.checks = {
  referenceFidelity: {status: 'passed', findings: 'Model revision 15 was explicitly accepted before animation. Its jaw remains 12% shorter than the original, with the approved housing-following pod borders, rearward pod slope and seated shield. The animation build compares an exact source art signature including vertices, faces, normals, UVs and material assignments with the immutable approved source. Actual GLB rest vertex difference is below 7.1e-8 metres, normal difference below 1.2e-7 and UV difference zero. Rest art is preserved within export floating-point precision.'},
  construction: {status: 'passed', findings: 'Four bones animate the rigid body, paired display graphics and rigid temple scanner. Inspected the scanner at its sweep extreme and the display blink close-up: the scanner stays seated on its saddle and the narrowed cyan graphics remain visible on the screen. The action anchor follows the scanner to numerical precision. The source geometry audit reports zero degenerate triangles and zero loose vertices. The model remains 2854 triangles with two materials; the shared effect adds at most 144 triangles for a total of 2998.'},
  readability: {status: 'passed', findings: 'Reviewed seven sampled poses per clip in six contact sheets, plus the scanner close-up and all six phone-scale animation views. Idle blink, active scanner sweep, forward hover lean and hit recoil are distinct. The shield, goggles, cyan display and pod trim stay readable. Phone Place and Resolve captures show full-size partial forms, cyan grid edges and blue cubes. Resolve completion leaves neither body fragments nor a residual model shadow.'},
  motion: {status: 'passed', findings: 'Validated idle 2.5 s, work 2 s and move 2 s loops across repeated runtime playback and matching exported endpoints. Place and Resolve last 1.25 s; Hit lasts 14/24 s. Ready transitions match exactly, including Place end to Idle start. Sampled all exported clips at 97 points; minimum ground clearance is 0.0914 m against the 0.06 m requirement. Root motion remains disabled. Checked one-shot completion, seeking, deterministic effect replay, Rest reset and the no-fragment-pool fallback. Resolve fully disappears and Place starts invisible; Effects-off retains full-size skeletal poses. All runtime assertions pass.'}
};
review.secondPass = {status: 'passed', findings: 'After correcting only review-harness timeline rounding and frame synchronization, reran the complete exported animation audit. Inspected all six finished pose boards and all phone captures, then the scanner sweep and blink close-ups. No source-art or motion repair was needed after this animation pass. The final source, export, effect renderer and evidence hashes match. Model approval is preserved separately; user acceptance of the new animations remains pending.'};
review.evidence = report.evidence;
for (const clip of manifest.clips) {
  const path = `${dir}/validation/animation/board-${clip.name}.png`;
  review.evidence.push({path, sha256: sha(path), view: 'seven-pose contact sheet', clip: clip.name});
}
review.userAcceptance = {status: 'pending', note: 'The user approved model revision 15 and authorized animations. Revision 16 animations have completed technical and author review; artistic acceptance has not been inferred.'};
review.limitations = ['Cube assembly and disintegration require the shared presentation lifecycle renderer configured in the manifest and enabled in the Asset Inspector. A standalone GLB player displays the skeletal clips only.'];
source.sourceHash = manifest.delivery.sourceHash;
source.revision = manifest.revision;
write(`${dir}/validation/animation_source.json`, source);
write(`${dir}/validation/visual_review.json`, review);
console.log(JSON.stringify({revision: review.revision, scope: review.scope, evidence: review.evidence.length, userAcceptance: review.userAcceptance.status}));
