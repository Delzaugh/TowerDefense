const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
const fs=require('node:fs/promises'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||require.resolve('playwright',{paths:[process.cwd(),path.dirname(process.execPath),path.resolve(path.dirname(process.execPath),'..')]}));
(async()=>{
  const {catalog,projectRoot,hash,validateManifest}=await import('../asset-pipeline/contracts.mjs');
  const {createInspectorServer}=await import('./server.mjs'),registeredAssets=await catalog(),assets=[],drafts=[],server=createInspectorServer();
  for(const item of registeredAssets){try{await fs.access(path.join(projectRoot,item.data.runtime));assets.push(item);}catch(error){if(error.code!=='ENOENT'||item.data.delivery)throw error;drafts.push(item);}}
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),output=await fs.mkdtemp(path.join(os.tmpdir(),'tower-catalog-'));
  const probe=path.join(projectRoot,'assets/runtime/environment/unregistered_probe_v01.glb');let created=false;
  try{
    const list=await(await fetch(base+'/api/models')).json();assert.equal(list.length,assets.length);
    for(const draft of drafts)assert(!list.some(a=>a.path===draft.data.runtime.slice('assets/runtime/'.length)));
    assert.throws(()=>validateManifest({...assets[0].data,runtime:'assets/runtime/environment/wrong_identity_v01.glb'}));
    const bytes=await fs.readFile(path.join(projectRoot,assets[0].data.runtime));await fs.writeFile(probe,bytes,{flag:'wx'});created=true;
    assert.equal((await fetch(base+'/runtime/environment/unregistered_probe_v01.glb')).status,404);
    assert(!(await(await fetch(base+'/api/models')).json()).some(m=>m.path.includes('unregistered_probe')));
    for(const route of ['/models/retired.glb','/runtime/models/retired.glb','/api/milestone/problem_bug/v01/0','/blender/source.blend','/third_party/source.glb'])assert.equal((await fetch(base+route)).status,404,route);
    const snapshot=assets.find(a=>a.data.milestones?.length)?.data.milestones[0];if(snapshot)assert.equal((await fetch(base+'/'+snapshot.export)).status,404);
    const page=await browser.newPage({viewport:{width:1280,height:960}}),errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('.glb'))requests.push(new URL(r.url()).pathname);});
    for(const item of assets){
      const m=item.data,registered=list.find(r=>r.contract.id===m.id&&r.contract.version===m.version);assert(registered);assert.equal(registered.path,m.runtime.slice('assets/runtime/'.length));
      assert.equal(hash(await fs.readFile(path.join(projectRoot,m.runtime))),m.delivery.sha256);
      assert.equal(hash(await fs.readFile(path.join(projectRoot,m.source.path))),m.delivery.sourceHash);
      await page.goto(base+'/?asset='+m.id+'&version='+m.version);await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
      const state=await page.evaluate(()=>window.inspectorState());assert.equal(state.activePath,registered.path);assert(state.entries[0].triangles>0);
      if(['copilot_shield','problem_bug','kaykit_windturbine_tall'].includes(m.id))await page.screenshot({path:path.join(output,m.id+'.png')});
    }
    assert.deepEqual(errors,[]);const allowed=new Set(list.map(m=>'/runtime/'+m.path));assert(requests.every(p=>allowed.has(decodeURIComponent(p))));
    await fs.unlink(probe);created=false;
    if(!process.argv.includes('--before-cleanup')){
      async function walk(dir){const files=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())files.push(...await walk(p));else if(e.name.endsWith('.glb'))files.push(path.relative(projectRoot,p).split(path.sep).join('/'));}return files;}
      assert.deepEqual((await walk(path.join(projectRoot,'assets/runtime'))).sort(),assets.map(a=>a.data.runtime).sort());
      for(const directory of await fs.readdir(path.join(projectRoot,'blender'),{withFileTypes:true}))assert(directory.isDirectory()&&['towers','work','enemies','product','environment'].includes(directory.name),'Unexpected source-root entry: '+directory.name);
    }
    console.log(JSON.stringify({passed:true,registered:registeredAssets.length,loaded:assets.length,pendingDrafts:drafts.length,checks:'Catalog-only discovery and serving, identity/path enforcement, source/runtime hashes, all-model browser loads, unregistered-file refusal, retired-route refusal and canonical layout',screenshots:output},null,2));
  }finally{if(created)await fs.unlink(probe);await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
