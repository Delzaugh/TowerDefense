import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,cp,access} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {catalog,resolvePath,hash} from './contracts.mjs';
import {verifyPaletteParity,glbDocument} from './palette-parity.mjs';

const converted=[];for(const a of await catalog()){try{await access(resolvePath(path.posix.dirname(a.manifest)+'/validation/palette_visual_report.json'));converted.push(a);}catch{}}
for(const item of converted){
 const folder=path.posix.dirname(item.manifest),visual=JSON.parse(await readFile(resolvePath(folder+'/validation/palette_visual_report.json')));
 const milestone=item.data.milestones.find(s=>s.label==='before_r'+visual.revision);
 assert(milestone,'Missing pre-conversion milestone');
 const reviewedRuntime=item.data.delivery.sha256===visual.sha256?item.data.runtime:item.data.milestones.find(s=>s.sha256===visual.sha256)?.export;
 assert(reviewedRuntime,'Missing reviewed conversion snapshot: '+item.id);
 const before=await readFile(resolvePath(milestone.export)),after=await readFile(resolvePath(reviewedRuntime));
 assert.equal(hash(after),visual.sha256);
 verifyPaletteParity(before,after);
 // A one-byte vertex edit must fail even if all budgets still pass.
 const changed=Buffer.from(after),{g}=glbDocument(changed),primitive=g.meshes[0].primitives[0],a=g.accessors[primitive.attributes.POSITION],v=g.bufferViews[a.bufferView];
 changed[28+changed.readUInt32LE(12)+(v.byteOffset||0)+(a.byteOffset||0)]^=1;
 assert.throws(()=>verifyPaletteParity(before,changed),/Attribute changed: POSITION/);
}

// Test a full migration and subsequent recipe rebuild in a disposable project.
const fixture=await mkdtemp(path.join(os.tmpdir(),'tower-palette-migration-'));
const item=converted.find(a=>a.id==='problem_bug'),m=item.data;
const visual=JSON.parse(await readFile(resolvePath(path.posix.dirname(item.manifest)+'/validation/palette_visual_report.json')));
const milestone=m.milestones.find(s=>s.label==='before_r'+visual.revision);
const original=JSON.parse(await readFile(resolvePath(path.posix.dirname(milestone.source)+'/asset.json')));
await cp(resolvePath('tools/asset-pipeline'),path.join(fixture,'tools/asset-pipeline'),{recursive:true});
await cp(resolvePath('tools/asset-inspector/vendor'),path.join(fixture,'tools/asset-inspector/vendor'),{recursive:true});
await cp(resolvePath('tools/asset-inspector/review.js'),path.join(fixture,'tools/asset-inspector/review.js'));
await mkdir(path.join(fixture,path.posix.dirname(item.manifest)),{recursive:true});
await mkdir(path.join(fixture,path.posix.dirname(m.runtime)),{recursive:true});
for(const [src,dest] of [[milestone.source,m.source.path],[milestone.export,m.runtime],[m.source.recipe,m.source.recipe]])await cp(resolvePath(src),path.join(fixture,dest));
await writeFile(path.join(fixture,item.manifest),JSON.stringify(original));
await writeFile(path.join(fixture,'assets/asset_catalog.json'),JSON.stringify({schemaVersion:1,assets:[{id:m.id,version:m.version,manifest:item.manifest}]}));
async function run(args,fail=false,id=m.id){return new Promise((resolve,reject)=>{const p=spawn(process.execPath,['tools/asset-pipeline/asset.mjs','export',id,...args],{cwd:fixture,windowsHide:true,stdio:'pipe'});let log='';p.stdout.on('data',c=>log+=c);p.stderr.on('data',c=>log+=c);p.on('error',reject);p.on('exit',code=>(fail?code!==0:code===0)?resolve(log):reject(Error(log)));});}
await run(['--palette']);
const tracked=[item.manifest,m.source.path,m.runtime],fingerprints=async()=>Promise.all(tracked.map(async f=>hash(await readFile(path.join(fixture,f)))));
const before=await fingerprints();assert.match(await run(['--palette'],true),/Expected source colour data|PaletteUV already exists/);assert.deepEqual(await fingerprints(),before);
await run(['--build']);
const rebuilt=JSON.parse(await readFile(path.join(fixture,item.manifest))),{g}=glbDocument(await readFile(path.join(fixture,m.runtime)));
assert.equal(rebuilt.palette.storage,'texture');assert(rebuilt.texturePalettes.length);
assert(g.meshes.every(mesh=>mesh.primitives.every(p=>p.attributes.COLOR_0===undefined&&g.materials[p.material].pbrMetallicRoughness.baseColorTexture)));
assert.equal(JSON.parse(await readFile(path.join(fixture,rebuilt.delivery.report))).passed,true);
// Derived campus Lab rebuilds from the already textured study source.
const lab=(await catalog()).find(a=>a.id==='campus_lab');
if(lab){
 const study=(await catalog()).find(a=>a.id==='campus_home_study');
 for(const asset of [lab,study]){
  await mkdir(path.join(fixture,path.posix.dirname(asset.manifest)),{recursive:true});
  await mkdir(path.join(fixture,path.posix.dirname(asset.data.runtime)),{recursive:true});
  for(const file of [asset.manifest,asset.data.source.path,asset.data.runtime,asset.data.source.recipe])await cp(resolvePath(file),path.join(fixture,file));
 }
 await cp(resolvePath('tools/asset-recipes/campus-kit.py'),path.join(fixture,'tools/asset-recipes/campus-kit.py'),{recursive:true});
 await writeFile(path.join(fixture,'assets/asset_catalog.json'),JSON.stringify({schemaVersion:1,assets:[{id:lab.id,version:lab.version,manifest:lab.manifest}]}));
 await run(['--build'],false,lab.id);
 const result=JSON.parse(await readFile(path.join(fixture,lab.manifest))),{g}=glbDocument(await readFile(path.join(fixture,result.runtime)));
 assert.equal(result.palette.storage,'texture');assert.equal(result.texturePalettes.length,1);
 assert(g.meshes.every(mesh=>mesh.primitives.every(p=>p.attributes.COLOR_0===undefined)));
 assert.equal(JSON.parse(await readFile(path.join(fixture,result.delivery.report))).passed,true);
}
console.log(JSON.stringify({passed:true,converted:converted.length,checks:'All migrated runtime invariants, deliberate vertex-change rejection, isolated source migration, failed double-conversion preservation, texture-preserving procedural and inherited-texture rebuilds',fixture},null,2));
