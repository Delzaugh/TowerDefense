// Capture the registered runtime asset in the shared Asset Inspector.
const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require(require.resolve('playwright',{paths:[path.dirname(process.execPath),path.resolve(path.dirname(process.execPath),'..')]}));
(async()=>{
  const out=path.join(__dirname,'screenshots');await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1400,height:1100}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4174/?asset=copilot_commit_halo&version=v01');
    await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
    await page.locator('#review-open').click();await page.locator('#background-select').selectOption('light');await page.locator('#review-close').click();
    await page.locator('#grid-button').click();
    const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.locator('#viewport').screenshot({path:path.join(out,name+'.png')});};
    for(const view of ['front','iso','rear','right']){
      await page.locator('[data-view="'+view+'"]').click();await page.locator('#frame-button').click();
      await page.locator('#zoom-in-button').click();await shot('rest_'+view);
    }
    await page.locator('[data-view="iso"]').click();await page.locator('#frame-button').click();
    for(let i=0;i<4;i++)await page.locator('#zoom-in-button').click();
    await shot('close_jacket_palm');
    const area=await page.locator('#viewport').boundingBox(),cx=area.x+area.width/2,cy=area.y+area.height/2;
    await page.mouse.move(cx,cy);await page.mouse.down({button:'right'});await page.mouse.move(cx,cy+270,{steps:12});await page.mouse.up({button:'right'});await shot('close_hair_face');
    await page.locator('#frame-button').click();for(let i=0;i<4;i++)await page.locator('#zoom-in-button').click();
    await page.mouse.move(cx,cy);await page.mouse.down({button:'right'});await page.mouse.move(cx,cy-280,{steps:12});await page.mouse.up({button:'right'});await shot('close_sneakers');
    await page.locator('[data-view="iso"]').click();await page.locator('#frame-button').click();await page.locator('#zoom-in-button').click();
    for(const clip of ['idle','work']){
      await page.locator('#clip-select').selectOption({label:clip});
      if((await page.locator('#play-button').innerText())==='Pause')await page.locator('#play-button').click();
      const duration=Number(await page.locator('#timeline').getAttribute('max'));
      for(const fraction of [0,.25,.5,.75,1]){
        await page.locator('#timeline').evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},fraction*duration);
        await shot(clip+'_'+Math.round(fraction*100));
      }
    }
    await page.locator('#rest-button').click();await page.locator('[data-view="iso"]').click();await page.locator('#frame-button').click();
    await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#lighting-select').selectOption('gameplay');await page.locator('#silhouette-button').click();await page.locator('#review-close').click();
    await shot('phone_silhouette');
    await page.locator('#review-open').click();await page.locator('#phone-toggle').uncheck();await page.locator('#lighting-select').selectOption('studio');await page.locator('#review-close').click();await page.locator('#frame-button').click();
    await page.locator('#copy-feedback').evaluate(el=>el.click());
    const state=await page.evaluate(()=>window.inspectorState());
    // Verify actual skinned guide geometry moves in both exported clips.
    const motion=await page.evaluate(async()=>{
      const THREE=await import('/vendor/three.module.js');
      const {GLTFLoader}=await import('/vendor/GLTFLoader.js');
      const g=await new GLTFLoader().loadAsync('/runtime/towers/copilot_commit_halo_v01.glb');
      const root=g.scene,mixer=new THREE.AnimationMixer(root),samples=[];let guide=null;
      root.traverse(o=>{
        if(guide||!o.isSkinnedMesh)return;
        const bone=o.skeleton.bones.findIndex(b=>b.name==='orbit'),a=o.geometry.attributes;
        for(let i=0;i<a.position.count;i++)if(a.skinIndex.getX(i)===bone&&a.skinWeight.getX(i)>.99){guide={mesh:o,index:i};break;}
      });
      if(!guide)throw Error('No exported guide vertex is weighted to orbit');
      const position=()=>{root.updateMatrixWorld(true);guide.mesh.skeleton.update();return guide.mesh.getVertexPosition(guide.index,new THREE.Vector3()).applyMatrix4(guide.mesh.matrixWorld);};
      for(const clip of g.animations){
        const a=mixer.clipAction(clip);a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();
        const points=[];
        for(const fraction of [0,.25,.5,.75,1]){a.time=clip.duration*fraction;mixer.update(0);points.push(position());}
        const displacement=points[0].distanceTo(points[1]),loopError=points[0].distanceTo(points[4]);
        if(displacement<.5||loopError>.002)throw Error('Guide motion failed: '+clip.name);
        samples.push({clip:clip.name,duration:clip.duration,quarterCycleTravel:displacement,loopError,positions:points.map(v=>v.toArray())});
        mixer.stopAllAction();
      }
      return samples;
    });
    await fs.writeFile(path.join(out,'guide-motion.json'),JSON.stringify({revision:state.entries[0].revision,samples:motion},null,2));
    await fs.writeFile(path.join(out,'review-state.json'),JSON.stringify({errors,state,note:await page.locator('#feedback-copy').inputValue()},null,2));
    console.log(JSON.stringify({errors,state},null,2));
    if(errors.length)process.exitCode=1;
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
