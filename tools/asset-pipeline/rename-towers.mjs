// One-time, byte-preserving asset identity migration requested 2026-09-26.
// Folder/file renames are applied with the checked PowerShell plan; this script
// prepares the plan, updates text references, and verifies the preserved payloads.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {projectRoot, catalog} from './contracts.mjs';
import {reviewAsset} from './visual-review.mjs';

const names = {
  github_mona_head:'copilot_mona_head',
  golden_compiler:'copilot_golden_compiler',
  bert_breugelmans:'copilot_bert_breugelmans',
  github_octocat_classic:'copilot_octocat_classic',
  github_octocat_modern:'copilot_octocat_modern',
  github_octocat_classic_lowpoly:'copilot_octocat_classic_lowpoly',
  linter_agent:'copilot_linter',
  human_developer:'copilot_human_developer',
};
const directory = 'output/tower-naming-2026-09-26';
const absolute = p => path.join(projectRoot, p);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const read = async p => JSON.parse(await fs.readFile(absolute(p),'utf8'));
const write = async (p, value) => { await fs.mkdir(path.dirname(absolute(p)),{recursive:true}); await fs.writeFile(absolute(p),JSON.stringify(value,null,2)+'\n'); };
const pattern = new RegExp(`(?<![A-Za-z0-9_])(${Object.keys(names).sort((a,b)=>b.length-a.length).join('|')})(?=_v\\d{2}(?:\\b|_)|[^A-Za-z0-9_]|$)`, 'g');
const replace = text => text.replace(pattern, id => names[id]);
const skip = new Set(['.git','node_modules','revisions','.staging','review_history','archive','previews','dist','test-results','artifacts','output','third_party','__pycache__','references']);
const textExtensions = new Set(['.json','.md','.py','.mjs','.cjs','.js','.ts','.tsx','.html','.ps1','.txt']);
async function files(folder, historical=false) {
  const result=[];
  for (const entry of await fs.readdir(absolute(folder),{withFileTypes:true})) {
    const relative = path.posix.join(folder,entry.name);
    if (entry.isSymbolicLink()) throw Error('Inspect linked asset path before moving: '+relative);
    if (entry.isDirectory()) {
      if (historical || (!skip.has(entry.name) && !entry.name.startsWith('palette_migration_r'))) result.push(...await files(relative,historical));
    } else if (entry.isFile()) result.push(relative);
  }
  return result;
}

const mode=process.argv[2];
if(mode==='prepare') {
  await assert.rejects(fs.access(absolute(directory+'/plan.json')), /ENOENT/, 'A migration plan already exists.');
  const items=await catalog(), entries=[], renames=[];
  for(const [oldId,newId] of Object.entries(names)) {
    const matches=items.filter(item=>item.id===oldId);
    assert(matches.length, 'Missing registered source identity: '+oldId);
    const from='blender/towers/'+oldId, to='blender/towers/'+newId;
    await assert.rejects(fs.access(absolute(to)),/ENOENT/);
    for(const file of await files(from,true)) {
      const name=path.posix.basename(file), newName=replace(name);
      if(name!==newName) renames.push({from:file.replace(from+'/',to+'/'),to:path.posix.join(path.posix.dirname(file.replace(from+'/',to+'/')),newName)});
    }
    for(const item of matches) {
      const m=item.data;
      assert.equal(m.category,'towers');
      const sourceHash=digest(await fs.readFile(absolute(m.source.path)));
      const runtimeHash=digest(await fs.readFile(absolute(m.runtime)));
      assert.equal(runtimeHash,m.delivery.sha256,'Existing runtime hash is not synchronized: '+oldId);
      const beforeReview=await reviewAsset(item);
      entries.push({oldId,newId,version:m.version,revision:m.revision,oldManifest:item.manifest,newManifest:replace(item.manifest),oldSource:m.source.path,newSource:replace(m.source.path),oldRuntime:m.runtime,newRuntime:replace(m.runtime),sourceHash,runtimeHash,beforeReview});
      renames.push({from:m.runtime,to:replace(m.runtime)});
    }
  }
  const edits=[];
  const roots=['assets','blender','docs','design','game/src','game/build','game/tests','tools','prototypes'];
  for(const root of roots) for(const file of await files(root)) {
    if(!textExtensions.has(path.extname(file)) || file==='tools/asset-pipeline/rename-towers.mjs')continue;
    const before=await fs.readFile(absolute(file),'utf8');
    let after=replace(before);
    // These strings are Blender component families, not registered asset IDs.
    if (/blender\/towers\/_shared\/persona_(?:geometry(?:_initial)?|quality)\.py$/.test(file)) {
      after=after.replaceAll("kind=='copilot_linter'", "kind=='linter_agent'").replaceAll("kind!='copilot_linter'", "kind!='linter_agent'");
    }
    if(before===after)continue;
    await fs.mkdir(path.dirname(absolute(directory+'/before/'+file)),{recursive:true});
    await fs.writeFile(absolute(directory+'/before/'+file),before);
    const destination=replace(file);
    await fs.mkdir(path.dirname(absolute(directory+'/after/'+destination)),{recursive:true});
    await fs.writeFile(absolute(directory+'/after/'+destination),after);
    edits.push({beforePath:file,afterPath:destination,beforeHash:digest(Buffer.from(before)),afterHash:digest(Buffer.from(after))});
  }
  await write(directory+'/plan.json',{names,entries,folders:Object.entries(names).map(([a,b])=>({from:'blender/towers/'+a,to:'blender/towers/'+b})),renames,edits});
  console.log(JSON.stringify({assets:entries.length,folders:Object.keys(names).length,fileRenames:renames.length,textUpdates:edits.length}));
} else if(mode==='references') {
  const plan=await read(directory+'/plan.json');
  for(const edit of plan.edits) {
    const current=await fs.readFile(absolute(edit.afterPath));
    assert.equal(digest(current),edit.beforeHash,'File changed during migration: '+edit.afterPath);
    await fs.writeFile(absolute(edit.afterPath),await fs.readFile(absolute(directory+'/after/'+edit.afterPath)));
  }
  // Current review evidence may include JSON reports whose identity/path text
  // changed. Refresh only those file hashes; preserve findings and acceptance.
  for(const item of plan.entries) {
    const folder=path.posix.dirname(item.newManifest), reviewPath=folder+'/validation/visual_review.json';
    const m=await read(item.newManifest);
    m.identityHistory=[...(m.identityHistory||[]),{previousId:item.oldId,renamedAt:'2026-09-26',reason:'User requested the copilot_ prefix for every registered tower asset.',sourceAndRuntimeBytesPreserved:true}];
    await write(item.newManifest,m);
    const review=await read(reviewPath).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
    if(review) {
      for(const evidence of review.evidence||[]) evidence.sha256=digest(await fs.readFile(absolute(evidence.path)));
      await write(reviewPath,review);
    }
    await fs.appendFile(absolute(m.decisions),`\n## Registered tower naming — 2026-09-26\n\nUser requested the \`copilot_\` prefix for all tower assets. Renamed\n\`${item.oldId}\` to \`${item.newId}\`, with matching catalog, manifest,\nBlender source and runtime paths. Source and GLB bytes are unchanged; geometry,\nmaterials, rig, animation and artistic acceptance retain their previous state.\nHistorical snapshots keep their original recorded identities; their containing\nfolder and asset filenames have moved with this asset. Existing internal Blender\ncomponent/material names and provenance tags remain stable.\n`);
  }
  console.log('Updated active references, metadata and current review evidence paths.');
} else if(mode==='verify') {
  const plan=await read(directory+'/plan.json'), items=await catalog(), checked=[];
  assert(items.filter(i=>i.data.category==='towers').every(i=>i.id.startsWith('copilot_')));
  for(const entry of plan.entries) {
    const item=items.find(i=>i.id===entry.newId&&i.version===entry.version);
    assert(item);
    assert.equal(digest(await fs.readFile(absolute(item.data.source.path))),entry.sourceHash);
    assert.equal(digest(await fs.readFile(absolute(item.data.runtime))),entry.runtimeHash);
    for(const milestone of item.data.milestones||[]) for(const key of ['source','export']) await fs.access(absolute(milestone[key]));
    const afterReview=await reviewAsset(item);
    if(entry.beforeReview.ready) assert(afterReview.ready,entry.newId+': '+afterReview.errors.join('; '));
    else assert(afterReview.errors.length<=entry.beforeReview.errors.length,'Review regressed: '+entry.newId);
    checked.push({oldId:entry.oldId,id:entry.newId,version:entry.version,source:item.data.source.path,runtime:item.data.runtime,sourceHash:entry.sourceHash,sha256:entry.runtimeHash,payloadsUnchanged:true,reviewWasReady:entry.beforeReview.ready,reviewReady:afterReview.ready,reviewErrors:afterReview.errors});
  }
  await write('assets/tower_naming_migration.json',{completedAt:new Date().toISOString(),scope:'All registered towers use copilot_ asset IDs.',payloadsUnchanged:true,towerVersions:items.filter(i=>i.data.category==='towers').length,renamed:checked});
  console.log(JSON.stringify({passed:true,renamed:checked.length,towerVersions:items.filter(i=>i.data.category==='towers').length,sourceAndRuntimeBytesPreserved:true,reviewsPreserved:true}));
} else throw Error('Use prepare, references or verify.');
