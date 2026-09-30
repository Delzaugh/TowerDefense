// First authoring save only: recipes write staging, existing editable sources are never replaced.
import {readFile,writeFile,copyFile,mkdir,access} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {blenderExecutable} from '../asset-pipeline/asset.mjs';
const ids=process.argv.slice(2);
const executable=await blenderExecutable();
for(const id of ids){
 if(!/^gh_[a-z_]+$/.test(id))throw Error('Only new GitHub kit sources are in scope');
 const folder=path.resolve(`blender/environment/${id}/v01`),manifest=path.join(folder,'asset.json');
 const data=JSON.parse(await readFile(manifest,'utf8')),source=path.resolve(data.source.path);
 try{await access(source);console.log(`${id}: source exists, bootstrap skipped`);continue;}catch{}
 const staging=path.join(folder,'.staging','initial_authoring');await mkdir(staging,{recursive:true});
 await new Promise((resolve,reject)=>{
  const child=spawn(executable,['--factory-startup','--background','--python-exit-code','1','--python',path.resolve(data.source.recipe)],{windowsHide:true,stdio:'inherit',env:{...process.env,ASSET_BUILD_DIR:staging,ASSET_SOURCE_NAME:path.basename(source),ASSET_MANIFEST:manifest}});
  child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`Blender authoring failed for ${id}`)));
 });
 await copyFile(path.join(staging,path.basename(source)),source,1);
 console.log(`${id}: first editable source saved; use ordinary guarded export`);
}
