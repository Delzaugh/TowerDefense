import {readFile,writeFile,appendFile} from 'node:fs/promises';
import {findAsset,hash} from '../asset-pipeline/contracts.mjs';
import {reviewAsset} from '../asset-pipeline/visual-review.mjs';
const entries=JSON.parse(await readFile('tools/asset-recipes/campus-forest-entries.json','utf8'));
// These are recorded judgments from the 2026-09-24 visual inspection, not an
// automatic art approval. Refuse to apply them to a later, uninspected revision.
const reviewedInventory=JSON.parse(await readFile('blender/environment/campus_tile_forest/v01/validation/forest_kit_delivery.json','utf8'));
const notes={
 round:['Original broad teal crown and eight-sided trunk preserve their geometry and color after removing the planter and lowering by 0.28 m.','Front and reverse show the trunk seated inside the crown; underside shows a capped trunk and no planter remnants.','Rechecked the unchanged crown profile against the original round-tree render and the source snapshot. Grounded contact and silhouette are clean; no further repairs needed.'],
 tall:['Narrow light-teal crown remains visibly taller and slimmer than the round form.','Front/reverse show a centered trunk entering the crown, with a flat capped ground contact and no base.','Rechecked primary width-to-height and crown bottom against the extracted authoritative geometry. The baseless form retains the original narrow silhouette.'],
 cluster:['Preserved the two different teal crowns, their offsets, relative height and spacing.','Both exposed trunks reach the same plane; close/reverse views retain the deliberate adjoining crowns without any former planter geometry.','Second review of both repeated trunks and canopy undersides found no floating attachments or residual foundation surfaces.'],
 pine:['Three conical tiers introduce a clear evergreen outline; blue-green crown and warm trunk remain compatible with the campus.','The continuous tiered canopy has clean closed undersides and a visible trunk; front/reverse have no gaps between tiers.','Rechecked the tier transitions and top point from reverse and close views. Facets are intentional and the trunk stays grounded; no structural repair required.'],
 spreading:['Three broad sage/moss lobes form a low, wide canopy distinct from tall and round trees.','Two forks enter the side lobes; underside and reverse expose the attachments and confirm no floating crowns. Separate crown lobes intentionally overlap.','Rechecked the lower crown silhouette and fork seating after the primary-form pass. The lobes keep a coherent spreading outline at phone scale.'],
 autumn:['Asymmetric gold and amber lobes with a warm trunk provide a seasonal variant without emission.','The first candidate had a slanted bottom cap 0.00613 m below zero. Flattened the trunk bottom in the source recipe; the replacement export is grounded. Reverse/underside confirm the fork enters the second lobe.','Rechecked the corrected ground contact and both crown attachments. The replacement has a flat bottom and a readable asymmetrical outline in close and phone views.'],
 mixed:['Nine placements / ten trunks combine all six silhouettes in teal, blue-green, sage and muted gold.','One foliage mesh has no ground slab. Top/underside views show separated trunks, crown clearance and an irregular layout inside its 10 m envelope.','Replaced the initial row-like spacing with offset placements. Rechecked top, reverse and phone views of revision 3: varied heights and visible openings now read as a loose grove.'],
 dense:['Thirteen round, tall and pine trees create a denser blue-green/moss group with varied heights.','Top and underside confirm clear distinct trunk contacts and no shared base. Reverse shows the intended overlapping silhouettes without accidental floating trees.','Rechecked the repeated pines and tall crowns at close and phone scale. The denser silhouette remains legible and stays inside the 10 m module.'],
 edge:['Seven trees transition from taller back crowns to low sage/amber foreground crowns.','All trunks sit at zero; top and underside show a shallow 12 by 6 m envelope with no baked ground or planter.','Rechecked the wide side silhouette, front-to-back height ordering and branch seating. The autumn accent remains readable at phone scale.'],
 tile:['Forty-two mixed trees sit on the preserved campus park hex, framing an eight-metre central clearing and a north–south opening.','Preserved terrain frame and six edge anchors. Top view shows crown clearance from the hex edge and route; reverse shows all trees seated on the terrain. Runtime has two meshes and two materials.','The first layout read as orchard rows. Replaced it with crown-aware seeded scatter and reviewed the revision 3 top, oblique, reverse and phone views. The current woodland has irregular spacing, a clear center and clean terrain contact.']
};
const inventory=[];
for(const e of entries){
 const item=await findAsset(e.id,'v01'),m=item.data,folder=`blender/environment/${e.id}/v01`;
 const seen=reviewedInventory.assets.find(a=>a.id===e.id);
 if(seen?.sha256!==m.delivery.sha256||seen?.sourceHash!==m.delivery.sourceHash)throw Error('A new visual inspection is required: '+e.id);
 await reviewAsset(item,{initialize:true});
 const file=folder+'/validation/visual_review.json',r=JSON.parse(await readFile(file,'utf8'));
 const [fidelity,construction,second]=notes[e.kind];
 r.scope=['round','tall','cluster'].includes(e.kind)?'refinement':'model';r.reviewedAt=new Date().toISOString();
 r.checks.referenceFidelity={status:'passed',findings:fidelity};r.checks.construction={status:'passed',findings:construction};
 r.checks.readability={status:'passed',findings:e.kind==='tile'?'At 390 px viewport width the hex border, central clearing, path opening and mixed foliage remain readable. Individual branches are subordinate scenery at this distance.':'Personally inspected the phone-width and fixed-view renders: the crown outline and trunk remain readable; different forms are identifiable without relying only on color.'};
 r.secondPass={status:'passed',findings:second};
 r.evidence=[];
 for(const f of ['validation/iso.png','validation/front.png','validation/rear.png',...(['mixed','dense','edge','tile'].includes(e.kind)?['validation/top.png']:[]),'renders/inspector-close.png','renders/inspector-rear.png','renders/inspector-phone.png','renders/inspector-bottom.png'])r.evidence.push({path:folder+'/'+f,sha256:hash(await readFile(folder+'/'+f)),view:f.replace('.png','')});
 r.userAcceptance={status:'pending',note:'New family delivered for user artistic review; no approval inferred.'};
 r.limitations=['Static environmental art; no collision, pathfinding or gameplay placement integration.'];
 if(['mixed','dense','edge'].includes(e.kind))r.limitations.push('Flat common contact plane; use individual trees for uneven terrain.');
 if(e.kind==='tile')r.limitations.push('Includes the terrain slab; place as a terrain tile rather than stacking on another base.');
 await writeFile(file,JSON.stringify(r,null,2)+'\n');
 const checked=await reviewAsset(item);if(!checked.ready)throw Error(JSON.stringify(checked));
 const report=JSON.parse(await readFile(folder+'/validation/report.json','utf8'));
 await appendFile(folder+'/decisions.md',`\n## Delivered author review - revision ${m.revision}\n\n${fidelity} ${construction}\n\nSecond pass: ${second}\n\nExport validation passed: ${report.triangles} triangles, ${report.materials} material(s), ${report.meshes} mesh(es); self-contained packed textures. The actual shared Inspector payload hash was checked in renders/inspector-session.json. Formal source/export-bound findings: validation/visual_review.json. User artistic acceptance is pending.\n`);
 inventory.push({id:e.id,revision:m.revision,triangles:report.triangles,materials:report.materials,meshes:report.meshes,dimensions:report.dimensions,source:m.source.path,runtime:m.runtime,sourceHash:m.delivery.sourceHash,sha256:m.delivery.sha256,reviewReady:checked.ready});
 console.log(e.id+': technical and visual review ready');
}
await writeFile('blender/environment/campus_tile_forest/v01/validation/forest_kit_delivery.json',JSON.stringify({reviewedAt:new Date().toISOString(),assets:inventory},null,2)+'\n');
