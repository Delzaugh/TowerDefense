const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises'), path=require('node:path'), assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const sha=b=>createHash('sha256').update(b).digest('hex');
(async()=>{
 const folder=__dirname, out=path.join(folder,'validation/motion'), real=path.join(out,'realtime');
 await fs.mkdir(real,{recursive:true});
 const manifest=JSON.parse(await fs.readFile(path.join(folder,'asset.json'),'utf8'));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:1060}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4174/?asset=copilot_mona&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  assert.equal((await page.evaluate(()=>window.inspectorState())).entries[0].revision,manifest.delivery.sha256);
  const baselineBytes=(await fs.readFile(path.join(folder,'revisions/r6_animation_model_baseline/copilot_mona_v01.glb'))).toString('base64');
  const parity=await page.evaluate(async baselineBytes=>{
   const THREE=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js'),loader=new GLTFLoader();
   const models=await Promise.all([
    loader.loadAsync('/runtime/towers/copilot_mona_v01.glb'),
    loader.parseAsync(Uint8Array.from(atob(baselineBytes),c=>c.charCodeAt(0)).buffer,'')
   ]);
   const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b), failures=[];
   const meshMap=m=>{const result={};m.scene.updateMatrixWorld(true);m.scene.traverse(o=>{if(o.isMesh)result[o.name]=o;});return result;};
   const maps=models.map(meshMap);
   for(const [name,a] of Object.entries(maps[0])){
    const b=maps[1][name];if(!b){failures.push(name+' missing baseline mesh');continue;}
    for(const key of Object.keys(a.geometry.attributes))if(!equal(Array.from(a.geometry.attributes[key].array),Array.from(b.geometry.attributes[key].array)))failures.push(name+'/'+key);
    if(!equal(Array.from(a.geometry.index.array),Array.from(b.geometry.index.array)))failures.push(name+'/indices');
    if(!equal(a.matrixWorld.elements,b.matrixWorld.elements))failures.push(name+'/world');
    if(!equal(a.material.toJSON().color,b.material.toJSON().color))failures.push(name+'/material');
    if(!equal(a.skeleton.boneInverses.map(m=>m.elements),b.skeleton.boneInverses.map(m=>m.elements)))failures.push(name+'/bind');
    const pixels=o=>{const im=o.material.map.image,c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return Array.from(ctx.getImageData(0,0,c.width,c.height).data);};
    if(!equal(pixels(a),pixels(b)))failures.push(name+'/texturePixels');
   }
   const anchors=m=>{const result={};m.scene.traverse(o=>{if(o.name.startsWith('anchor_'))result[o.name]=o.getWorldPosition(new THREE.Vector3()).toArray();});return result;};
   if(!equal(anchors(models[0]),anchors(models[1])))failures.push('anchors');
   return {passed:failures.length===0,failures,meshes:Object.keys(maps[0]).length,checks:['all exported geometry attributes including normals/UVs/skin data','indices','mesh transforms','bind matrices','embedded texture pixels','anchor world seats']};
  },baselineBytes);
  assert(parity.passed,JSON.stringify(parity));
  await page.locator('#grid-button').click();
  await page.locator('#review-open').click();await page.locator('#background-select').selectOption('light');await page.locator('#ground-toggle').check();await page.locator('#review-close').click();
  const state=()=>page.evaluate(()=>window.inspectorState());
  const capture=async(name,context={})=>{
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const file=name+'.png',bytes=await page.locator('#viewport').screenshot({path:path.join(out,file)});
   return {file,sha256:sha(bytes),...context};
  };
  const select=async name=>{await page.locator('#clip-select').selectOption({label:name});if((await state()).entries[0].playing)await page.locator('#play-button').click();};
  const scrub=async(name,p)=>{const duration=(await state()).entries[0].clips.find(c=>c.name===name).duration,time=Number((duration*p).toFixed(3));await page.locator('#timeline').fill(String(time));await page.locator('#timeline').dispatchEvent('input');return time;};
  const frames=[];
  for(const view of ['front','left','iso']){
   await page.locator('[data-view="'+view+'"]').click();
   for(const clip of manifest.clips){
    await select(clip.name);
    const points=clip.name==='hit'?[0,.25,.70,1]:clip.name==='celebrate'?[0,.17,.48,.74,1]:[0,.25,.5,.75,1];
    for(const p of points){const time=await scrub(clip.name,p);frames.push(await capture(view+'-'+clip.name+'-'+String(Math.round(p*100)).padStart(3,'0'),{view,clip:clip.name,progress:p,time}));}
   }
  }
  // Ready one-shots return to exactly the same rendered pose as Idle at t=0.
  await select('idle');await scrub('idle',0);const ready=await capture('ready-idle',{view:'iso',clip:'idle',time:0});
  for(const clip of ['work','hit','wave','celebrate','place']){
   await select(clip);await scrub(clip,1);assert.equal((await capture('ready-'+clip,{view:'iso',clip,progress:1})).sha256,ready.sha256,clip+' ready mismatch');
  }
  // Observe actual normal-speed playback through three cycles, including joins.
  const loops={};
  for(const clip of ['idle','work','move']){
   await select(clip);await scrub(clip,0);await page.locator('#restart-button').click();
   const duration=(await state()).entries[0].clips.find(c=>c.name===clip).duration;
   const start=Date.now(),samples=[];let wraps=0,last=0,index=0;
   while(Date.now()-start<duration*3100){
    const s=(await state()).entries[0];if(s.time<last)wraps++;last=s.time;
    const bytes=await page.locator('#viewport').screenshot({path:path.join(real,clip+'-'+String(index++).padStart(3,'0')+'.png')});
    samples.push({time:s.time,elapsed:(Date.now()-start)/1000,sha256:sha(bytes)});
    await page.waitForTimeout(110);
   }
   assert(wraps>=3,clip+' did not complete three playback loops');
   if((await state()).entries[0].playing)await page.locator('#play-button').click();
   // Closely sample each side of the join at the same authored camera.
   for(const p of [.96,.98,1,0,.02,.04]){await scrub(clip,p);frames.push(await capture('join-'+clip+'-'+String(Math.round(p*100)).padStart(3,'0'),{clip,progress:p,view:'iso loop join'}));}
   loops[clip]={duration,wraps,samples};
  }
  await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();
  for(const [clip,p] of [['work',.5],['move',.25],['hit',.25],['wave',.4],['celebrate',.48],['place',.5],['resolve',.5]]){
   await select(clip);const time=await scrub(clip,p);frames.push(await capture('phone-'+clip,{view:'phone game scale, ground shadows',clip,time,progress:p}));
  }
  await page.locator('#rest-button').click();const final=await state();assert.equal(final.resolveBudget.used,0);assert.equal(final.entries[0].clip,null);assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(out,'review.json'),JSON.stringify({passed:true,revision:manifest.revision,sha256:manifest.delivery.sha256,sourceHash:manifest.delivery.sourceHash,checkedAt:new Date().toISOString(),parity,frames,loops,errors,checks:['actual three-cycle normal-speed playback and near-join samples','start/extremes/end in three views','ready handoffs','phone scale motion','Rest Pose reset']},null,2)+'\n');
  console.log(JSON.stringify({passed:true,parity,captured:frames.length,loopWraps:Object.fromEntries(Object.entries(loops).map(([n,l])=>[n,l.wraps])),errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
