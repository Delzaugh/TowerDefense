import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createInspectorServer} from './server.mjs';
import {playwrightRuntime,checkContainer} from '../asset-pipeline/validate.mjs';
import {findAsset,projectRoot,hash} from '../asset-pipeline/contracts.mjs';

// Optional IDs let an authorized rollout reuse the same actual-renderer checks.
const ids=process.argv.slice(2).length?process.argv.slice(2):['problem_bug','work_coding_task'];
const rendererFiles=await Promise.all(['lifecycle.js','digital-resolve.js'].map(async name=>({path:'tools/asset-presentation/'+name,sha256:hash(await readFile(path.join(projectRoot,'tools/asset-presentation',name)))})));
function accessor(bytes,g,index){
 const a=g.accessors[index],v=g.bufferViews[a.bufferView];
 const stride=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type])*({5121:1,5123:2,5125:4,5126:4}[a.componentType]);
 const binary=28+bytes.readUInt32LE(12),out=Buffer.alloc(stride*a.count);
 if(v){const start=binary+(v.byteOffset||0)+(a.byteOffset||0);for(let i=0;i<a.count;i++)bytes.copy(out,i*stride,start+i*(v.byteStride||stride),start+i*(v.byteStride||stride)+stride);}
 if(a.sparse){const s=a.sparse,ix=binary+(g.bufferViews[s.indices.bufferView].byteOffset||0)+(s.indices.byteOffset||0),values=binary+(g.bufferViews[s.values.bufferView].byteOffset||0)+(s.values.byteOffset||0);
  const size=({5121:1,5123:2,5125:4}[s.indices.componentType]);for(let k=0;k<s.count;k++){const i=bytes.readUIntLE(ix+k*size,size);bytes.copy(out,i*stride,values+k*stride,values+(k+1)*stride);}
 }
 return out;
}
async function parity(m){
 const old=m.milestones.find(x=>x.label===(m.category==='enemies'?'before_glitch_breach':'before_blueprint'));
 assert(old,'Preserve a coherent before_glitch_breach/before_blueprint milestone first');
 const [before,after]=await Promise.all([old.export,m.runtime].map(p=>readFile(path.join(projectRoot,p))));
 const a=checkContainer(before),b=checkContainer(after);
 for(const node of a.nodes){
  const next=b.nodes.find(n=>n.name===node.name);assert(next,'Missing authored node: '+node.name);
  for(const [key,fallback] of Object.entries({translation:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]}))
   (node[key]||fallback).forEach((v,i)=>assert(Math.abs(v-(next[key]||fallback)[i])<1e-6,'Rest node changed: '+node.name+'/'+key));
 }
 assert.deepEqual(a.materials,b.materials);
 assert.equal(a.textures.length,b.textures.length);
 a.textures.forEach((texture,i)=>assert.deepEqual(a.samplers[texture.sampler],b.samplers[b.textures[i].sampler],'Used texture sampler changed'));
 const same=(i,j,what)=>assert.deepEqual(accessor(before,a,i),accessor(after,b,j),what);
 assert.equal(a.meshes.length,b.meshes.length);
 a.meshes.forEach((mesh,i)=>mesh.primitives.forEach((p,j)=>{
  const q=b.meshes[i].primitives[j];same(p.indices,q.indices,'Rest topology changed');
  for(const key of Object.keys(p.attributes))same(p.attributes[key],q.attributes[key],'Rest attribute changed: '+key);
  for(let k=0;k<(p.targets||[]).length;k++)for(const key of Object.keys(p.targets[k]))same(p.targets[k][key],q.targets[k][key],'Independent morph changed');
 }));
 for(let i=0;i<(a.skins||[]).length;i++)same(a.skins[i].inverseBindMatrices,b.skins[i].inverseBindMatrices,'Rest binding changed');
 a.images.forEach((im,i)=>{
  const image=(bytes,g,img)=>{const v=g.bufferViews[img.bufferView],start=28+bytes.readUInt32LE(12)+(v.byteOffset||0);return bytes.subarray(start,start+v.byteLength);};
  assert.deepEqual(image(before,a,im),image(after,b,b.images[i]),'Palette image changed');
 });
 const unchanged=[];
 for(const c of a.animations.filter(c=>c.name!=='resolve')){
  const d=b.animations.find(x=>x.name===c.name);assert(d);assert.equal(c.channels.length,d.channels.length);
  for(const ch of c.channels){
   const name=a.nodes[ch.target.node].name,next=d.channels.find(x=>b.nodes[x.target.node].name===name&&x.target.path===ch.target.path);assert(next);
   const s=c.samplers[ch.sampler],t=d.samplers[next.sampler];assert.equal(s.interpolation,t.interpolation);
   same(s.input,t.input,c.name+' timing changed');same(s.output,t.output,c.name+' values changed');
  }unchanged.push(c.name);
 }
 for(const c of b.animations.filter(c=>['spawn','resolve'].includes(c.name)))assert(c.channels.every(ch=>ch.target.path!=='weights'),'Lifecycle drives independent progress');
 return {baselineSha256:hash(before),unchangedClips:unchanged,restGeometryMaterialsMorphs:'exact byte parity'};
}
const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const {chromium}=playwrightRuntime(),browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const results=[];
 for(const id of ids){
  const item=await findAsset(id),m=item.data,preserved=await parity(m);
  assert(['glitch_breach','blueprint'].includes(m.presentation?.lifecycle?.type),'Asset has no supported lifecycle configuration');
  const output=path.join(projectRoot,path.dirname(item.manifest),'validation/lifecycle');await mkdir(output,{recursive:true});
  const page=await browser.newPage({viewport:{width:1280,height:1060}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(['error','warning'].includes(e.type()))errors.push(e.text());});
  await page.goto(base+'/?asset='+id+'&version=v01');
  const ready=()=>page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading&&!document.querySelector('#refresh-models').disabled);
  await ready();await page.locator('#grid-button').click();
  const state=()=>page.evaluate(()=>window.inspectorState());const initial=await state();
  assert.equal(initial.entries[0].revision,m.delivery.sha256);
  const capture=async(name,context={})=>{
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const file=name+'.png',bytes=await page.locator('#viewport').screenshot({path:path.join(output,file)});
   return {file,sha256:hash(bytes),...context};
  };
  const imageComparisons=[];
  async function sameFrame(a,b,meaning){
   if(a.sha256===b.sha256){imageComparisons.push({meaning,exact:true});return;}
   const encoded=await Promise.all([a,b].map(async f=>(await readFile(path.join(output,f.file))).toString('base64')));
   const difference=await page.evaluate(async strings=>{
    const images=await Promise.all(strings.map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src='data:image/png;base64,'+src;})));
    const pixels=images.map(im=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return ctx.getImageData(0,0,c.width,c.height).data;});
    let max=0,count=0;for(let i=0;i<pixels[0].length;i+=4){let changed=false;for(let j=0;j<3;j++){const d=Math.abs(pixels[0][i+j]-pixels[1][i+j]);max=Math.max(max,d);changed ||= d>0;}count+=changed?1:0;}
    return {sameSize:images[0].width===images[1].width&&images[0].height===images[1].height,max,changedFraction:count/(pixels[0].length/4)};
   },encoded);
   // Skinned quaternion sampling can shift isolated antialias values by 1/255.
   assert(difference.sameSize&&difference.max<=2&&difference.changedFraction<.0001,meaning+': '+JSON.stringify(difference));imageComparisons.push({meaning,...difference});
  }
  const pixels=()=>page.evaluate(()=>{
   const gl=document.querySelector('#viewport').getContext('webgl2'),p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
   gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);
   let count=0;for(let i=0;i<p.length;i+=4)if(Math.abs(p[i]-p[0])+Math.abs(p[i+1]-p[1])+Math.abs(p[i+2]-p[2])>12)count++;return count;
  });
  const rest=await capture('rest');const frames=[];
  let duration;
  const scrub=async p=>{await page.locator('#timeline').fill(String(Number((duration*p).toFixed(3))));await page.locator('#timeline').dispatchEvent('input');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));};
  for(const clip of ['spawn','resolve']){
   duration=initial.entries[0].clips.find(c=>c.name===clip).duration;
   await page.locator('#clip-select').selectOption({label:clip});await page.locator('#play-button').click();
   for(const p of [0,.08,.2,.35,.5,.65,.8,.9,1]){
    await scrub(p);const s=await state(),effect=s.resolveEffects[0];
    assert(s.entries[0].triangles+effect.triangles<=m.budgets.triangles,'Combined visible cost exceeds this reference asset ceiling');
    assert.deepEqual(s.entries[0].root,[0,0,0]);assert(effect.fragments<=m.presentation.lifecycle.maxFragments);
    if(m.category==='enemies'&&clip==='spawn'&&m.presentation.lifecycle.spawnPortal!==true)
      assert.equal(effect.triangles,0,'Enemy Spawn must not render portal/helper geometry');
    if((clip==='spawn'&&p===0)||(clip==='resolve'&&p===1))assert.equal(await pixels(),0,clip+' terminal visibility');
    if((clip==='spawn'&&p===1)||(clip==='resolve'&&p===0))assert(await pixels()>5000,clip+' full-size pose missing');
    frames.push({...await capture(clip+'-'+Math.round(p*100),{clip,progress:p,time:duration*p,view:'isometric'}),effect});
   }
   await scrub(.5);const first=await capture(clip+'-repeat-a');await scrub(.1);await scrub(.5);const second=await capture(clip+'-repeat-b');await sameFrame(first,second,clip+' deterministic seek');
   await page.locator('#refresh-models').click();await ready();assert(Math.abs((await state()).resolveEffects[0].progress-.5)<.001);
   await page.locator('#rest-button').click();await sameFrame(await capture(clip+'-reset'),rest,clip+' Rest reset');assert.equal((await state()).resolveBudget.used,0);
   await page.locator('#clip-select').selectOption({label:clip});
   await page.waitForFunction(()=>!window.inspectorState().entries[0].playing);assert((await state()).resolveEffects[0].complete);
   await page.locator('#restart-button').click();await page.waitForFunction(()=>window.inspectorState().entries[0].time>.20);assert(!(await state()).resolveEffects[0].complete);
   await page.locator('#rest-button').click();
  }
  await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#ground-toggle').check();await page.locator('#review-close').click();
  for(const clip of ['spawn','resolve']){
   duration=initial.entries[0].clips.find(c=>c.name===clip).duration;await page.locator('#clip-select').selectOption({label:clip});await page.locator('#play-button').click();
   for(const p of [.2,.5,.8,1]){await scrub(p);frames.push(await capture('phone-'+clip+'-'+Math.round(p*100),{clip,progress:p,view:'phone, game light and ground shadows'}));}
  }
  const checks=await page.evaluate(async({id,category,maxFragments})=>{
   const THREE=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
   const {createLifecycleEffect}=await import('/presentation/lifecycle.js'),{createResolveBudget}=await import('/presentation/digital-resolve.js');
   const models=await Promise.all([0,1].map(()=>new GLTFLoader().loadAsync('/runtime/'+category+'/'+id+'_v01.glb')));
   const scene=new THREE.Scene(),budget=createResolveBudget(maxFragments),effects=[],originals=[];let maxScaleDelta=0,maxRootDelta=0,poseDelta=0,minimum=Infinity,statePreserved=true;
   for(const {scene:root,animations} of models){
    scene.add(root);root.updateMatrixWorld(true);root.traverse(o=>{if(o.isMesh)originals.push([o,o.material,o.geometry]);});
    const effect=createLifecycleEffect(THREE,root,{budget});scene.add(effect.object);effects.push(effect);
    const mixer=new THREE.AnimationMixer(root),assetRoot=root.getObjectByName('root'),rest=[];
    root.traverse(node=>rest.push({node,scale:node.scale.clone(),position:node.position.clone(),rotation:node.quaternion.clone()}));
    for(const clip of animations.filter(c=>['spawn','resolve'].includes(c.name))){
     mixer.stopAllAction();const a=mixer.clipAction(clip);a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();
     for(let i=0;i<=120;i++){
      a.time=clip.duration*i/120;mixer.update(0);root.updateMatrixWorld(true);effect.setState(clip.name,a.time,clip.duration);
      for(const r of rest){maxScaleDelta=Math.max(maxScaleDelta,r.node.scale.distanceTo(r.scale));poseDelta=Math.max(poseDelta,r.node.position.distanceTo(r.position),r.node.quaternion.angleTo(r.rotation));}
      maxRootDelta=Math.max(maxRootDelta,assetRoot.position.length());
      minimum=Math.min(minimum,new THREE.Box3().setFromObject(root,true).min.y);
     }
    }
    if(id==='work_coding_task'){
     const mesh=root.getObjectByName('coding_task');
     for(let bits=0;bits<8;bits++){
      const weights=[0,1,2].map(i=>(bits>>i)&1);mesh.morphTargetInfluences.splice(0,3,...weights);
      for(const clip of ['spawn','resolve'])for(const p of [0,.2,.5,1]){effect.setState(clip,p,1);statePreserved&&=mesh.morphTargetInfluences.every((v,i)=>v===weights[i]);}
     }
    }
    effect.setState('resolve',.5,1);
   }
   const lease=budget.used,live=effects.map(e=>e.diagnostics());effects.forEach(e=>e.dispose());
   return {maxScaleDelta,maxRootDelta,minimumClearance:minimum,poseDelta,statePreserved,lease,live,afterDispose:budget.used,resourcesRestored:originals.every(([o,m,g])=>o.material===m&&o.geometry===g)};
  },{id,category:m.category,maxFragments:m.presentation.lifecycle.maxFragments});
  assert(checks.maxScaleDelta<1e-6&&checks.maxRootDelta<1e-6);assert(checks.minimumClearance>-.003);assert(checks.statePreserved&&checks.resourcesRestored);assert.equal(checks.afterDispose,0);
  if(m.category==='enemies'){assert.equal(checks.lease,m.presentation.lifecycle.maxFragments);assert.equal(checks.live[1].leased,0);}
  assert.deepEqual(errors,[]);
  const result={passed:true,id,revision:m.revision,sha256:m.delivery.sha256,sourceHash:m.delivery.sourceHash,rendererFiles,checkedAt:new Date().toISOString(),preserved,checks,imageComparisons,frames};
  await writeFile(path.join(output,'review.json'),JSON.stringify(result,null,2)+'\n');results.push({id,revision:m.revision,checks});await page.close();
 }
 console.log(JSON.stringify({passed:true,results},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
