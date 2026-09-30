const fs=require('node:fs');const crypto=require('node:crypto');const {spawnSync}=require('node:child_process');
const findings={
gh_thinktocat:{
scope:'refinement',
referenceFidelity:'Installed bronze and clay/process photos rechecked against front/side/close export: broad round forehead, lowered closed-eye face, recessed ears, small nose, curled chin support, crossing arm, seated feet, rear curl and tapered white plinth retain the sculptural identity. Accepted bronze palette is retained; exact patina and anatomical carving remain stylized.',
construction:'Inspected front, side, oblique, reverse and detail. Initial flat facial backing and detached cap equator seams were repaired using a welded cast head/face and shared-ring hemispherical tentacle ends. Bronze face now blends into forehead with no side wafer edge; ear bowls have seated inset surfaces, rock seats into the plinth, and intentional tentacle crossings preserve clear negative spaces.',
readability:'At 390 px the round head, ear pair, closed eyes, thoughtful chin-rest curl, crossing tentacle and contrasting chalk plinth remain legible. Smooth major cast volumes contrast with the faceted rock seat; very small eyelid creases are secondary at campus overview distance.',
secondPass:'Finished revision rechecked against installed bronze/clay references after the face weld, cap correction and cast smoothing pass. Front/side close comparison confirms no exposed facial backing lip or voxel-grid pattern, curved end caps retain continuous surface, and reverse silhouette keeps ear/tail/body proportions. Reference proportions are interpreted rather than exact scanned measurements.',
limitations:['Original stylized interpretation of Thinktocat sculpture, not an exact scan; fine bronze patina and detailed source carving are simplified.']},
gh_secret_octocat:{
scope:'model',
referenceFidelity:'Attachment 3 tabletop figurine rechecked against finished export: glossy black oversized head, cat-ear pair, broad peach face, rose-pink oval eyes, small smile/nose, four standing tentacles plus curling side tentacle and turquoise pedestal preserve the classic collectible identity. Height and subtle details are interpreted.',
construction:'Front/side/oblique/reverse/detail inspection confirms curved face inset seats inside black head shell, eye rims and pupils have intentional layered depths, ear bowls are recessed, tail joins torso, and four rounded standing tips seat into pedestal. First-pass end-cap sphere seams were replaced with shared-ring hemispherical geometry; repeating tail suckers are secondary coherent fittings.',
readability:'Phone framing retains classic round head, peach face, rosy eyes, cat ears, waving tail and turquoise base. At actual shelf size it functions as a discoverable small figure; facial glints and sucker dots are intentionally secondary and will disappear in distant campus views.',
secondPass:'Finished model rechecked against attachment 3 after cap repairs and five-tentacle silhouette correction. Rear/side views show seated supports and consistent head thickness; face boundary remains within black shell and eye pair shares common height/spacing. Ground/base and rooted +Z orientation are preserved.',
limitations:['Original stylized interpretation of user-supplied collectible photo; dimensions are inferred and not manufacturer measurements.']}
};
for(const [id,f] of Object.entries(findings)){
 const folder=`blender/environment/${id}/v01/validation`,file=folder+'/visual_review.json';
 let result=spawnSync(process.execPath,['tools/asset-pipeline/asset.mjs','review',id,'--init'],{encoding:'utf8',windowsHide:true});if(result.status)throw Error(result.stdout+result.stderr);
 const r=JSON.parse(fs.readFileSync(file));r.scope=f.scope;r.reviewedAt=new Date().toISOString();
 for(const k of ['referenceFidelity','construction','readability'])r.checks[k]={status:'passed',findings:f[k]};
 r.checks.motion={status:'not_applicable',findings:'Intentionally static environment sculpture; no skeleton, animations, root motion or gameplay behavior requested.'};
 r.secondPass={status:'passed',findings:f.secondPass};r.userAcceptance={status:'pending',note:'User requested production/refinement; artistic acceptance of this exact source/export revision has not been given.'};r.limitations=f.limitations;
 r.evidence=['front','side','iso','rear','inspector-close','inspector-phone'].map(view=>{const path=folder+'/'+view+'.png';return {path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),view};});
 fs.writeFileSync(file,JSON.stringify(r,null,2)+'\n');result=spawnSync(process.execPath,['tools/asset-pipeline/asset.mjs','review',id],{encoding:'utf8',windowsHide:true});fs.writeFileSync(folder+'/author-review-log.txt',result.stdout+result.stderr);console.log(id+': '+result.stdout.trim());if(result.status)throw Error(result.stdout+result.stderr);
}
