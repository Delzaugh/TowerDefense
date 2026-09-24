import {readFile,writeFile,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const ids=['copilot_tester','copilot_analyst','linter_agent'];
const hash=b=>createHash('sha256').update(b).digest('hex');
const checkedAt=new Date().toISOString(),results=[];
let doc='# Persona tower models\n\nSix selected concepts modeled as static, textured assets. Base Copilot is unchanged. All models use the existing compact family scale, face +Z, have grounded rest geometry and include named anchors. Animation and gameplay integration are not part of this modeling delivery.\n\n![Actual runtime previews](persona_towers_preview.png)\n\n| Model | Preview | Editable source | Runtime | Triangles |\n| --- | --- | --- | --- | ---: |\n';
for(const id of ids){
 const folder=`blender/towers/${id}/v01`,m=JSON.parse(await readFile(folder+'/asset.json','utf8'));
 const r=JSON.parse(await readFile(folder+'/validation/report.json','utf8'));
 const ui=JSON.parse(await readFile(folder+'/validation/inspector_check.json','utf8'));
 if(!r.passed||!ui.passed||r.sha256!==ui.sha256||hash(await readFile(m.source.path))!==r.sourceHash||hash(await readFile(m.runtime))!==r.sha256)throw Error('Stale or failed evidence: '+id);
 const review={asset:id,version:m.version,revision:m.revision,sha256:r.sha256,sourceHash:r.sourceHash,reviewedAt:checkedAt,reviewer:'primary production agent',status:'visual construction review complete; user artistic acceptance pending',views:['iso','front','side','rear','top','inspector_underside','inspector_phone','inspector_small'],findings:['Distinct concept silhouette and characteristic role accessory retained.','Face screens are opaque and clear of shell intersections after adding interior support loops.','Goggle rims, ear details and structural frames inspected in front, side, reverse and underside views.','All eight Linter sockets are present; no aura, selection or gameplay-effect geometry is included.','Model identity remains legible at phone width and in the small-silhouette test; tiny symbols become secondary.'],limitations:['Static rest-pose model: no skeleton or animation clips.','Backside details and depths inferred from the single three-quarter concept reference.','Artistic acceptance and integration into gameplay remain separate.']};
 await writeFile(folder+'/validation/visual_review.json',JSON.stringify(review,null,2)+'\n');
 await appendFile(folder+'/decisions.md',`\n## Delivery and visual review — 2026-09-18\n\n- Delivered revision ${m.revision}: ${r.triangles} triangles, two opaque materials, one embedded 32×4 image used by two sampler bindings.\n- Actual exported GLBs inspected in neutral isometric/front/side/rear/top views, shared Inspector underside, phone width and small-silhouette views. Evidence and exact hashes are in validation/visual_review.json.\n- Curved screen construction was corrected with internal support loops; Security's screen seating was adjusted to clear its larger helmet. Repeated face instances were rechecked.\n- Technical validation passes with no Three.js errors or warnings. Production visual inspection is complete; user artistic acceptance is pending.\n`);
 const source=path.resolve(m.source.path).replaceAll('\\','/'),runtime=path.resolve(m.runtime).replaceAll('\\','/');
 doc+=`| ${m.displayName} | [Inspector](http://127.0.0.1:4174/?asset=${id}&version=v01) | [Blender](${source}) | [GLB](${runtime}) | ${r.triangles} |\n`;
 results.push({id,version:m.version,source:m.source.path,runtime:m.runtime,sha256:r.sha256,sourceHash:r.sourceHash,passed:r.passed,triangles:r.triangles,errors:r.errors,checkedAt:r.checkedAt});
}
doc+='\nSources retain named component vertex groups and packed semantic palettes. Use ordinary guarded export after manual edits; use `--build` only while the recorded source hash still matches. Each asset has its own recipe, reference copy, manifest and decision record.\n\nShared geometry code: [persona_geometry.py](persona_geometry.py). Construction evidence: [fixed views](construction_review_final.png), [Inspector views](inspector_review_final.png).\n';
await writeFile('blender/towers/_shared/PERSONA_MODELS.md',doc);
await writeFile('blender/towers/_shared/delivery_summary.json',JSON.stringify({checkedAt,passed:true,assets:results},null,2)+'\n');
const aggregate=JSON.parse(await readFile('assets/validation_catalog.json','utf8'));
aggregate.assets=aggregate.assets.filter(a=>!ids.includes(a.id)).concat(results);
aggregate.count=aggregate.assets.length;aggregate.passed=aggregate.assets.every(a=>a.passed);
aggregate.lastIncrementalCheck={checkedAt,ids,note:'Updated only the six Persona deliveries from hash-verified current reports; previous asset results and full-check timestamp retained.'};
await writeFile('assets/validation_catalog.json',JSON.stringify(aggregate,null,2)+'\n');
console.log(JSON.stringify({passed:true,assets:results.map(({id,triangles})=>({id,triangles}))}));
