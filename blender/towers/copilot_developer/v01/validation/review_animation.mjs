import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {projectRoot,hash} from '../../../../../tools/asset-pipeline/contracts.mjs';
import {playwrightRuntime,checkContainer} from '../../../../../tools/asset-pipeline/validate.mjs';

const folder=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(await readFile(path.join(folder,'../asset.json'),'utf8'));
const candidate=await readFile(path.join(projectRoot,manifest.runtime));
const baseline=await readFile(path.join(folder,'../revisions/r8_approved_model_before_animation/copilot_developer_v01.glb'));
const oldDocument=checkContainer(baseline),newDocument=checkContainer(candidate);
const previous=await readFile(path.join(folder,'../revisions/r10_before_digital_resolve/copilot_developer_v01.glb'));
const previousDocument=checkContainer(previous);
assert.deepEqual(oldDocument.materials,newDocument.materials,'Accepted materials changed');
assert.deepEqual(oldDocument.samplers,newDocument.samplers,'Texture sampling changed');
function data(bytes,g,accessorIndex){
 const a=g.accessors[accessorIndex],v=g.bufferViews[a.bufferView];
 const stride=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type])*({5121:1,5123:2,5125:4,5126:4}[a.componentType]);
 const start=28+bytes.readUInt32LE(12)+(v.byteOffset||0)+(a.byteOffset||0),out=Buffer.alloc(stride*a.count);
 for(let i=0;i<a.count;i++)bytes.copy(out,i*stride,start+i*(v.byteStride||stride),start+i*(v.byteStride||stride)+stride);
 return out;
}
for(const name of ['idle','work','move','hit']){
 const before=previousDocument.animations.find(a=>a.name===name),after=newDocument.animations.find(a=>a.name===name);
 assert.equal(before.channels.length,after.channels.length,`${name}: channel count changed`);
 for(const channel of before.channels){
  const targetName=previousDocument.nodes[channel.target.node].name;
  const next=after.channels.find(c=>c.target.path===channel.target.path&&newDocument.nodes[c.target.node].name===targetName);
  assert(next,`${name}: missing ${targetName}/${channel.target.path}`);
  const a=before.samplers[channel.sampler],b=after.samplers[next.sampler];
  assert.equal(a.interpolation,b.interpolation);
  for(const key of ['input','output'])assert.deepEqual(data(previous,previousDocument,a[key]),data(candidate,newDocument,b[key]),`${name}: ${key} changed`);
 }
}
assert.deepEqual(newDocument.nodes.find(n=>n.name==='root').extras.resolve_effect,manifest.presentation.resolve,'FX contract differs from export');
assert.equal(oldDocument.meshes.length,newDocument.meshes.length);
oldDocument.meshes.forEach((m,i)=>m.primitives.forEach((p,j)=>{
 const q=newDocument.meshes[i].primitives[j];assert.equal(p.material,q.material);
 assert.deepEqual(data(baseline,oldDocument,p.indices),data(candidate,newDocument,q.indices),'Topology changed');
}));
oldDocument.images.forEach((im,i)=>{
 const get=(bytes,g,img)=>{const v=g.bufferViews[img.bufferView],start=28+bytes.readUInt32LE(12)+(v.byteOffset||0);return bytes.subarray(start,start+v.byteLength);};
 assert.deepEqual(get(baseline,oldDocument,im),get(candidate,newDocument,newDocument.images[i]),'Packed palette changed');
});
const evidence=path.join(folder,'animation');await mkdir(evidence,{recursive:true});
const server=http.createServer(async(req,res)=>{
 try {
  const route=new URL(req.url,'http://localhost').pathname;
  if(route==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><style>body{margin:0}</style><link rel="icon" href="data:,"><script type="importmap">{"imports":{"three":"/vendor/three.module.js","../utils/BufferGeometryUtils.js":"/vendor/BufferGeometryUtils.js"}}</script>');return;}
  if(route==='/candidate.glb'||route==='/baseline.glb'){res.end(route==='/candidate.glb'?candidate:baseline);return;}
  if(['/presentation/digital-resolve.js','/presentation/lifecycle.js'].includes(route)){res.setHeader('Content-Type','text/javascript');res.end(await readFile(path.join(projectRoot,'tools/asset-presentation',path.basename(route))));return;}
  const vendor=/^\/vendor\/([a-zA-Z0-9_.]+\.js)$/.exec(route);
  const file=vendor?path.join(projectRoot,'tools/asset-inspector/vendor',vendor[1]):route==='/check.js'?path.join(projectRoot,'tools/asset-pipeline/browser-check.js'):route==='/review.js'?path.join(projectRoot,'tools/asset-inspector/review.js'):null;
  if(!file){res.writeHead(404).end();return;}res.setHeader('Content-Type','text/javascript');res.end(await readFile(file));
 }catch(e){res.writeHead(500).end(e.message);}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const {chromium}=playwrightRuntime();const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:900,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);
 const audit=await page.evaluate(async()=>{
  const THREE=await import('three');const {GLTFLoader}=await import('/vendor/GLTFLoader.js');
  const [current,old]=await Promise.all(['/candidate.glb','/baseline.glb'].map(p=>new GLTFLoader().loadAsync(p)));
  const root=current.scene;root.updateMatrixWorld(true);old.scene.updateMatrixWorld(true);
  const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const oldMeshes=[];old.scene.traverse(o=>{if(o.isMesh)oldMeshes.push(o);});
  const maxDiff=(a,b)=>a.length!==b.length?Infinity:a.reduce((d,v,i)=>Math.max(d,Math.abs(v-b[i])),0);
  let restDelta=0,normalDelta=0,uvDelta=0;
  for(let j=0;j<meshes.length;j++){
   const a=meshes[j],b=oldMeshes[j];
   for(let i=0;i<a.geometry.attributes.position.count;i++){
    restDelta=Math.max(restDelta,a.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(a.matrixWorld).distanceTo(b.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(b.matrixWorld)));
   }
   normalDelta=Math.max(normalDelta,maxDiff([...a.geometry.attributes.normal.array],[...b.geometry.attributes.normal.array]));
   uvDelta=Math.max(uvDelta,maxDiff([...a.geometry.attributes.uv.array],[...b.geometry.attributes.uv.array]));
  }
  const anchorRest={};for(const n of ['anchor_ui','anchor_action','anchor_target'])anchorRest[n]=root.getObjectByName(n).getWorldPosition(new THREE.Vector3()).distanceTo(old.scene.getObjectByName(n).getWorldPosition(new THREE.Vector3()));
  const body=root.getObjectByName('body'),assetRoot=root.getObjectByName('root');
  const anchorLocal={};for(const n of ['anchor_action','anchor_target'])anchorLocal[n]=body.worldToLocal(root.getObjectByName(n).getWorldPosition(new THREE.Vector3()));
  const rootRest=assetRoot.matrixWorld.clone(),bodyRest=body.matrixWorld.clone();
  const mixer=new THREE.AnimationMixer(root);
  function play(c,time){mixer.stopAllAction();const a=mixer.clipAction(c);a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();a.time=time;mixer.update(0);root.updateMatrixWorld(true);}
  function pose(){return [...body.matrixWorld.elements,...root.getObjectByName('eye_l').matrixWorld.elements,...root.getObjectByName('eye_r').matrixWorld.elements];}
  const clips=[];const ready={};
  for(const c of current.animations){
   let minimum=Infinity,maximum=-Infinity,rootDelta=0,anchorDelta=0,poseDelta=0;
   play(c,0);const start=pose();ready[c.name]=start;
   const n=Math.ceil(c.duration*96); // Four samples per authored frame.
   for(let i=0;i<=n;i++){
    play(c,c.duration*i/n);const b=new THREE.Box3().setFromObject(root,true);
    minimum=Math.min(minimum,b.min.y);maximum=Math.max(maximum,b.max.y);
    rootDelta=Math.max(rootDelta,maxDiff([...assetRoot.matrixWorld.elements],[...rootRest.elements]));
    poseDelta=Math.max(poseDelta,maxDiff(pose(),start));
    for(const key of Object.keys(anchorLocal))anchorDelta=Math.max(anchorDelta,root.getObjectByName(key).getWorldPosition(new THREE.Vector3()).distanceTo(body.localToWorld(anchorLocal[key].clone())));
   }
   const end=pose();const endpointDelta=maxDiff(start,end);const dt=1/96;
   play(c,dt);const first=pose().map((v,i)=>(v-start[i])/dt);
   play(c,c.duration-dt);const last=pose().map((v,i)=>(end[i]-v)/dt);
   play(c,c.duration);mixer.stopAllAction();root.updateMatrixWorld(true);
   const resetDelta=maxDiff([...body.matrixWorld.elements],[...bodyRest.elements]);
   clips.push({name:c.name,duration:c.duration,samples:n+1,minimumClearance:minimum,maxY:maximum,rootDelta,anchorDelta,poseDelta,endpointDelta,loopVelocityDelta:maxDiff(first,last),endPose:end,resetDelta});
  }
  // Blend the actual skeletal poses with the presentation's normal mixer semantics.
  const transitions=[];
  for(const destination of ['work','move','hit','resolve']){
   let min=Infinity;
   for(const phase of [0,.25,.5,.75]){
    mixer.stopAllAction();const idle=current.animations.find(c=>c.name==='idle'),next=current.animations.find(c=>c.name===destination);
    const a=mixer.clipAction(idle),b=mixer.clipAction(next);
    a.setLoop(THREE.LoopRepeat,Infinity).reset().play();a.time=idle.duration*phase;
    b.setLoop(destination==='work'||destination==='move'?THREE.LoopRepeat:THREE.LoopOnce,1).reset().play();b.clampWhenFinished=true;
    for(let i=0;i<=24;i++){a.setEffectiveWeight(1-i/24);b.setEffectiveWeight(i/24);mixer.update(.25/24);root.updateMatrixWorld(true);min=Math.min(min,new THREE.Box3().setFromObject(root,true).min.y);}
   }
   transitions.push({from:'idle',to:destination,minimumClearance:min});
  }
  const place=current.animations.find(c=>c.name==='place'),resolve=current.animations.find(c=>c.name==='resolve');
  let reversePoseDelta=0;
  for(let i=0;i<=120;i++){
   play(place,place.duration*i/120);const a=pose();play(resolve,resolve.duration*(1-i/120));
   reversePoseDelta=Math.max(reversePoseDelta,maxDiff(a,pose()));
  }
  play(place,place.duration);const placeReadyDelta=maxDiff(pose(),ready.idle);
  return {restDelta,normalDelta,uvDelta,anchorRest,clips,transitions,reversePoseDelta,placeReadyDelta,readyDelta:Math.max(...['work','move','hit','resolve'].map(n=>maxDiff(ready.idle,ready[n])))};
 });
 assert(audit.restDelta<1e-6&&audit.normalDelta<1e-6&&audit.uvDelta===0,'Accepted rest mesh changed');
 assert(Object.values(audit.anchorRest).every(v=>v<1e-6),'Rest anchor moved');
 assert(audit.readyDelta<1e-5,'Ready starts do not match');
 assert(audit.reversePoseDelta<1e-6&&audit.placeReadyDelta<1e-6,'Place is not the reverse pose of Resolve or does not return to ready');
 for(const c of audit.clips){assert(c.minimumClearance>.085,`${c.name}: lost hover clearance`);assert(c.rootDelta<1e-6&&c.anchorDelta<1e-6,`${c.name}: root/anchor drift`);assert(c.resetDelta<1e-6,`${c.name}: rest reset failed`);assert(c.poseDelta>.005,`${c.name}: constant pose`);if(['idle','work','move'].includes(c.name)){assert(c.endpointDelta<1e-5,`${c.name}: loop gap`);assert(c.loopVelocityDelta<.15,`${c.name}: loop speed hitch`);}}
 assert(audit.transitions.every(t=>t.minimumClearance>.075),'Transition intersects ground');
 // Actual runtime-rendered pose evidence, kept with explicit clip/time metadata.
 await page.evaluate(async m=>(await import('/check.js')).inspect('/candidate.glb',m),manifest);
 const captures=[];
 for(const c of manifest.clips){
  for(const progress of [0,.125,.25,.5,.7,.875,1]){
   const view=c.name==='move'?'side':'iso';
   await page.evaluate(({view,name,progress})=>window.renderEvidence(view,name,progress),{view,name:c.name,progress});
   const file=`${c.name}-${Math.round(progress*1000)}.png`;const bytes=await page.screenshot({path:path.join(evidence,file)});
   captures.push({file,sha256:hash(bytes),view,clip:c.name,progress});
  }
 }
 assert.deepEqual(errors,[]);
 const result={asset:manifest.id,version:manifest.version,revision:manifest.revision,sha256:hash(candidate),sourceHash:manifest.delivery.sourceHash,baselineSha256:hash(baseline),checkedAt:new Date().toISOString(),passed:true,...audit,captures};
 await writeFile(path.join(evidence,'runtime_audit.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({passed:true,restDelta:audit.restDelta,normalDelta:audit.normalDelta,anchorRest:audit.anchorRest,clips:audit.clips.map(({name,minimumClearance,loopVelocityDelta})=>({name,minimumClearance,loopVelocityDelta}))},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
