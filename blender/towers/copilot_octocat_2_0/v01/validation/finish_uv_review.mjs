import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [id,revision] of [['copilot_octocat_2_0',8],['copilot_octocat_2_0_lowpoly',5]]){
 const folder='blender/towers/'+id+'/v01';
 const m=JSON.parse(await fs.readFile(folder+'/asset.json'));
 const audit=JSON.parse(await fs.readFile(folder+'/validation/source_audit.json'));
 const uv=JSON.parse(await fs.readFile(folder+'/validation/face_uv_audit.json'));
 const live=JSON.parse(await fs.readFile(folder+'/validation/inspector_evidence.json'));
 const report=JSON.parse(await fs.readFile(folder+'/validation/report.json'));
 if(m.revision!==revision || !report.passed || live.errors.length || live.sha256!==m.delivery.sha256 || audit.sourceHash!==m.delivery.sourceHash || !audit.passed || uv.sourceHash!==m.delivery.sourceHash || !uv.passed)throw Error('Stale or failed review evidence for '+id);
 if(hash(await fs.readFile(m.source.path))!==m.delivery.sourceHash || hash(await fs.readFile(m.runtime))!==m.delivery.sha256)throw Error('Asset changed');
 const review=JSON.parse(await fs.readFile(folder+'/validation/visual_review.json'));
 review.scope='refinement';review.reviewedAt=new Date().toISOString();
 review.checks.referenceFidelity={status:'passed',findings:'Localized face-UV correction preserves the existing Octocat 2.0 head/cheek proportions, expression, ears, whiskers, waving pose and five-tentacle anatomy. Reviewed final front and close oblique views against the pre-repair reference renders; peach face outline and game-scale identity remain. Neither anatomy nor palette was redesigned.'};
 review.checks.construction={status:'passed',findings:'User screenshot exposed peach slivers on the lower side/back of the head that the preceding review missed. The face paint is on one skull surface; expanded front-depth projection had mapped a few back-facing polygons into peach texels. Fixed hemisphere plus outward-normal classification in the high source recipe, stored exact scaled projection metadata and reapplied the UV map after low-poly reduction. Personally inspected final underside, side, front and close oblique runtime views: rear/underside slivers are gone and front expression remains intact. Source audit confirms closed head/body components with no nonmanifold edges or degenerate faces and three zero-height support contacts. The UV audit checks '+uv.checkedBackFacingOrRearPolygons+' rear/back-facing polygons and finds zero projected-face UVs; they all sample the dark fur texel. Packed palette/face maps and existing anchors remain.'};
 review.checks.readability={status:'passed',findings:'Personally inspected final phone and game-scale Inspector captures. Face silhouette, peach/graphite contrast, eyes, pointed ears, asymmetrical arms and support stance retain identity. The repair removes stray peach marks without changing the palette. Low-poly simplification remains intentionally faceted.'};
 review.checks.motion={status:'not_applicable',findings:'UV-only static-model refinement; no rig or clips are added. Animation remains pending.'};
 review.secondPass={status:'passed',findings:'After guarded re-export, reviewed underside and right-side views again for the isolated peach triangle and adjoining face boundary, then checked front/close-oblique expression and phone/game scale. Final views show no recurrence of the reported sliver. Low-poly live preview was additionally refreshed and inspected in the user exact close-up camera: the before/after images keep the same framing and the reported mark disappears. Separate source UV and shell/contact audits passed. Previous review rejection is retained in review history; this is a new author assessment, not user acceptance.'};
 review.evidence=live.evidence.map(({path,sha256,view})=>({path,sha256,view}));
 if(id.endsWith('lowpoly')){
   const path=folder+'/renders/user-uv-after-r5.png';
   review.evidence.push({path,sha256:hash(await fs.readFile(path)),view:'user-exact-closeup-after-UV-repair'});
 }
 for(const e of review.evidence)if(hash(await fs.readFile(e.path))!==e.sha256)throw Error('Changed screenshot');
 review.userAcceptance={status:'pending',note:'Prior revision rejected for user-reported skin-coloured slivers. Awaiting feedback on UV-corrected revision '+revision+'.'};
 review.limitations=['Static model; animation remains pending.',...(id.endsWith('lowpoly')?['Low-density outlines, shallow octagonal cups and angular close-up highlights remain intentional.']:['Crowded-scene performance has not been profiled.'])];
 await fs.writeFile(folder+'/validation/visual_review.json',JSON.stringify(review,null,2)+'\n');
 const heading='## Face UV leak repair — revision '+revision;
 let decisions=await fs.readFile(folder+'/decisions.md','utf8');
 if(decisions.includes(heading))decisions=decisions.slice(0,decisions.indexOf(heading));
 decisions+=`${heading}\n\nUser reported peach skin-coloured slivers on the lower side/back of both models,\nwith a close-up screenshot. This invalidates the preceding positive construction\nassessment; rejection and findings are retained in review history. Diagnosis\nidentified expanded front-depth UV projection onto rear/underside polygons.\n\nRestrict the face projection to front-hemisphere, forward-facing polygons.\nAll remaining polygons sample one safe graphite texel. Store scaled projection\nmetadata in the high source; the low recipe uses a new pinned revision 8 source\nand explicitly reapplies the mapping after reduction to protect the seam.\nThe original pinned revision 7 input remains historical.\n\nReviewed actual runtime underside, side, front, close oblique, phone and game\nviews after export, followed by a second check of the affected underside/side\nboundary. The low-poly user preview was also checked in the exact reported\nclose-up camera, preserved through Refresh. The sliver disappeared.\nSource UV audit: ${uv.checkedBackFacingOrRearPolygons} back-facing/rear polygons,\nzero projection failures. Source shell/grounding audit and runtime checks passed.\nFinal: ${report.triangles} triangles, ${report.meshes} meshes, ${report.materials} materials,\n${report.textures} embedded textures, ${report.bones} bones. Animation remains pending.\nRuntime hash ${m.delivery.sha256}.\nSource hash ${m.delivery.sourceHash}.\nUser acceptance of this corrected revision remains pending.\n`;
 await fs.writeFile(folder+'/decisions.md',decisions);
 console.log(JSON.stringify({id,revision,triangles:report.triangles,faceUvAudit:true,reviewWritten:true}));
}
