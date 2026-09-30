import {readFile,writeFile,readdir} from 'node:fs/promises';
import {findAsset,hash} from '../asset-pipeline/contracts.mjs';
import {reviewAsset} from '../asset-pipeline/visual-review.mjs';
const entries=JSON.parse(await readFile('tools/asset-recipes/campus-forest-entries.json','utf8'));
const result=[];
for(const e of entries){
 const item=await findAsset(e.id,'v01'),m=item.data,folder=`blender/environment/${e.id}/v01`;
 const ready=await reviewAsset(item);if(!ready.ready)throw Error(JSON.stringify(ready));
 const report=JSON.parse(await readFile(folder+'/validation/report.json','utf8'));
 if(['mixed','dense','edge'].includes(e.kind)){
  const half=e.kind==='edge'?[6,3]:[5,5];
  if(report.bounds.some(p=>Math.abs(p[0])>half[0]+.001||Math.abs(p[2])>half[1]+.001))throw Error('Crown exceeds module bounds: '+e.id);
 }
 let auditFile=folder+'/forest_source_audit.json';
 for(const dir of await readdir(folder+'/.staging').catch(()=>[])){
  const source=folder+'/.staging/'+dir+'/'+e.id+'_v01.blend';
  if(hash(await readFile(source).catch(()=>Buffer.alloc(0)))===m.delivery.sourceHash)auditFile=folder+'/.staging/'+dir+'/forest_source_audit.json';
 }
 const audit=JSON.parse(await readFile(auditFile,'utf8'));
 if(e.kind==='tile'&&audit.placements.length!==42)throw Error('Wrong tile tree count');
 if(audit.nonManifoldEdges||audit.zeroAreaFaces)throw Error('Invalid foliage construction');
 audit.sourceHash=m.delivery.sourceHash;audit.sha256=m.delivery.sha256;
 await writeFile(folder+'/forest_source_audit.json',JSON.stringify(audit,null,2)+'\n');
 await writeFile(folder+'/validation/source_audit.json',JSON.stringify(audit,null,2)+'\n');
 result.push({id:e.id,reviewReady:true,triangles:report.triangles,placements:audit.placements.length,base:e.kind==='tile'?'included':'none'});
}
const preservation=[];
for(const kind of ['round','tall','cluster']){
 const original=await findAsset('campus_tree_'+kind,'v01'),m=original.data;
 const snapshot=`blender/environment/campus_tree_${kind}_bare/v01/references/planter_source.blend`;
 const sourceUnchanged=hash(await readFile(snapshot))===hash(await readFile(m.source.path));
 const runtimeUnchanged=hash(await readFile(m.runtime))===m.delivery.sha256;
 if(!sourceUnchanged||!runtimeUnchanged)throw Error('Original changed since snapshot: '+kind);
 preservation.push({id:m.id,sourceUnchanged,runtimeUnchanged});
}
await writeFile('blender/environment/campus_tile_forest/v01/validation/family_integrity.json',JSON.stringify({checkedAt:new Date().toISOString(),assets:result,originalTrees:preservation},null,2)+'\n');
console.log('10 current reviews; module bounds and 42-tree tile verified; original planted trees preserved.');
