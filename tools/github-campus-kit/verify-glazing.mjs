import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {findAsset,validateManifest,resolvePath} from '../asset-pipeline/contracts.mjs';
import {validateExport} from '../asset-pipeline/validate.mjs';
const item=await findAsset('gh_atrium','v01');const original=item.data;
const out='artifacts/github-campus/glazing-policy';await mkdir(out,{recursive:true});
const results=[];
for(const [name,overrides,expected] of [
 ['named-exception',original.overrides,true],
 ['no-exception',[],false],
 ['wrong-name',original.overrides.map(o=>({...o,material:o.material+'_unmatched'})),false]
]){
 const m={...original,overrides};const report=await validateExport(resolvePath(m.runtime),m,resolvePath(out+'/'+name));
 assert.equal(report.passed,expected,name);
 if(!expected)assert(report.errors.some(e=>e.includes('Transparent material without named')));
 results.push({name,passed:true,exportAccepted:report.passed,errors:report.errors});
}
for(const [name,change] of [
 ['blank-reason',{overrides:original.overrides.map(o=>({...o,reason:''}))}],
 ['duplicate-material',{overrides:[...original.overrides,...original.overrides]}],
 ['animated-asset',{clips:[{name:'idle',playback:'loop',fps:30,meaning:'Test policy category restriction'}]}],
 ['other-category',{category:'product'}]
]){
 assert.throws(()=>validateManifest({...original,...change}),name==='blank-reason'?/design reason/:name==='duplicate-material'?/unique materials/:/static environment assets/);
 results.push({name,passed:true,manifestAccepted:false});
}
await writeFile(out+'/verification.json',JSON.stringify({passed:true,results},null,2)+'\n');
console.log(JSON.stringify({passed:true,cases:results.length,meaning:'Actual glass GLB accepted only with its named exception; default and wrong selectors still fail, restrictions checked.'}));
