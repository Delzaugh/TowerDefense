import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {blenderExecutable} from '../asset-pipeline/asset.mjs';
const entries=JSON.parse(await readFile('tools/asset-recipes/campus-forest-entries.json','utf8'));
const requested=process.argv.slice(2),blender=await blenderExecutable();
for(const {id} of entries.filter(e=>!requested.length||requested.includes(e.id))){
 const folder=`blender/environment/${id}/v01`;
 // Initial construction only. Later revisions must use the pipeline's guarded --build.
 try{await readFile(folder+'/'+id+'_v01.blend');throw Error('Existing source: use guarded export --build for '+id);}catch(e){if(e.code!=='ENOENT')throw e;}
 const build=spawnSync(blender,['--factory-startup','--background','--python-exit-code','1','--python',folder+'/build.py'],{encoding:'utf8',windowsHide:true});
 await writeFile(folder+'/validation/initial_build.log',build.stdout+build.stderr);if(build.status!==0)throw Error('Build failed: '+id+' '+build.stdout+build.stderr);
 console.log(id+': Blender source saved');
 const result=spawnSync(process.execPath,['tools/asset-pipeline/asset.mjs','export',id],{encoding:'utf8',windowsHide:true});
 await writeFile(folder+'/validation/initial_delivery.log',result.stdout+result.stderr);
 if(result.status!==0)throw Error('Delivery failed: '+id+' '+result.stdout+result.stderr);
 console.log(result.stdout.split('\n').filter(l=>l.includes('Delivered')).join('\n'));
}
