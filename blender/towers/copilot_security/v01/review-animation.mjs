import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {playwrightRuntime} from '../../../../tools/asset-pipeline/validate.mjs';
const d='blender/towers/copilot_security/v01',out=d+'/validation/animation';
const m=JSON.parse(await fs.readFile(d+'/asset.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
await fs.mkdir(out,{recursive:true});
const {chromium}=playwrightRuntime(),browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1120,height:1010}}),errors=[],evidence=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
try{
 await page.goto('http://127.0.0.1:4175/?asset=copilot_security&version=v01');
 const ready=()=>page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 await ready();const state=()=>page.evaluate(()=>window.inspectorState());
 assert.equal((await state()).entries[0].revision,m.delivery.sha256);
 await page.locator('#grid-button').click();
 await page.locator('#review-open').click();await page.locator('#background-select').selectOption('light');await page.locator('#review-close').click();
 const capture=async(name,extra={})=>{await page.waitForTimeout(75);const bytes=await page.locator('#viewport').screenshot({path:out+'/'+name+'.png'});const item={path:out+'/'+name+'.png',sha256:hash(bytes),view:name,...extra};evidence.push(item);return item;};
 const rest=await capture('rest');
 const select=async name=>{await page.locator('#clip-select').selectOption({label:name});if((await state()).entries[0].playing)await page.locator('#play-button').click();};
 const scrub=async seconds=>{await page.locator('#timeline').fill(String(Number(seconds.toFixed(3))));await page.locator('#timeline').dispatchEvent('input');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 const pixels=()=>page.evaluate(()=>{const c=document.querySelector('#viewport'),gl=c.getContext('webgl2'),p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);let n=0;for(let i=0;i<p.length;i+=4)if(Math.abs(p[i]-p[0])+Math.abs(p[i+1]-p[1])+Math.abs(p[i+2]-p[2])>12)n++;return n;});
 const durations=Object.fromEntries((await state()).entries[0].clips.map(c=>[c.name,c.duration]));
 for(const clip of m.clips){
  await select(clip.name);
  for(const p of [0,.125,.25,.5,.71,.75,1]){await scrub(durations[clip.name]*p);await capture(clip.name+'-'+String(Math.round(p*100)).padStart(3,'0'),{clip:clip.name,time:durations[clip.name]*p});}
 }
 await select('work');await scrub(.5);await page.locator('[data-view=right]').click();await page.locator('#zoom-in-button').click();await capture('scanner-side-max',{clip:'work',time:.5});
 await scrub(1.5);await capture('scanner-side-opposite',{clip:'work',time:1.5});
 await page.locator('[data-view=iso]').click();
 await select('place');await scrub(1.25);const placeReady=await capture('place-ready');
 await select('idle');await scrub(0);assert.equal((await capture('idle-ready')).sha256,placeReady.sha256,'Place/idle transition changes ready pose');
 await select('resolve');await scrub(1.25);assert.equal(await pixels(),0,'Resolve terminal frame is visible');
 await page.locator('#effects-toggle').uncheck();await scrub(1.25);assert(await pixels()>1000,'Full-size pose missing when effect disabled');
 await page.locator('#effects-toggle').check();await scrub(1.25);await page.locator('#rest-button').click();assert.equal((await capture('rest-reset')).sha256,rest.sha256,'Rest reset changed art');
 await select('resolve');await scrub(.6);const repeat=await capture('resolve-repeat-a');await scrub(.1);await scrub(.6);assert.equal((await capture('resolve-repeat-b')).sha256,repeat.sha256,'Resolve seek not deterministic');
 const fx=(await state()).resolveEffects[0];assert(fx.fragments>0&&fx.fragments<=12);assert(2854+fx.triangles<=3000);
 await select('place');await scrub(0);assert.equal(await pixels(),0,'Place must start invisible');
 await page.locator('#restart-button').click();await page.waitForFunction(()=>window.inspectorState().entries[0].time>.15);assert(!(await state()).resolveEffects[0].complete);
 await page.waitForFunction(()=>!window.inspectorState().entries[0].playing);assert((await state()).resolveEffects[0].complete);
 await select('resolve');await page.locator('#restart-button').click();await page.waitForFunction(()=>!window.inspectorState().entries[0].playing);assert.equal(await pixels(),0);
 const loops=[];
 for(const name of ['idle','work','move']){
  await select(name);await scrub(durations[name]-.025);await page.locator('#play-button').click();
  await page.waitForFunction(()=>window.inspectorState().entries[0].time<.2);
  await page.waitForTimeout(durations[name]*2100);const s=(await state()).entries[0];assert(s.playing&&s.loop);loops.push({clip:name,playing:s.playing,observedTime:s.time});
  await page.locator('#play-button').click();
 }
 await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#ground-toggle').check();await page.locator('#review-close').click();
 for(const name of Object.keys(durations)){await select(name);await scrub(durations[name]*(name==='hit'?.20:.48));await capture('phone-'+name,{clip:name,time:durations[name]*(name==='hit'?.20:.48)});}
 await select('resolve');await scrub(1.25);await capture('phone-resolve-end');
 await page.locator('#rest-button').click();
 const baseline=(await fs.readFile(d+'/revisions/r15_approved_model_before_animation/copilot_security_v01.glb')).toString('base64');
 const audit=await page.evaluate(async({baseline})=>{
  const THREE=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
  const {createLifecycleEffect}=await import('/presentation/lifecycle.js');
  const {createResolveBudget}=await import('/presentation/digital-resolve.js');
  const loader=new GLTFLoader(),gltf=await loader.loadAsync('/runtime/towers/copilot_security_v01.glb');
  const bytes=Uint8Array.from(atob(baseline),c=>c.charCodeAt(0));const old=await loader.parseAsync(bytes.buffer,'');
  const meshes=root=>{const r=[];root.traverse(o=>{if(o.isMesh)r.push(o);});return r;};
  const nowMeshes=meshes(gltf.scene),oldMeshes=meshes(old.scene);gltf.scene.updateMatrixWorld(true);old.scene.updateMatrixWorld(true);
  const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
  const vertexPose=()=>{gltf.scene.updateMatrixWorld(true);const a=[];for(const ob of nowMeshes){ob.skeleton?.update();for(let i=0;i<ob.geometry.attributes.position.count;i++){const v=ob.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(ob.matrixWorld);a.push(...v.toArray());}}return a;};
  const oldPose=[];for(const ob of oldMeshes)for(let i=0;i<ob.geometry.attributes.position.count;i++)oldPose.push(...ob.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(ob.matrixWorld).toArray());
  const restDelta=delta(vertexPose(),oldPose);let normalDelta=0,uvDelta=0;
  for(let i=0;i<nowMeshes.length;i++)for(const [attribute,label] of [['normal','normal'],['uv','uv']]){
   const a=Array.from(nowMeshes[i].geometry.attributes[attribute].array),b=Array.from(oldMeshes[i].geometry.attributes[attribute].array);
   if(a.length!==b.length)throw Error('Rest attribute counts changed');const d=delta(a,b);if(label==='normal')normalDelta=Math.max(normalDelta,d);else uvDelta=Math.max(uvDelta,d);
  }
  const root=gltf.scene.getObjectByName('root'),actionAnchor=gltf.scene.getObjectByName('anchor_action'),scanner=gltf.scene.getObjectByName('scanner');
  const anchorRest=actionAnchor.getWorldPosition(new THREE.Vector3());const anchorLocal=scanner.worldToLocal(anchorRest.clone());
  let anchorDelta=0;const results={},mixer=new THREE.AnimationMixer(gltf.scene);let ready=null;
  for(const clip of gltf.animations){
   mixer.stopAllAction();const action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
   function pose(t){action.reset().play();mixer.setTime(t);gltf.scene.updateMatrixWorld(true);return vertexPose();}
   const start=pose(0),end=pose(clip.duration),dt=1/120;
   const before=pose(clip.duration-dt),after=pose(dt);
   const velocityJump=Math.max(...start.map((v,i)=>Math.abs((after[i]-v)/dt-(end[i]-before[i])/dt)));
   let minY=Infinity,maxAnchorDelta=0;
   for(let s=0;s<=96;s++){
    const values=pose(clip.duration*s/96);for(let i=1;i<values.length;i+=3)minY=Math.min(minY,values[i]);
    const expected=scanner.localToWorld(anchorLocal.clone()),actual=actionAnchor.getWorldPosition(new THREE.Vector3());maxAnchorDelta=Math.max(maxAnchorDelta,expected.distanceTo(actual));
    if(root.position.length()>1e-7)throw Error('Simulation root moved');
   }
   if(clip.name==='idle')ready=start;
   results[clip.name]={duration:clip.duration,loopDelta:delta(start,end),velocityJump,minimumClearance:minY,anchorDelta:maxAnchorDelta,start,end};
   anchorDelta=Math.max(anchorDelta,maxAnchorDelta);
  }
  const transitions={};for(const [name,r] of Object.entries(results)){transitions[name]=delta(ready,name==='place'?r.end:r.start);delete r.start;delete r.end;}
  mixer.stopAllAction();gltf.scene.updateMatrixWorld(true);
  const budget=createResolveBudget(0),effect=createLifecycleEffect(THREE,gltf.scene,{budget});effect.prepare();effect.setState('resolve',.6,1.25);const fallback=effect.diagnostics();effect.dispose();
  return {restDelta,normalDelta,uvDelta,anchorDelta,clips:results,transitions,fallback};
 },{baseline});
 assert(audit.restDelta<1e-6&&audit.normalDelta<1e-6&&audit.uvDelta===0,'Accepted exported rest art changed');
 assert(audit.anchorDelta<1e-6,'Action anchor detached from scanner');
 for(const [name,r] of Object.entries(audit.clips)){assert(r.minimumClearance>.06,name+' ground penetration');if(['idle','work','move'].includes(name)){assert(r.loopDelta<1e-6);assert(r.velocityJump<.18,name+' loop velocity hitch');}}
 assert(Object.values(audit.transitions).every(v=>v<1e-6),'Ready transition mismatch');assert.equal(audit.fallback.fragments,0);
 assert.deepEqual(errors,[]);
 const result={passed:true,revision:m.revision,sha256:m.delivery.sha256,sourceHash:m.delivery.sourceHash,rendererSha256:hash(await fs.readFile('tools/asset-presentation/digital-resolve.js')),audit,loops,evidence,errors};
 await fs.writeFile(out+'/review.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({passed:true,revision:m.revision,audit,frames:evidence.length}));
}finally{await browser.close();}
