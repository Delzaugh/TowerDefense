// Real Three.js consumer checks for the exported checkbox interface.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || require.resolve('playwright', {paths:[process.cwd(),path.dirname(process.execPath),path.resolve(path.dirname(process.execPath),'..')]}));
(async () => {
  const {findAsset} = await import('../../../../tools/asset-pipeline/contracts.mjs');
  const {previewUrl} = await import('../../../../tools/asset-pipeline/asset.mjs');
  const url = await previewUrl(await findAsset('work_coding_task','v01'));
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:1000}}), errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(()=>window.inspectorState && !window.inspectorState().loading && window.inspectorState().entries.length===1);
    const result = await page.evaluate(async () => {
      const THREE = await import('/vendor/three.module.js');
      const {GLTFLoader} = await import('/vendor/GLTFLoader.js');
      const gltf = await new GLTFLoader().loadAsync('/runtime/work/work_coding_task_v01.glb');
      const mesh = gltf.scene.getObjectByName('coding_task');
      const names = ['checkbox_1','checkbox_2','checkbox_3'];
      const indices = names.map(n=>mesh.morphTargetDictionary[n]);
      const defaults = [...mesh.morphTargetInfluences];
      const mixer = new THREE.AnimationMixer(gltf.scene), clip = gltf.animations.find(c=>c.name==='checklist_progress');
      const action = mixer.clipAction(clip); action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
      const samples = [0,.32,.34,.65,.68,.99,1].map(time=>{
        action.paused=false;action.time=time;mixer.update(0);
        return {time,weights:[...mesh.morphTargetInfluences]};
      });
      mixer.stopAllAction();
      const reset = [...mesh.morphTargetInfluences];
      const clone = mesh.clone();
      const combinations = [];
      for(let mask=0;mask<8;mask++) {
        indices.forEach((index,i)=>mesh.morphTargetInfluences[index]=(mask>>i)&1);
        const point = new THREE.Vector3(), bounds=new THREE.Box3();
        for(let i=0;i<mesh.geometry.attributes.position.count;i++) bounds.expandByPoint(mesh.getVertexPosition(i,point));
        combinations.push({mask,weights:[...mesh.morphTargetInfluences],finite:[...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite)});
      }
      const alignment=[];
      const palette=mesh.userData.palette_roles, roleAttribute=mesh.geometry.attributes[palette.attribute];
      function rowBounds(role,height) {
        const bounds=new THREE.Box3(), point=new THREE.Vector3();
        for(let j=0;j<roleAttribute.count;j++) {
          if(Math.round(roleAttribute.getX(j)*(palette.scale||1))!==palette.roles[role]) continue;
          mesh.getVertexPosition(j,point);
          if(point.x<-.20 && Math.abs(point.y-height)<.081) bounds.expandByPoint(point);
        }
        return {min:bounds.min.toArray(),max:bounds.max.toArray()};
      }
      for(const height of [.63,.445,.26]) {
        mesh.morphTargetInfluences.fill(0); const frame=rowBounds('line',height);
        mesh.morphTargetInfluences.fill(1);
        alignment.push({frame,tile:rowBounds('done',height),tick:rowBounds('white',height),hiddenFrame:rowBounds('line',height)});
      }
      const motion=gltf.scene.getObjectByName('task_motion'), assetRoot=gltf.scene.getObjectByName('root');
      const bodyClips=[];
      mesh.morphTargetInfluences.splice(0,3,1,0,1);
      for(const name of ['idle','move','resolve']) {
        const c=gltf.animations.find(c=>c.name===name), a=mixer.clipAction(c);
        a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();
        const poses=[0,.125,.25,.5,.75,1].map(t=>{
          a.paused=false;a.time=c.duration*t;mixer.update(0);gltf.scene.updateMatrixWorld(true);
          return {t,position:motion.position.toArray(),rotation:motion.quaternion.toArray(),scale:motion.scale.toArray(),root:assetRoot.matrixWorld.elements.slice(),weights:mesh.morphTargetInfluences.slice()};
        });
        let minimumClearance=null;
        if(name==='idle'||name==='move') {
          minimumClearance=Infinity;
          for(let i=0;i<=96;i++) {
            a.paused=false;a.time=c.duration*i/96;mixer.update(0);gltf.scene.updateMatrixWorld(true);
            minimumClearance=Math.min(minimumClearance,new THREE.Box3().setFromObject(gltf.scene,true).min.y);
          }
        }
        bodyClips.push({name,duration:c.duration,minimumClearance,tracks:c.tracks.map(t=>({name:t.name,interpolation:t.getInterpolation()})),poses});
        mixer.stopAllAction();
      }
      return {names:Object.keys(mesh.morphTargetDictionary),defaults,samples,reset,combinations,alignment,cloneWeights:clone.morphTargetInfluences,duration:clip.duration,bodyClips};
    });
    assert.deepEqual(result.names,['checkbox_1','checkbox_2','checkbox_3']);
    assert.deepEqual(result.defaults,[0,0,0]); assert.deepEqual(result.reset,[0,0,0]);
    assert.deepEqual(result.cloneWeights,[0,0,0]); assert.equal(result.duration,1);
    assert.deepEqual(result.samples.map(s=>s.weights),[[0,0,0],[0,0,0],[1,0,0],[1,0,0],[1,1,0],[1,1,0],[1,1,1]]);
    for(const c of result.combinations) {assert(c.finite);assert.deepEqual(c.weights,[c.mask&1,(c.mask>>1)&1,(c.mask>>2)&1]);}
    for(const row of result.alignment) {
      for(const axis of [0,1]) for(const edge of ['min','max']) assert(Math.abs(row.frame[edge][axis]-row.tile[edge][axis])<1e-6,'Checked and unchecked outlines must match');
      assert(row.hiddenFrame.max[2]<.08,'Gray frame must retract inside the card when checked');
      for(const axis of [0,1]) assert(row.tick.min[axis]>row.tile.min[axis] && row.tick.max[axis]<row.tile.max[axis],'Tick must fit inside its tile');
    }
    for(const clip of result.bodyClips) {
      assert(clip.tracks.every(t=>!t.name.includes('morphTargetInfluences')),'Body clips must not key checkbox state');
      for(const pose of clip.poses) {
        assert.deepEqual(pose.weights,[1,0,1]);
        assert.deepEqual(pose.root,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
      }
      assert(clip.poses.some(p=>JSON.stringify(p.position)!==JSON.stringify(clip.poses[0].position)),'Clip must actually move');
      if(clip.name==='resolve') assert(clip.poses.at(-1).scale.every(v=>v<.02));
      else {
        assert(clip.minimumClearance>.12,'Hover must remain clear of the ground for the whole loop');
        for(const prop of ['position','rotation','scale']) clip.poses[0][prop].forEach((v,i)=>assert(Math.abs(v-clip.poses.at(-1)[prop][i])<1e-5));
      }
    }
    await page.locator('[data-view="front"]').click();
    await page.locator('#viewport').screenshot({path:path.join(__dirname,'validation/checks_0.png')});
    await page.locator('#clip-select').selectOption({label:'checklist_progress'});
    for(const [count,time] of [[1,.5],[2,.8],[3,1]]) {
      await page.locator('#timeline').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},String(time));
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      if(count===3) assert.equal((await page.evaluate(()=>window.inspectorState())).entries[0].time,1);
      await page.locator('#viewport').screenshot({path:path.join(__dirname,`validation/checks_${count}.png`)});
    }
    await page.locator('[data-view="iso"]').click();
    await page.locator('#viewport').screenshot({path:path.join(__dirname,'validation/checked_iso.png')});
    await page.locator('#rest-button').click();
    await page.locator('[data-view="iso"]').click();
    for(const name of ['idle','move','resolve']) {
      await page.locator('#clip-select').selectOption({label:name});
      const duration=(await page.evaluate(()=>window.inspectorState())).entries[0].clips.find(c=>c.name===name).duration;
      for(const fraction of [.125,.5,.875]) {
        await page.locator('#timeline').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},String(duration*fraction));
        await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
        await page.locator('#viewport').screenshot({path:path.join(__dirname,`validation/${name}_${fraction}.png`)});
      }
    }
    await page.locator('#rest-button').click();
    await page.locator('#review-open').click(); await page.locator('#phone-toggle').check();
    await page.locator('#review-close').click();
    await page.locator('#viewport').screenshot({path:path.join(__dirname,'validation/phone.png')});
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(__dirname,'validation/checkbox-behavior.json'),JSON.stringify({passed:true,...result},null,2)+'\n');
    console.log('PASS: checkbox controls and independent idle/move/resolve, stationary root, loop continuity, shrinking resolve; inspector desktop/phone/clip evidence captured.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
