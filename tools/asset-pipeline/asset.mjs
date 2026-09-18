import { readFile, writeFile, mkdir, copyFile, rename, rm, open, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { projectRoot, resolvePath, existingPath, readJson, hash, catalog, findAsset, validateManifest } from './contracts.mjs';
import { validateExport } from './validate.mjs';
import { verifyPaletteParity } from './palette-parity.mjs';

const json = async (file,value) => writeFile(file,JSON.stringify(value,null,2)+'\n');
async function atomic(file,bytes) {const temp=file+'.pending';await mkdir(path.dirname(file),{recursive:true});await writeFile(temp,bytes);await rename(temp,file);}
export async function blenderExecutable() {
  if(process.env.BLENDER_PATH){await access(process.env.BLENDER_PATH);return process.env.BLENDER_PATH;}
  const candidates=[];
  for(const dir of (process.env.PATH||'').split(path.delimiter)) candidates.push(path.join(dir,process.platform==='win32'?'blender.exe':'blender'));
  if(process.platform==='win32'){
    const base=path.join(process.env.ProgramFiles||'C:/Program Files','Blender Foundation');
    for(const dir of (await readdir(base).catch(()=>[])).sort().reverse())candidates.push(path.join(base,dir,'blender.exe'));
  }else candidates.push('/Applications/Blender.app/Contents/MacOS/Blender');
  for(const file of candidates)try{await access(file);return file;}catch{}
  throw Error('Blender was not found. Set BLENDER_PATH to its executable.');
}
async function runBlender(script,args,env={}) {
  const executable=await blenderExecutable();
  await new Promise((resolve,reject)=>{const child=spawn(executable,['--factory-startup','--background','--python-exit-code','1','--python',script,'--',...args],{cwd:projectRoot,env:{...process.env,...env},windowsHide:true,stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Blender failed ('+code+')')));});
}
export async function milestone(item,label='milestone') {
  if(!/^[a-z0-9_-]+$/.test(label))throw Error('Milestone label: lowercase letters, digits, _ or - only');
  const m=item.data, dir=path.posix.join(path.posix.dirname(item.manifest),'revisions',`r${m.revision}_${label}`);
  await mkdir(path.dirname(resolvePath(dir)),{recursive:true});await mkdir(resolvePath(dir));
  const runtime=dir+'/'+path.posix.basename(m.runtime), source=dir+'/'+path.posix.basename(m.source.path);
  await copyFile(await existingPath(m.runtime),resolvePath(runtime));await copyFile(await existingPath(m.source.path),resolvePath(source));
  await json(resolvePath(dir+'/asset.json'),m);
  const entry={label,revision:m.revision,export:runtime,source,sha256:hash(await readFile(resolvePath(runtime))),sourceHash:hash(await readFile(resolvePath(source)))};
  m.milestones=[...(m.milestones||[]),entry];await json(resolvePath(item.manifest),m);return entry;
}
export async function exportAsset(item,{build=false,palette=false}={}) {
  if(build&&palette)throw Error('Use --palette on the current source; later --build deliveries retain its palette workflow automatically.');
  const m=item.data, folder=path.dirname(resolvePath(item.manifest)), lock=await open(path.join(folder,'.delivery.lock'),'wx').catch(()=>{throw Error('Another delivery owns this asset (.delivery.lock). Check it before retrying.');});
  try {
    const manifestBefore=await readFile(resolvePath(item.manifest));
    const originalSource=await readFile(await existingPath(m.source.path)), sourceHash=hash(originalSource);
    const runtimeFile=resolvePath(m.runtime), originalRuntime=await readFile(runtimeFile).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
    if(build && (!m.source.recipe || sourceHash!==m.source.authoritativeHash))throw Error('Procedural rebuild refused: source differs from recorded authoritative hash, or has no recipe. Inspect and preserve manual changes; use ordinary export for edited .blend files.');
    let next=structuredClone(m);next.revision++;
    const staging=path.join(folder,'.staging',`r${next.revision}_${Date.now()}`);await mkdir(staging,{recursive:true});
    const candidate=path.join(staging,path.basename(m.runtime)), stagedManifest=path.join(staging,'asset.json');await json(stagedManifest,next);
    let source=await existingPath(m.source.path);
    if(build){await runBlender(await existingPath(m.source.recipe),[],{ASSET_BUILD_DIR:staging,ASSET_SOURCE_NAME:path.basename(m.source.path),ASSET_MANIFEST:stagedManifest});source=path.join(staging,path.basename(m.source.path));await access(source);}
    const convertPalette=palette||(build&&m.exportSettings?.paletteTextureWorkflow);
    if(convertPalette){
      if(palette&&!originalRuntime)throw Error('Palette migration requires a delivered runtime baseline');
      if(palette){const baseline=await validateExport(runtimeFile,m,path.join(staging,'baseline'));if(!baseline.passed)throw Error('Baseline validation failed: '+baseline.errors.join('; '));}
      const converted=path.join(staging,path.basename(m.source.path));
      await runBlender(resolvePath('tools/asset-pipeline/palette_texture.py'),[stagedManifest,source,converted,...(build?['--rebuild']:[])]);
      source=converted;next=validateManifest(await readJson(stagedManifest));
    }
    await runBlender(resolvePath('tools/asset-pipeline/blender_export.py'),[stagedManifest,source,candidate]);
    if(palette){const parity=verifyPaletteParity(originalRuntime,await readFile(candidate));await json(path.join(staging,'palette_parity.json'),parity);}
    const report=await validateExport(candidate,next,path.join(staging,'validation'));
    report.sourceHash=hash(await readFile(source));report.source=m.source.path;report.runtime=m.runtime;
    await json(path.join(staging,'validation/report.json'),report);
    if(!report.passed)throw Error('Candidate rejected; runtime preserved. '+report.errors.join('; ')+' Report: '+staging);
    if(hash(await readFile(resolvePath(m.source.path)))!==sourceHash || hash(await readFile(runtimeFile).catch(()=>Buffer.alloc(0)))!==hash(originalRuntime||Buffer.alloc(0)))throw Error('Source/runtime changed during validation; refusing promotion');
    const manifestFile=resolvePath(item.manifest), originalManifest=await readFile(manifestFile);
    if(hash(originalManifest)!==hash(manifestBefore))throw Error('Manifest changed during validation; refusing promotion');
    const evidence=path.join(folder,'validation');await mkdir(evidence,{recursive:true});
    // Snapshot the previous coherent delivery before replacing either payload.
    if(originalRuntime)await milestone(item,'before_r'+next.revision);
    next.milestones=m.milestones;next.source.authoritativeHash=report.sourceHash;
    next.delivery={sha256:report.sha256,sourceHash:report.sourceHash,report:path.relative(projectRoot,path.join(evidence,'report.json')).split(path.sep).join('/'),deliveredAt:new Date().toISOString()};
    try {
      if(build||convertPalette)await atomic(resolvePath(m.source.path),await readFile(source));
      await atomic(runtimeFile,await readFile(candidate));
      for(const name of await readdir(path.join(staging,'validation')))await copyFile(path.join(staging,'validation',name),path.join(evidence,name));
      if(convertPalette)await copyFile(path.join(staging,'palette_source_conversion.json'),path.join(evidence,'palette_source_conversion.json'));
      if(palette){
        await copyFile(path.join(staging,'palette_parity.json'),path.join(evidence,'palette_parity.json'));
        for(const name of await readdir(path.join(staging,'baseline')))await copyFile(path.join(staging,'baseline',name),path.join(evidence,'palette_before_'+name));
      }
      await atomic(manifestFile,JSON.stringify(next,null,2)+'\n');
    }catch(error){await atomic(resolvePath(m.source.path),originalSource);if(originalRuntime)await atomic(runtimeFile,originalRuntime);else await rm(runtimeFile,{force:true});await atomic(manifestFile,originalManifest);throw error;}
    console.log(`Delivered ${m.id} ${m.version} revision ${next.revision}: ${report.triangles} triangles. Visual review remains separate.`);
    return report;
  }finally{await lock.close();await rm(path.join(folder,'.delivery.lock'));}
}
async function scaffold(id,category) {
  if(!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(id||'') || !['enemies','towers','work','product','environment'].includes(category))throw Error('init <snake_case_id> <enemies|towers|work|product|environment>');
  const folder=`blender/${category}/${id}/v01`, manifest=folder+'/asset.json', c=await readJson(resolvePath('assets/asset_catalog.json'));
  if(c.assets.some(a=>a.id===id&&a.version==='v01'))throw Error('Asset already registered');
  const m={schemaVersion:1,id,displayName:id.replaceAll('_',' '),category,version:'v01',revision:1,source:{path:folder+'/'+id+'_v01.blend',mode:'manual'},runtime:`assets/runtime/${category}/${id}_v01.glb`,budgets:{triangles:category==='enemies'||category==='work'?1500:3000,materials:category==='enemies'||category==='work'?1:2,textures:1,textureSize:512,bones:32,meshes:2},contract:{root:'root',up:'+Y',forward:'+Z',metres:true,grounded:true,groundTolerance:.002,rootMotion:false,anchors:[]},clips:[],references:[],overrides:[],milestones:[],decisions:folder+'/decisions.md'};
  validateManifest(m);await mkdir(path.dirname(resolvePath(folder)),{recursive:true});await mkdir(resolvePath(folder));
  for(const d of ['references','validation/screenshots','renders','revisions'])await mkdir(resolvePath(folder+'/'+d),{recursive:true});
  await mkdir(path.dirname(resolvePath(m.runtime)),{recursive:true});await json(resolvePath(manifest),m);
  await writeFile(resolvePath(m.decisions),'# Asset brief and decisions\n\nEstablish silhouette, palette, dimensions, required anchors/clips and references before authoring. Prefer small palette textures; record a vertex-colour exception when it better fits the model. Default scaffold budgets are starting targets, not an approved brief.\n');
  c.assets.push({id,version:'v01',manifest});await json(resolvePath('assets/asset_catalog.json'),c);console.log('Created '+manifest+'; complete the brief before authoring.');
}
export async function previewUrl(item, launch=true) {
  for(let port=4174;port<=4184;port++)try{const response=await fetch('http://127.0.0.1:'+port+'/api/health',{signal:AbortSignal.timeout(400)});const health=await response.json();if(health.service==='tower-asset-inspector' && health.protocol===4 && health.workspace===hash(Buffer.from(projectRoot)))return `http://127.0.0.1:${port}/?asset=${item.data.id}&version=${item.data.version}`;}catch{}
  if(launch){
    const child=spawn(process.execPath,[resolvePath('tools/asset-inspector/server.mjs')],{cwd:projectRoot,detached:true,windowsHide:true,stdio:'ignore'});child.unref();
    for(let attempt=0;attempt<10;attempt++){await new Promise(resolve=>setTimeout(resolve,300));try{return await previewUrl(item,false);}catch{}}
  }
  throw Error('No compatible inspector responded. Start node tools/asset-inspector/server.mjs to see its diagnostic output.');
}
async function main() {
  const [command,id,arg,...rest]=process.argv.slice(2);
  if(command==='init')return scaffold(id,arg);
  if(command==='check'){for(const a of await catalog()){await existingPath(a.data.source.path);await existingPath(a.data.runtime);console.log(a.id+' '+a.version+' — contract and paths valid');}return;}
  const item=await findAsset(id,arg?.startsWith('v')?arg:'v01');
  if(command==='export')return exportAsset(item,{build:[arg,...rest].includes('--build'),palette:[arg,...rest].includes('--palette')});
  if(command==='milestone')return console.log(await milestone(item,arg||'milestone'));
  if(command==='preview')return console.log(await previewUrl(item));
  if(command==='validate'||command==='render'){
    const report=await validateExport(await existingPath(item.data.runtime),item.data,path.join(path.dirname(resolvePath(item.manifest)),'validation'));
    report.sourceHash=hash(await readFile(await existingPath(item.data.source.path)));report.source=item.data.source.path;report.runtime=item.data.runtime;
    if(item.data.delivery && (report.sha256!==item.data.delivery.sha256 || report.sourceHash!==item.data.delivery.sourceHash)){report.errors.push('Files differ from the last synchronized delivery');report.passed=false;}
    await json(path.join(path.dirname(resolvePath(item.manifest)),'validation/report.json'),report);
    console.log(JSON.stringify({passed:report.passed,triangles:report.triangles,errors:report.errors}));if(!report.passed)process.exitCode=1;return;
  }
  throw Error('Commands: init, check, export [--build|--palette], validate, render, milestone, preview. See README.');
}
if(process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)main().catch(e=>{console.error(e.message);process.exitCode=1;});
