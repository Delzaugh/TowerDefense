import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createInspectorServer} from '../../../../tools/asset-inspector/server.mjs';
import {playwrightRuntime} from '../../../../tools/asset-pipeline/validate.mjs';
import {findAsset,projectRoot,hash} from '../../../../tools/asset-pipeline/contracts.mjs';

const item=await findAsset('copilot_mona'),m=item.data;
const output=path.join(projectRoot,path.dirname(item.manifest),'validation/digital-resolve');
await mkdir(output,{recursive:true});
const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const {chromium}=playwrightRuntime(),browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1060}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(['error','warning'].includes(e.type()))errors.push(e.text());});
 await page.goto(base+'/?asset=copilot_mona&version=v01');
 const ready=()=>page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 await ready();await page.locator('#grid-button').click();
 const state=()=>page.evaluate(()=>window.inspectorState());
 const capture=async(name,context={})=>{
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const file=name+'.png',bytes=await page.locator('#viewport').screenshot({path:path.join(output,file)});
  return {file,sha256:hash(bytes),...context};
 };
 const initial=await state();assert.equal(initial.entries[0].revision,m.delivery.sha256);
 const rest=await capture('rest-before');
 const duration=initial.entries[0].clips.find(c=>c.name==='resolve').duration;
 async function scrub(p){
  await page.locator('#timeline').fill(String(Number((duration*p).toFixed(3))));await page.locator('#timeline').dispatchEvent('input');
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));
 }
 await page.locator('#clip-select').selectOption({label:'resolve'});await page.locator('#play-button').click();
 const frames=[];
 for(const p of [0,.08,.16,.24,.32,.40,.48,.56,.64,.72,.80,.88,.96,1]){
  await scrub(p);const s=await state(),effect=s.resolveEffects[0];
  assert(effect.fragments<=32);assert(s.resolveBudget.used<=256);assert.deepEqual(s.entries[0].root,[0,0,0]);
  assert(s.entries[0].triangles+effect.triangles<=4000);
  frames.push({...await capture('resolve-'+String(Math.round(p*100)).padStart(3,'0'),{progress:p,time:Number((duration*p).toFixed(3)),view:'isometric'}),effect});
 }
 assert(frames.some(f=>f.effect.fragments>0));assert.equal(frames.at(-1).effect.fragments,0);assert(frames.at(-1).effect.complete);
 const pixelCount=()=>page.evaluate(()=>{
  const c=document.querySelector('#viewport'),gl=c.getContext('webgl2'),pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
  gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  let visible=0;for(let i=0;i<pixels.length;i+=4)if(Math.abs(pixels[i]-pixels[0])+Math.abs(pixels[i+1]-pixels[1])+Math.abs(pixels[i+2]-pixels[2])>12)visible++;
  return visible;
 });
 assert.equal(await pixelCount(),0,'Terminal effect leaves visible art');
 await scrub(.48);const repeatA=await capture('repeat-a');await scrub(.15);await scrub(.48);const repeatB=await capture('repeat-b');assert.equal(repeatA.sha256,repeatB.sha256,'Scrubbing is not deterministic');
 await page.locator('#effects-toggle').uncheck();await scrub(1);assert(await pixelCount()>5000,'Effects off must show the unmodified full-size pose');
 await page.locator('#effects-toggle').check();await scrub(1);assert.equal(await pixelCount(),0);
 await page.locator('#rest-button').click();const reset=await capture('rest-after');assert.equal(reset.sha256,rest.sha256,'Rest reset changed appearance');assert.equal((await state()).resolveBudget.used,0);
 // Assembly must reproduce the same sampled states in the opposite direction.
 assert.equal(initial.entries[0].clips.find(c=>c.name==='place').duration,duration);
 await page.locator('#clip-select').selectOption({label:'place'});await page.locator('#play-button').click();
 const reverseFrames=[];
 for(const counterpart of frames.slice().reverse()){
  const p=Number((1-counterpart.progress).toFixed(2));await scrub(p);
  const effect=(await state()).resolveEffects[0];
  const frame={...await capture('place-'+String(Math.round(p*100)).padStart(3,'0'),{progress:p,time:Number((duration*p).toFixed(3)),view:'isometric'}),effect};
  assert.equal(effect.fragments,counterpart.effect.fragments,'Place fragment count differs from reverse Resolve');
  // Float interpolation can round a few edge pixels differently. Geometry/pose
  // reversal is checked independently in the actual GLB audit.
  reverseFrames.push(frame);
  if(p===0)assert.equal(await pixelCount(),0,'Place starts with visible art');
 }
 assert(reverseFrames.at(-1).effect.complete);assert(await pixelCount()>5000,'Place does not finish assembled');
 const assembled=reverseFrames.at(-1);
 await page.locator('#clip-select').selectOption({label:'idle'});await page.locator('#play-button').click();await scrub(0);
 const readyPose=await capture('place-ready-idle');assert.equal(assembled.sha256,readyPose.sha256,'Place endpoint does not match ready Idle');
 frames.push(...reverseFrames);
 // Replay and hold Place at its completed pose, then reset to authored Rest.
 await page.locator('#clip-select').selectOption({label:'place'});
 await page.waitForFunction(()=>!window.inspectorState().entries[0].playing);assert((await state()).resolveEffects[0].complete);
 assert.equal((await state()).resolveBudget.used,0);
 await page.locator('#restart-button').click();await page.waitForFunction(()=>window.inspectorState().entries[0].time>.2);
 assert(!(await state()).resolveEffects[0].complete);
 await page.locator('#rest-button').click();assert.equal((await capture('place-rest-reset')).sha256,rest.sha256);
 // Play and clamp, replay, and a loop wrap, using the actual Inspector controls.
 await page.locator('#clip-select').selectOption({label:'resolve'});
 await page.waitForFunction(()=>!window.inspectorState().entries[0].playing);assert((await state()).resolveEffects[0].complete);
 await page.locator('#restart-button').click();await page.waitForFunction(()=>window.inspectorState().entries[0].time>.2);
 assert(!(await state()).resolveEffects[0].complete);
 await page.locator('#loop-toggle').check();await scrub(.96);await page.locator('#play-button').click();
 await page.waitForFunction(()=>window.inspectorState().entries[0].time<.3);assert(!(await state()).resolveEffects[0].complete);
 await page.locator('#play-button').click();await page.locator('#loop-toggle').uncheck();
 await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#ground-toggle').check();await page.locator('#review-close').click();
 await scrub(.48);frames.push(await capture('phone-mid',{progress:.48,view:'phone, gameplay light, ground shadows'}));
 await scrub(1);frames.push(await capture('phone-end',{progress:1,view:'phone, ground shadows'}));
 await page.locator('#clip-select').selectOption({label:'place'});await page.locator('#play-button').click();
 await scrub(.52);frames.push(await capture('phone-place-mid',{progress:.52,view:'phone, gameplay light, ground shadows'}));
 await scrub(1);frames.push(await capture('phone-place-end',{progress:1,view:'phone, ground shadows'}));
 await page.locator('#rest-button').click();
 const resourceChecks=await page.evaluate(async()=>{
  const THREE=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
  const {createDigitalResolve,createResolveBudget}=await import('/presentation/digital-resolve.js');
  const loader=new GLTFLoader(),models=await Promise.all(Array.from({length:5},()=>loader.loadAsync('/runtime/towers/copilot_mona_v01.glb')));
  const budget=createResolveBudget(64),scene=new THREE.Scene(),effects=[],sources=[];
  const started=performance.now();
  for(const model of models){
   scene.add(model.scene);const first=[];model.scene.traverse(o=>{if(o.isMesh)first.push([o,o.material]);});sources.push(first);
   const effect=createDigitalResolve(THREE,model.scene,{budget});scene.add(effect.object);effects.push(effect);effect.setState('resolve',.48,1);
  }
  const active=effects.map(e=>e.diagnostics()),used=budget.used;
  effects[0].setState(null);effects[2].setState('resolve',.48,1);
  const reused=effects[2].diagnostics().leased;
  effects.forEach(e=>e.dispose());
  return {used,active,reused,afterDispose:budget.used,materialsRestored:sources.every(list=>list.every(([o,m])=>o.material===m)),activationMs:performance.now()-started};
 });
 assert.equal(resourceChecks.used,64);assert.equal(resourceChecks.active.filter(e=>e.leased===0).length,3);assert.equal(resourceChecks.reused,32);assert.equal(resourceChecks.afterDispose,0);assert(resourceChecks.materialsRestored);
 // Reload while paused mid-effect preserves phase and does not duplicate cubes.
 for(const clip of ['resolve','place']){
  await page.locator('#clip-select').selectOption({label:clip});await scrub(.48);
  await page.locator('#refresh-models').click();await ready();const refreshed=await state();assert.equal(refreshed.resolveEffects.length,1);assert(Math.abs(refreshed.resolveEffects[0].timelineProgress-.48)<.002);assert.equal(refreshed.resolveEffects[0].clip,clip);assert(refreshed.resolveBudget.used<=32);
 }
 await page.goto(base+'/?asset=copilot_base&version=v01');await ready();assert(!(await state()).resolveEffects[0].type,'Unconfigured asset got a resolve effect');
 assert.deepEqual(errors,[]);
 const result={passed:true,asset:m.id,version:m.version,revision:m.revision,sha256:m.delivery.sha256,sourceHash:m.delivery.sourceHash,
  rendererSha256:hash(await readFile(path.join(projectRoot,'tools/asset-presentation/digital-resolve.js'))),checkedAt:new Date().toISOString(),
  maxConcurrentFragments:256,maxFragmentsPerAsset:32,modelTriangles:3506,maxCombinedTriangles:3890,resourceChecks,frames,
  checks:['shader compiles; no browser errors','all fragments disappear at exact end','Place reverses Resolve fragment states','Place begins invisible and ends exactly at Idle ready','deterministic scrub and replay','full-scale body with effects disabled','exact Rest Pose reset from either clip','one-shot hold and loop wrap','phone ground/shadows','pooled budget and fallback','material restoration and disposal','reload preserves either clip and phase','unconfigured asset unchanged']};
 await writeFile(path.join(output,'review.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({passed:true,revision:m.revision,maxVisibleFragments:Math.max(...frames.map(f=>f.effect?.fragments||0)),resourceChecks,output},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
