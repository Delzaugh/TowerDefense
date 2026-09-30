import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash,projectRoot} from '../../../../../tools/asset-pipeline/contracts.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const read=async f=>JSON.parse(await readFile(path.join(here,f),'utf8'));
const manifest=await read('../asset.json'),audit=await read('animation/review.json');
const record=await read('visual_review.json');
assert.equal(manifest.revision,14);assert(audit.passed);
for(const k of ['revision','sha256','sourceHash'])assert.equal(audit[k],record[k]);
assert.equal(hash(await readFile(path.join(projectRoot,manifest.runtime))),record.sha256);
assert.equal(hash(await readFile(path.join(projectRoot,manifest.source.path))),record.sourceHash);
record.scope='animation';record.reviewedAt=new Date().toISOString();
const passed=findings=>({status:'passed',findings});
record.checks={
 referenceFidelity:passed('Animation follows the explicitly accepted revision 12 model. Runtime comparison verifies identical triangle positions, UVs and material assignments, unchanged material objects and embedded palette bytes; normal evaluation differs by less than 2e-6. The corrected pod seats, recessed face and saturated framed visor remain intact. Model acceptance is preserved separately in r12_model_approved_before_animation.'),
 construction:passed('Nine rigid bones separate body, six complete pods and two indicators. All rigid components use single-bone weights. Inspected side work at 0.13 s and underside work at 0.46 s, including maximum inward recoil: root seats remain inside the chassis and no stretches, seams opening or double transforms were seen. Six muzzle anchors move inward by 0.055 m with the pods, never outward beyond numerical noise; original anchors preserve their rest coordinates. The source is saved with inactive actions, muted NLA and rest bones.'),
 readability:passed('Inspected all six clip contact rows and action/recovery strips, plus phone-width clips with ground/shadows. Idle is deliberately quiet, Work uses restrained sequential recoil, Move banks the rigid body, and Hit has a brief visible tilt/indicator flinch. Shell, dark crown, deep face well and cyan visor remain readable. Place/Resolve cubes stay distinct at phone scale; terminal Resolve has no residual model or shadow.'),
 motion:passed('Reviewed revision 14 live in the shared Inspector at normal playback, then captured and inspected starts, action extremes, recovery and ends. Three 2 s loops keep matching boundary poses; Work recovers each inward pulse before the next shooter. The 0.5 s Hit recovers to ready. The 1.25 s Place end is pixel-identical to Idle start, and Resolve reverses the compatible full-size pose track and ends invisible. Runtime audits sampled 97 poses per clip, found minimum clearance 0.105330 m, stationary root, matching loop/transition endpoints and nonconstant channels. Multiple loop cycles, one-shot clamps, deterministic effect scrubbing/replay, Effects toggle and Rest Pose reset passed. Source retains independent indicator controls; no gameplay effects are authored in clip completion.')
};
record.secondPass=passed('After correcting armature parenting in the first export, re-exported revision 14 without warnings and reran source/runtime parity and actual Inspector checks. Reopened the delivered hash 7cdddfdfccdd in the shared Inspector and checked each clip, Resolve terminal invisibility and Rest Pose reset. Reviewed the final action/extreme, phone and exposed-joint sheets after the automated pass. No further art or motion correction was required. Test-harness timing fixes wait for rendered frames and round range-input times; they do not change the asset.');
const files=[
 ['animation-contact-sheet.png','Six clips: start, quarter, midpoint and exact end'],
 ['animation-motion-extremes.png','Six clips: labeled start, anticipation/action extremes, recovery and end at 24 fps'],
 ['animation-joints-phone.png','Side and underside maximum recoil; phone Work and invisible Resolve end'],
 ['animation-phone-clips.png','All six clips at phone width with ground and shadows'],
 ['animation/review.json','Runtime parity, 97 poses per clip, playback/reset/effect audits and capture index'],
 ['animation_source.json','Editable source parity, anchors, rig and clearances']
];
record.evidence=[];
for(const [file,view] of files)record.evidence.push({path:path.relative(projectRoot,path.join(here,file)).replaceAll('\\','/'),sha256:hash(await readFile(path.join(here,file))),view,mode:file.endsWith('.json')?'audit':'shaded'});
record.userAcceptance={status:'pending',note:'User accepted the refined static model and explicitly authorized animation: “looks good, make the animations”. Acceptance of revision 14 animation is not yet claimed.'};
record.limitations=[
 'Place/Resolve cube assembly and disintegration require the shared createLifecycleEffect renderer; a plain GLB player only shows compatible full-size pose tracks.',
 'Move is stationary-root hover; simulation supplies travel/facing. Shooter actions are presentation only, with muzzle anchors supplied for later integration.'
];
await writeFile(path.join(here,'visual_review.json'),JSON.stringify(record,null,2)+'\n');
console.log('Recorded inspected animation revision 14; user animation acceptance pending.');
