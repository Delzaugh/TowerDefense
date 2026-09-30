import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInspectorServer} from '../../../../../tools/asset-inspector/server.mjs';
import {playwrightRuntime,checkContainer} from '../../../../../tools/asset-pipeline/validate.mjs';
import {findAsset,projectRoot,hash} from '../../../../../tools/asset-pipeline/contracts.mjs';

const folder=path.dirname(fileURLToPath(import.meta.url));
const output=path.join(folder,'animation');await mkdir(output,{recursive:true});
const item=await findAsset('linter_agent'),m=item.data;
const baseline=path.join(projectRoot,path.dirname(item.manifest),'revisions/r12_model_approved_before_animation/linter_agent_v01.glb');
function payload(bytes){const g=checkContainer(bytes),len=bytes.readUInt32LE(12);return {g,bin:bytes.subarray(20+len+8)};}
function attribute(p,index){
 const a=p.g.accessors[index],v=p.g.bufferViews[a.bufferView],count={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
 const types={5126:['readFloatLE',4],5125:['readUInt32LE',4],5123:['readUInt16LE',2],5121:['readUInt8',1]},[read,size]=types[a.componentType];
 return Array.from({length:a.count},(_,i)=>Array.from({length:count},(_,j)=>p.bin[read]((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||count*size)+j*size)));
}
function triangles(p){
 const result=[];
 for(const mesh of p.g.meshes)for(const prim of mesh.primitives){
  const pos=attribute(p,prim.attributes.POSITION),normal=attribute(p,prim.attributes.NORMAL),uv=attribute(p,prim.attributes.TEXCOORD_0),indices=attribute(p,prim.indices).flat();
  for(let i=0;i<indices.length;i+=3){
   const vertices=indices.slice(i,i+3).map(j=>({key:[...pos[j],...uv[j]].map(n=>n.toFixed(6)).join(','),values:[...pos[j],...normal[j],...uv[j]]})).sort((a,b)=>a.key.localeCompare(b.key));
   result.push({key:p.g.materials[prim.material].name+'|'+vertices.map(v=>v.key).join('|'),values:vertices.flatMap(v=>v.values)});
  }
 }
 return result.sort((a,b)=>a.key.localeCompare(b.key));
}
const before=payload(await readFile(baseline)),after=payload(await readFile(path.join(projectRoot,m.runtime)));
const oldTriangles=triangles(before),newTriangles=triangles(after);
assert.deepEqual(newTriangles.map(t=>t.key),oldTriangles.map(t=>t.key),'Exported rest topology, positions, UVs or material assignments changed');
const maxAttributeDifference=Math.max(...newTriangles.flatMap((t,i)=>t.values.map((v,j)=>Math.abs(v-oldTriangles[i].values[j]))));
assert(maxAttributeDifference<0.000002,'Exported normals or geometry changed beyond float evaluation tolerance: '+maxAttributeDifference);
assert.deepEqual(after.g.materials,before.g.materials,'Material response changed');
const imageHashes=p=>p.g.images.map(i=>{const v=p.g.bufferViews[i.bufferView];return hash(p.bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength));});
assert.deepEqual(imageHashes(after),imageHashes(before),'Embedded palette changed');

const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const {chromium}=playwrightRuntime(),browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:980}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(['error','warning'].includes(e.type()))errors.push(e.text());});
 await page.goto(base+'/?asset=linter_agent&version=v01');
 await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 const state=()=>page.evaluate(()=>window.inspectorState());
 assert.equal((await state()).entries[0].revision,m.delivery.sha256);
 await page.locator('#grid-button').click();
 const audits=await page.evaluate(async()=>{
  const THREE=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
  const gltf=await new GLTFLoader().loadAsync('/runtime/towers/linter_agent_v01.glb'),scene=gltf.scene;
  const root=scene.getObjectByName('root'),body=scene.getObjectByName('body'),meshes=[];
  scene.traverse(o=>{if(o.isMesh)meshes.push(o)});scene.updateMatrixWorld(true);
  const mixer=new THREE.AnimationMixer(scene),report={},rootMatrix=root.matrixWorld.clone();
  const vec=new THREE.Vector3(),matrix=new THREE.Matrix4();
  const anchorNames='abcdef'.split('').map(s=>'anchor_shooter_'+s);
  const localAnchors=()=>{matrix.copy(body.matrixWorld).invert();return anchorNames.map(n=>scene.getObjectByName(n).getWorldPosition(new THREE.Vector3()).applyMatrix4(matrix).toArray())};
  const restAnchors=localAnchors();
  const pose=()=>{const values=[];scene.traverse(o=>{if(o.isBone)values.push(...o.position,...o.quaternion,...o.scale)});return values};
  function sample(clip,t){mixer.stopAllAction();const a=mixer.clipAction(clip);a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();a.time=t;mixer.update(0);scene.updateMatrixWorld(true);return pose()}
  const starts={},ends={};
  for(const clip of gltf.animations){
   let minY=Infinity,maxMovement=0,maxOutward=-Infinity,maxRecoil=0;
   const first=sample(clip,0);starts[clip.name]=first;
   for(let i=0;i<=96;i++){
    const current=sample(clip,clip.duration*i/96);maxMovement=Math.max(maxMovement,...current.map((v,j)=>Math.abs(v-first[j])));
    if(!root.matrixWorld.elements.every((v,j)=>Math.abs(v-rootMatrix.elements[j])<1e-6))throw Error('Root moved');
    for(const mesh of meshes)for(let j=0;j<mesh.geometry.attributes.position.count;j++)minY=Math.min(minY,mesh.getVertexPosition(j,vec).applyMatrix4(mesh.matrixWorld).y);
    if(clip.name==='work')for(const [j,a] of localAnchors().entries()){
      // Bone-local axes equal the authored Blender axes: X right, Y rear, Z up.
      const delta=new THREE.Vector3(...a).sub(new THREE.Vector3(...restAnchors[j]));
      const angle=(30+60*j)*Math.PI/180;
      const outward=delta.x*Math.sin(angle)-delta.y*Math.cos(angle);
      maxOutward=Math.max(maxOutward,outward);maxRecoil=Math.max(maxRecoil,-outward);
    }
   }
   ends[clip.name]=sample(clip,clip.duration);
   report[clip.name]={duration:clip.duration,minY,maxMovement,maxOutward:clip.name==='work'?maxOutward:null,maxRecoil:clip.name==='work'?maxRecoil:null};
  }
  const difference=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
  const endpointChecks={placeToIdle:difference(ends.place,starts.idle),hitToIdle:difference(ends.hit,starts.idle),resolveFromIdle:difference(starts.resolve,starts.idle)};
  const loops=Object.fromEntries(['idle','work','move'].map(n=>[n,difference(starts[n],ends[n])]));
  let reverseDifference=0;
  for(let i=0;i<=30;i++)reverseDifference=Math.max(reverseDifference,difference(sample(gltf.animations.find(c=>c.name==='place'),1.25*i/30),sample(gltf.animations.find(c=>c.name==='resolve'),1.25*(1-i/30))));
  return {clips:report,endpointChecks,loops,reverseDifference};
 });
 for(const [name,a] of Object.entries(audits.clips)){assert(a.minY>.055,`${name} loses hover clearance`);assert(a.maxMovement>.01,`${name} is constant`);}
 for(const delta of Object.values(audits.endpointChecks))assert(delta<1e-5);
 for(const delta of Object.values(audits.loops))assert(delta<1e-5);
 assert(audits.reverseDifference<1e-5);
 assert(audits.clips.work.maxOutward<1e-5);assert(audits.clips.work.maxRecoil>.050);
 const frames=[];
 const capture=async(name,context={})=>{
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const file=name+'.png',bytes=await page.locator('#viewport').screenshot({path:path.join(output,file)});
  const evidence={file,sha256:hash(bytes),...context};if(Number.isFinite(evidence.time))evidence.time=Math.round(evidence.time*1000)/1000;frames.push(evidence);return evidence;
 };
 const choose=async(name)=>{await page.locator('#clip-select').selectOption({label:name});if((await state()).entries[0].playing)await page.locator('#play-button').click();};
 const scrub=async(time)=>{await page.locator('#timeline').fill(String(Math.round(time*1000)/1000));await page.locator('#timeline').dispatchEvent('input');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));};
 const pixelCount=async()=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));return page.evaluate(()=>{const c=document.querySelector('#viewport'),gl=c.getContext('webgl2'),p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);let visible=0;for(let i=0;i<p.length;i+=4)if(Math.abs(p[i]-p[0])+Math.abs(p[i+1]-p[1])+Math.abs(p[i+2]-p[2])>12)visible++;return visible;});};
 const rest=await capture('rest');
 for(const clip of m.clips){
  await choose(clip.name);const duration=audits.clips[clip.name].duration;
  for(const p of [0,.12,.25,.5,.75,1]){
   await scrub(duration*p);await capture(clip.name+'-'+String(Math.round(p*100)).padStart(3,'0'),{clip:clip.name,time:duration*p,view:'iso'});
   if(['place','resolve'].includes(clip.name)){
    const effect=(await state()).resolveEffects[0];assert(effect.fragments<=64);assert(2432+effect.triangles<=4000);
    if((clip.name==='place'&&p===0)||(clip.name==='resolve'&&p===1))assert.equal(await pixelCount(),0);
   }
  }
  if(clip.playback==='loop'){
   await page.locator('#restart-button').click();await page.waitForFunction(()=>window.inspectorState().entries[0].time>.3);
   await page.waitForTimeout(duration*2100);assert((await state()).entries[0].playing);await page.locator('#play-button').click();
  }else{
   await page.locator('#restart-button').click();await page.waitForFunction(()=>!window.inspectorState().entries[0].playing);assert(Math.abs((await state()).entries[0].time-duration)<.02);
  }
 }
 await choose('place');await scrub(1.25);const placed=await capture('place-ready');
 await choose('idle');await scrub(0);assert.equal((await capture('idle-ready')).sha256,placed.sha256);
 await choose('resolve');await scrub(.6);const deterministic=await capture('resolve-repeat-a');await scrub(.2);await scrub(.6);assert.equal((await capture('resolve-repeat-b')).sha256,deterministic.sha256);
 await page.locator('#effects-toggle').uncheck();await scrub(1.25);assert(await pixelCount()>1000);await page.locator('#effects-toggle').check();assert.equal(await pixelCount(),0);
 await page.locator('#rest-button').click();assert.equal((await capture('rest-reset')).sha256,rest.sha256);
 await page.locator('[data-view="left"]').click();await choose('work');await scrub(.13);await capture('work-side-root',{clip:'work',time:.13,view:'left attachment maximum recoil'});
 await page.locator('[data-view="bottom"]').click();await scrub(.46);await capture('work-underside-root',{clip:'work',time:.46,view:'underside attachment maximum recoil'});
 await page.locator('[data-view="iso"]').click();await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#ground-toggle').check();await page.locator('#review-close').click();
 for(const name of ['idle','work','move','hit','place','resolve']){await choose(name);await scrub(audits.clips[name].duration*.5);await capture('phone-'+name,{clip:name,time:audits.clips[name].duration*.5,view:'phone width, ground and shadows'});}
 await choose('resolve');await scrub(1.25);await capture('phone-resolve-end',{clip:'resolve',time:1.25,view:'phone terminal shadows'});
 await page.locator('#review-open').click();await page.locator('#phone-toggle').uncheck();await page.locator('#ground-toggle').uncheck();await page.locator('#review-close').click();
 // Actual rendered short clips for personal timing review and the handoff preview.
 for(const name of ['work','place','resolve','idle','move','hit']){
  await choose(name);const count=Math.round(audits.clips[name].duration*24);
  for(let i=0;i<=count;i++){await scrub(i/24);await capture('film-'+name+'-'+String(i).padStart(3,'0'),{clip:name,time:i/24,view:'iso film'});}
 }
 assert.deepEqual(errors,[]);
 const result={passed:true,asset:m.id,revision:m.revision,sha256:m.delivery.sha256,sourceHash:m.delivery.sourceHash,
  checkedAt:new Date().toISOString(),restArtParity:{positionsNormalsUvsMaterials:true,paletteBytes:true,maxAttributeDifference},audits,
  rendererSha256:hash(await readFile(path.join(projectRoot,'tools/asset-presentation/digital-resolve.js'))),frames,errors};
 await writeFile(path.join(output,'review.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({passed:true,revision:m.revision,audits,evidence:frames.length,output},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
