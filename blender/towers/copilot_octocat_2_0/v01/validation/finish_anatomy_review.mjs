import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const folder='blender/towers/copilot_octocat_2_0/v01';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(await fs.readFile(folder+'/validation/existing_octocats_baseline.json'));
for(const [id,b] of Object.entries(baseline)){
 if(hash(await fs.readFile(b.source))!==b.sourceHash || hash(await fs.readFile(b.runtime))!==b.runtimeHash)throw Error('Existing Octocat changed: '+id);
}
await fs.writeFile(folder+'/validation/existing_octocats_preserved.json',JSON.stringify({checkedAt:new Date().toISOString(),passed:true,assets:baseline},null,2)+'\n');
const m=JSON.parse(await fs.readFile(folder+'/asset.json'));
const audit=JSON.parse(await fs.readFile(folder+'/validation/source_audit.json'));
const live=JSON.parse(await fs.readFile(folder+'/validation/inspector_evidence.json'));
const report=JSON.parse(await fs.readFile(folder+'/validation/report.json'));
if(m.revision!==7 || audit.sourceHash!==m.delivery.sourceHash || !audit.passed)throw Error('Reviewed source changed or failed');
if(live.sha256!==m.delivery.sha256 || live.errors.length || !report.passed)throw Error('Inspector or technical evidence stale/failed');
for(const e of live.evidence)if(hash(await fs.readFile(e.path))!==e.sha256)throw Error('Screenshot changed: '+e.path);
if(hash(await fs.readFile(m.runtime))!==m.delivery.sha256)throw Error('Runtime changed');
for(const [file,description] of [
 ['creator_turnaround.jpg','GitHub Animation Team seven-angle Mona turnaround; published by contributor Tony Jaramillo. Primary five-limb layout and three-support upright pose.'],
 ['creator_tentacle_construction.png','GitHub Animation Studios tentacle construction sheet dated 20 January 2016; five tentacles in pentagonal formation, flat underside, bulbous tips, taper toward head base and five suction cups per tentacle.'],
 ['creator_head_construction.png','GitHub Animation Team head construction sheet; rounded head volume, ear placement and facial landmarks.']
]){
 const path=folder+'/references/'+file;
 if(!m.references.some(r=>r.path===path))m.references.push({path,url:'https://www.tonytimetables.com/mona/',provenance:description});
}
m.references.find(r=>r.path.endsWith('myoctocat_base.svg')).provenance='Official posed unadorned Octocat linked by the brand page. Proportion and pose input; detailed anatomy follows the creator construction/turnaround sheets.';
await fs.writeFile(folder+'/asset.json',JSON.stringify(m,null,2)+'\n');
const review=JSON.parse(await fs.readFile(folder+'/validation/visual_review.json'));
review.scope='model';review.reviewedAt=new Date().toISOString();
review.checks.referenceFidelity={status:'passed',findings:'Personally compared the original creator turnaround, tentacle/head construction sheets, official brand illustration and MyOctocat base with revision 7 runtime front, right, reverse, underside and oblique views. Corrected the previous tail interpretation: five tentacles taper toward a common base beneath the head, two act as arms and three as supports in this upright pose. Three feet occupy front-left/front-right/rear positions. Flattened undersides, rounded outer surfaces, bulbous tips and five cups per tentacle represent the construction sheet. Large rounded head, inset ears, forehead dip, cheeks and open grin retain Octocat 2.0 expression. Asymmetric wave and local proportions remain stylized pose choices; exact orthographic reproduction is not claimed.'};
review.checks.construction={status:'passed',findings:'Inspected actual revision 7 close frontal/oblique face images and front, side, rear and underside images. Removed the humanoid torso capsule and tail. Thin roots meet at the shared head-base collar; rear support is connected, visible in reverse/side views and grounded. D-profile tentacles and broad tips remain coherent through bends. Twenty-five fitted shallow cups replace forty-five small beads; final changed views show no intersecting adjacent cup rims. Source audit reports head and body each one connected closed shell, zero nonmanifold edges and degenerate faces, three support contacts at zero and two packed images. Pipeline reports 68,180 triangles, 20 meshes, 2 materials, 2 embedded textures and no errors or warnings.'};
review.checks.readability={status:'passed',findings:'Personally reviewed final shared Inspector at phone width and small game scale. Ear outline, peach face, asymmetrical arms and front supports remain recognizable. Rear foot is clearest in oblique and reverse views; front-view occlusion follows the turnaround. Individual cups, glints and tongue are secondary at game scale. Authored 1.80029 m height and three contacts remain visible without viewer rescaling.'};
review.checks.motion={status:'not_applicable',findings:'Static model milestone. Rig and animation remain deferred. Future motion must account for changing tentacle support roles instead of the superseded two-foot/tail assumption.'};
review.secondPass={status:'passed',findings:'Revision 5 corrected primary topology. Revision 6 separated cups and exposed uneven support contact. Revision 7 grounded all three feet. Inspected final runtime again against creator sheets: side/reverse show third support, underside shows distinct soles, front/oblique retain arm/leg negative spaces, close face views preserve skull depth and seated detail. Rechecked phone and small silhouette. No remaining scoped anatomy or contact defect blocks this stylized handoff. Source, runtime and screenshots are bound to reviewed hashes.'};
review.evidence=review.evidence.filter(e=>['front','side','iso'].includes(e.view)&&e.mode==='shaded');
review.evidence.push(...live.evidence.map(({path,sha256,view})=>({path,sha256,view})));
review.userAcceptance={status:'pending',note:'Awaiting feedback on anatomy-corrected revision 7; author review is separate from user acceptance.'};
review.limitations=['Static sculpt: rig deformation, animation and wardrobe fitting remain pending.','68,180 triangles retain established Modern quality envelope; crowded-scene mobile performance has not been profiled.','Creator construction is represented in a stylized waving pose; exact orthographic matching and GitHub artistic approval are not asserted.'];
await fs.writeFile(folder+'/validation/visual_review.json',JSON.stringify(review,null,2)+'\n');
const heading='## Anatomy correction and completed model review — revision 7';
let decisions=await fs.readFile(folder+'/decisions.md','utf8');
if(decisions.includes(heading))decisions=decisions.slice(0,decisions.indexOf(heading));
decisions+=`${heading}\n\nThe user requested reference-backed anatomy verification. Original GitHub Animation\nTeam sheets reveal that the previous rear-tail interpretation was wrong. Five\ntentacles meet beneath the head; the turnaround uses two arm-like tentacles and\nthree supporting feet in its upright pose. The construction sheet shows five\ncups per tentacle, flattened undersides and bulbous tips. The official figurine\narticle independently confirms five tentacles and a pentagonal arrangement.\n\nRevision 5 rebuilt the shared head-base connection and three-support anatomy.\nRevision 6 revised cup seating and spacing. The contact audit exposed front\nfeet above the rear support. Revision 7 corrected their common contact plane.\n\nPersonally reviewed final runtime in front, side, oblique, reverse, underside\nand close-face views, then at phone and game scale. The second review compared\nthe repaired export against creator sheets. User acceptance remains pending.\n\nFinal: ${report.triangles.toLocaleString('en-US')} triangles, ${report.meshes} meshes,\n2 materials, 2 embedded textures, 0 bones; dimensions ${report.dimensions.map(v=>v.toFixed(5)).join(' x ')} m.\nBoth head/body shells are connected and closed with zero nonmanifold edges or\ndegenerate faces. All three support contacts are at zero. Twenty-five cups and\nnine anchors remain. Guarded validation reports no errors or warnings.\nRuntime hash ${m.delivery.sha256}.\nSource hash ${m.delivery.sourceHash}.\nExisting Classic, Classic Low Poly and Modern source/runtime hashes remain unchanged.\n\nAnimation remains pending; the previous two-foot walk/tail assumption is superseded.\n`;
await fs.writeFile(folder+'/decisions.md',decisions);
console.log(JSON.stringify({revision:m.revision,existingOctocatsPreserved:true,sourceAudit:true,reviewWritten:true}));
