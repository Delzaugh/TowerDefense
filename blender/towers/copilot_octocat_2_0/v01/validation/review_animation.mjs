import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createInspectorServer} from '../../../../../tools/asset-inspector/server.mjs';
import {playwrightRuntime} from '../../../../../tools/asset-pipeline/validate.mjs';
import {findAsset,projectRoot,hash} from '../../../../../tools/asset-pipeline/contracts.mjs';
const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const {chromium}=playwrightRuntime(),browser=await chromium.launch({channel:'msedge',headless:true});
try {for(const id of ['copilot_octocat_2_0','copilot_octocat_2_0_lowpoly']){
 const item=await findAsset(id),m=item.data,folder=path.posix.dirname(item.manifest),out=folder+'/validation/animation';
 await fs.mkdir(out,{recursive:true});const page=await browser.newPage({viewport:{width:1120,height:980}}),errors=[],frames=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?asset='+id+'&version=v01');
 const ready=()=>page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 await ready();const state=()=>page.evaluate(()=>window.inspectorState());
 await page.addStyleTag({content:'.stage-hint {visibility:hidden}'});
 assert.equal((await state()).entries[0].revision,m.delivery.sha256);
 await page.locator('#grid-button').click();
 async function capture(name,context={}){
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const file=out+'/'+name+'.png',bytes=await page.locator('#viewport').screenshot({path:file});
  const s=await state();frames.push({path:file,sha256:hash(bytes),view:s.view,clip:s.entries[0].clip,time:s.entries[0].time,...context});return hash(bytes);
 }
 async function pause(){if((await state()).entries[0].playing)await page.locator('#play-button').click();}
 async function select(clip){await page.locator('#clip-select').selectOption({label:clip});await pause();}
 async function scrub(p){const s=await state(),d=s.entries[0].clips.find(c=>c.name===s.entries[0].clip).duration;await page.locator('#timeline').evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},d*p);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
 await page.locator('[data-view="iso"]').click();const rest=await capture('rest');
 for(const clip of ['idle','work','move','run','hit','place','resolve']){
  await select(clip);
  for(const p of [0,.2,.4,.6,.8,1]){await scrub(p);await capture(clip+'-'+Math.round(p*100),{progress:p});const s=await state();assert.deepEqual(s.entries[0].root,[0,0,0]);if(p===1&&['place','resolve'].includes(clip)){assert.equal(s.entries[0].time,s.entries[0].clips.find(c=>c.name===clip).duration);assert(s.resolveEffects[0].complete);}}
 }
 assert.equal(frames.find(f=>f.path.endsWith('/place-100.png')).sha256,frames.find(f=>f.path.endsWith('/idle-0.png')).sha256,'Place endpoint differs from ready Idle');
 // Full walk cycle, with the actual floor enabled and intermediate bends exposed.
 await page.locator('#review-open').click();await page.locator('#ground-toggle').check();await page.locator('#review-close').click();
 await select('move');
 for(let i=0;i<24;i++){await scrub(i/24);await capture('walk-'+String(i).padStart(2,'0'),{progress:i/24});}
 await select('run');
 for(let i=0;i<24;i++){await scrub(i/24);await capture('run-frame-'+String(i).padStart(2,'0'),{progress:i/24});}
 for(const clip of ['move','run']){await select(clip);for(const view of ['front','rear','right','bottom']){await page.locator(`[data-view="${view}"]`).click();await scrub(.45);await capture(clip+'-bend-'+view);}}
 await page.locator('[data-view="iso"]').click();
 for(const clip of ['idle','work','move','run']){
  await select(clip);await scrub(.98);await page.locator('#play-button').click();
  await page.waitForFunction(()=>window.inspectorState().entries[0].time<.3);
  await page.waitForTimeout(2600);assert((await state()).entries[0].playing);await capture('playing-'+clip);await pause();
 }
 // Transitions use real Inspector selection, then scrub the receiving pose.
 for(const clip of ['idle','work','idle','move','run','move','idle','hit','idle']){await select(clip);await scrub(.2);}
 await page.locator('#review-open').click();await page.locator('#ground-toggle').uncheck();await page.locator('#review-close').click();
 const visible=()=>page.evaluate(()=>{const c=document.querySelector('#viewport'),gl=c.getContext('webgl2'),a=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,a);let n=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-a[0])+Math.abs(a[i+1]-a[1])+Math.abs(a[i+2]-a[2])>12)n++;return n;});
 const pixels=()=>page.evaluate(()=>{const c=document.querySelector('#viewport'),gl=c.getContext('webgl2'),a=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,a);return Array.from(a);});
 const seekComparisons=[];
 for(const clip of ['resolve','place']){
  await select(clip);await scrub(clip==='resolve'?1:0);assert.equal(await visible(),0,clip+' invisibility');
  await scrub(.48);await capture(clip+'-repeat-a');const a=await pixels();await scrub(.2);await scrub(.48);await capture(clip+'-repeat-b');const b=await pixels();
  let changed=0,maxChannelDifference=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d)changed++;maxChannelDifference=Math.max(maxChannelDifference,d);}
  // Bone/morph evaluation can round one GPU channel by one byte. Reject
  // changed silhouettes or coverage, while allowing this measured noise.
  assert(maxChannelDifference<=1&&changed/a.length<.0001);seekComparisons.push({clip,changedChannels:changed,maxChannelDifference,channelCount:a.length});
  const s=await state(),fx=s.resolveEffects[0];assert(fx.fragments>0);assert(fx.fragments<=m.presentation.resolve.maxFragments);
  assert(s.entries[0].triangles+fx.triangles<=m.animationDesign.maxCombinedTriangles);
  await page.locator('#refresh-models').click();await ready();assert(Math.abs((await state()).resolveEffects[0].timelineProgress-.48)<.002);
  await page.locator('#effects-toggle').uncheck();await scrub(clip==='resolve'?1:0);assert(await visible()>5000);
  await page.locator('#effects-toggle').check();await scrub(clip==='resolve'?1:0);assert.equal(await visible(),0);
  await page.locator('#rest-button').click();assert.equal(await capture(clip+'-rest-reset'),rest);
  await select(clip);await page.locator('#loop-toggle').uncheck();await page.locator('#restart-button').click();
  await page.waitForFunction(()=>!window.inspectorState().entries[0].playing);assert((await state()).resolveEffects[0].complete);
  await page.locator('#restart-button').click();await page.waitForFunction(()=>window.inspectorState().entries[0].time>.2);assert(!(await state()).resolveEffects[0].complete);await pause();
  await page.locator('#loop-toggle').check();await scrub(.96);await page.locator('#play-button').click();await page.waitForFunction(()=>window.inspectorState().entries[0].time<.3);await pause();
 }
 await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#ground-toggle').check();await page.locator('#review-close').click();
 for(const clip of ['move','run','work','place','resolve']){await select(clip);await scrub(.48);await capture('phone-'+clip);if(clip==='resolve'){await scrub(1);await capture('phone-resolve-end');}}
 await page.locator('#rest-button').click();await page.locator('#review-open').click();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();await capture('game-scale');
 // Budget exhaustion must still cut the body, and disposing restores materials.
 const resources=await page.evaluate(async(id)=>{
  const THREE=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
  const {createDigitalResolve,createResolveBudget}=await import('/presentation/digital-resolve.js');
  const model=await new GLTFLoader().loadAsync('/runtime/towers/'+id+'_v01.glb');
  const budget=createResolveBudget(0),before=[];model.scene.traverse(o=>{if(o.isMesh)before.push([o,o.material]);});
  const fx=createDigitalResolve(THREE,model.scene,{budget});fx.setState('resolve',.48,1);const d=fx.diagnostics();fx.dispose();
  return {diagnostics:d,usedAfterDispose:budget.used,materialsRestored:before.every(([o,m])=>o.material===m)};
 },id);
 assert.equal(resources.diagnostics.leased,0);assert.equal(resources.usedAfterDispose,0);assert(resources.materialsRestored);assert.deepEqual(errors,[]);
 await fs.writeFile(out+'/review.json',JSON.stringify({passed:true,asset:id,version:m.version,revision:m.revision,sha256:m.delivery.sha256,sourceHash:m.delivery.sourceHash,checkedAt:new Date().toISOString(),frames,resources,seekComparisons,errors},null,2)+'\n');
 console.log(JSON.stringify({asset:id,revision:m.revision,frames:frames.length,passed:true}));await page.close();
}}finally{await browser.close();await new Promise(r=>server.close(r));}


