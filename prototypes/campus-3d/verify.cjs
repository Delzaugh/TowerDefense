const assert=require('node:assert/strict');
const path=require('node:path');
const {mkdir,writeFile,readFile}=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../../game/node_modules/playwright');
(async()=>{
 const {createStudyServer}=await import(pathToFileURL(path.join(__dirname,'serve.mjs')));
 const {KIT_IDS,DECOR_IDS}=await import(pathToFileURL(path.join(__dirname,'campus-layout.js')));
 const server=createStudyServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,out=path.join(__dirname,'previews');await mkdir(out,{recursive:true});
 let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
  await page.goto(base+'/?review=1');await page.waitForFunction(()=>window.campusStudyState?.().loaded);
  const state=()=>page.evaluate(()=>window.campusStudyState());
  const start=await state();assert.deepEqual([...start.baseAudit.surfaceProfiles].sort(),['hill','mineral_composite','park','plaza']);for(const id of DECOR_IDS)assert(start.assets.includes(id));assert(start.cameraRotationLocked);assert(!start.cameraLocked);assert.equal(start.asset,'campus_base_hex');assert(start.instances>=90);assert(start.baseAudit.passed);assert.equal(start.baseAudit.tiles,7);assert.equal(start.baseAudit.joinedEdges,12);assert(start.frustumHeight>=87);assert.equal(start.baseAudit.width,90);assert(Math.abs(start.baseAudit.depth-93.530743609)<.001);assert(start.assemblyAudit.passed);assert.equal(start.assemblyAudit.connections,45);
  assert.equal(start.theme,'twilight');assert.equal(start.lightLines.traces,0);assert.equal(start.lightLines.gridTiles,0);
  assert.equal(start.lightLines.pathStyle,'disabled');assert(start.lightLines.gridY<0);
  for(const points of start.lightLines.paths){
   assert.equal(points.length,4);
   for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],direction=Math.atan2(b[1]-a[1],b[0]-a[0])/(Math.PI/3);assert(Math.abs(direction-Math.round(direction))<1e-8);}
  }
  assert.deepEqual(start.companion.scale,[1,1,1]);assert(start.scaleAudit.door.fits);assert(start.scaleAudit.path.fits);
  assert(start.scaleAudit.door.width>=2.79);assert(start.scaleAudit.door.marginLeft>.25);assert(start.scaleAudit.door.marginRight>.25);assert(start.scaleAudit.door.headroom>.47);
  assert.equal(await page.locator('#zoom-in,#zoom-out,#zoom-reset').count(),3);
  assert.deepEqual(start.guests.characters.map(c=>c.id),['github_octocat_classic_lowpoly','problem_lag_spike']);
  assert(start.guests.characters.every(c=>c.scale.every(v=>v===1)));

  assert.deepEqual(start.cameraViews,['home','top','front','left']);
  assert.equal(start.currentView,'home');assert.equal(start.companionBeacon.color,'#ffd078');
  const cameraPositions=[];
  for(const view of start.cameraViews){
   await page.locator('[data-camera="'+view+'"]').click();
   const selected=await state();assert.equal(selected.currentView,view);
   assert.equal(await page.locator('[data-camera][aria-pressed=true]').count(),1);
   cameraPositions.push(selected.camera);await page.screenshot({path:path.join(out,'camera-'+view+'.png')});
   if(view==='top'){assert.equal(selected.camera[0],0);assert.equal(selected.camera[2],0);assert(selected.frustumHeight>=108);}
  }
  assert.equal(new Set(cameraPositions.map(p=>JSON.stringify(p))).size,4);
  await page.locator('[data-camera=home]').click();
  const viewport=await page.locator('canvas').boundingBox(),building=(await state()).hover.buildings[0];
  await page.mouse.move(viewport.x+(building.screen[0]*.5+.5)*viewport.width,viewport.y+(-building.screen[1]*.5+.5)*viewport.height);
  assert.equal((await state()).hover.active,'copilot-lab');
  await page.screenshot({path:path.join(out,'building-hover.png')});
  await page.mouse.move(5,5);assert.equal((await state()).hover.active,null);
  await page.locator('#lab-label').focus();assert.equal((await state()).hover.active,'copilot-lab');
  await page.keyboard.press('Escape');assert.equal((await state()).hover.active,null);

  // Drag pans without rotation; wheel zoom follows the pointer and resets cleanly.
  const rect=await page.locator('canvas').boundingBox();
  await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.6);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.5+180,rect.y+rect.height*.6-65,{steps:5});await page.mouse.up();
  const dragged=await state();assert.notDeepEqual(dragged.target,start.target);
  const direction=s=>s.camera.map((v,i)=>v-s.target[i]);direction(dragged).forEach((v,i)=>assert(Math.abs(v-direction(start)[i])<1e-8));
  const pointer=[rect.x+rect.width*.5+180,rect.y+rect.height*.6-65].map(Math.floor);await page.mouse.move(...pointer);const anchor=await page.evaluate(([x,y])=>window.campusStudyReview.groundPoint(x,y),pointer);
  await page.mouse.wheel(0,350);
  await page.waitForFunction(()=>window.campusStudyState().zoom<1);
  const anchored=await page.evaluate(([x,y])=>window.campusStudyReview.groundPoint(x,y),pointer);anchor.forEach((v,i)=>assert(Math.abs(v-anchored[i])<1e-6));
  const locked=await state();assert.notDeepEqual(locked.target,dragged.target);assert(locked.zoom>=.7);await page.keyboard.press('Escape');
  for(let i=0;i<16;i++)await page.locator('#zoom-in').click();assert.equal((await state()).zoom,10);
  await page.locator('#zoom-reset').click();assert.equal((await state()).zoom,1);assert.deepEqual((await state()).target,start.target);direction(await state()).forEach((v,i)=>assert(Math.abs(v-direction(start)[i])<1e-8));
  await page.locator('#performance-toggle').click();assert(await page.locator('#performance-panel').isVisible());
  const perf=await page.evaluate(()=>window.campusPerformance.snapshot());assert(perf.ready);assert(perf.drawCalls>0);assert(perf.triangles>0);assert.equal(perf.uniqueGLBs,start.assets.length+1);
  await page.locator('#performance-toggle').click();
  const live=(await state()).companion.time;await page.waitForFunction(t=>window.campusStudyState().companion.time>t+.3,live);
  assert.deepEqual((await state()).lightLines.heads,[]);
  await page.locator('#motion-toggle').click();const stopped=(await state()).companion.time;await page.waitForTimeout(180);assert.equal((await state()).companion.time,stopped);assert.equal((await state()).lightLines.traces,0);
  await page.locator('#motion-toggle').click();await page.waitForFunction(t=>window.campusStudyState().companion.time>t+.15,stopped);
  // Sample both directions and every turn; retain source-authored body motion.
  const samples=[];
  for(const t of [0,3.5,7.2,8.25,9.5,13,16.7,17.75,19]){
   await page.evaluate(t=>window.campusStudyReview.seek(t),t);samples.push((await state()).companion);
   await page.screenshot({path:path.join(out,'stroll-'+String(t).replace('.','-')+'.png')});
  }
  assert(samples[1].position[0]>samples[0].position[0]);assert(samples[5].position[0]<samples[4].position[0]);
  assert(Math.abs(samples[3].heading)<.001);assert(Math.abs(samples[7].heading)<.001);
  assert.deepEqual(samples[0].position,samples.at(-1).position);
  await page.evaluate(()=>window.campusStudyReview.doorway(.6));await page.screenshot({path:path.join(out,'doorway-scale.png')});
  await page.evaluate(()=>window.campusStudyReview.seek(3.5));await page.screenshot({path:path.join(out,'home-desktop.png')});
  const ambientSamples=[];
  for(const t of [0,1,12,31,35,119.99,120]){await page.evaluate(t=>window.campusStudyReview.seek(t),t);ambientSamples.push((await state()).ambient);}
  assert.equal(ambientSamples[2].visitors[0].activity,'coffee stop');
  assert(ambientSamples[3].visitors.every(v=>v.activity==='conversation'));
  assert(ambientSamples[3].visitors.some(v=>v.conversationVisible));
  assert(ambientSamples[0].plantInstances>=15);
  assert.notDeepEqual(ambientSamples[0].foliage,ambientSamples[1].foliage);
  assert.notDeepEqual(ambientSamples[0].steam,ambientSamples[1].steam);
  assert.deepEqual(ambientSamples[0].visitors,ambientSamples.at(-1).visitors);
  const ambientAudit=await page.evaluate(()=>window.campusStudyReview.auditAmbient());
  await writeFile(path.join(out,'ambient-audit.json'),JSON.stringify({ambientAudit,ambientSamples},null,2));
  assert(ambientAudit.passed,JSON.stringify(ambientAudit.problems.slice(0,20)));
  const guestAudit=await page.evaluate(()=>window.campusStudyReview.auditGuests());
  await writeFile(path.join(out,'guest-audit.json'),JSON.stringify(guestAudit,null,2));assert(guestAudit.passed,JSON.stringify(guestAudit.problems.slice(0,10)));
  await page.evaluate(()=>window.campusStudyReview.seek(16));const greeting=(await state()).guests;assert.equal(greeting.characters[0].activity,'greeting at the coffee stand');
  await page.waitForTimeout(120);assert.deepEqual((await state()).guests,greeting);
  await page.evaluate(()=>window.campusStudyReview.seek(35));const walkingGuest=(await state()).guests.characters[0];assert.equal(walkingGuest.activity,'walking through the garden');assert.notDeepEqual(walkingGuest.position,greeting.characters[0].position);await page.screenshot({path:path.join(out,'ambient-conversation.png')});
  const frozen=(await state()).ambient;await page.waitForTimeout(180);assert.deepEqual((await state()).ambient,frozen);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.campusStudyState().ambient.reducedMotion);const quiet=await state();assert(quiet.paused);assert(quiet.ambient.reducedMotion);assert(quiet.ambient.steam.every(p=>!p.visible));assert(quiet.ambient.foliage.flat().every(v=>v===0));
  assert(quiet.guests.reducedMotion);const still=quiet.guests;await page.waitForTimeout(100);assert.deepEqual((await state()).guests,still);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>window.campusStudyReview.seek(3.5));
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'home-phone.png')});
  assert(await page.locator('#lab-label').isVisible());assert.equal(await page.locator('[data-camera]').count(),4);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual((await state()).camera,start.camera);
  await page.setViewportSize({width:844,height:390});await page.screenshot({path:path.join(out,'home-landscape.png')});
  const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const tp=await touch.newPage();tp.on('pageerror',e=>errors.push(e.message));await tp.goto(base);await tp.waitForFunction(()=>window.campusStudyState?.().loaded);
  const ts=await tp.evaluate(()=>window.campusStudyState());assert(ts.paused);await tp.waitForTimeout(180);assert.equal((await tp.evaluate(()=>window.campusStudyState())).companion.time,ts.companion.time);
  await tp.locator('#motion-toggle').tap();await tp.waitForFunction(t=>window.campusStudyState().companion.time>t+.15,ts.companion.time);
  await tp.locator('[data-camera=top]').tap();assert.equal((await tp.evaluate(()=>window.campusStudyState())).currentView,'top');await tp.locator('[data-camera=home]').tap();
  await tp.locator('#lab-label').tap();assert.equal((await tp.evaluate(()=>window.campusStudyState())).hover.active,'copilot-lab');assert.deepEqual((await tp.evaluate(()=>window.campusStudyState())).camera,ts.camera);await touch.close();
  // Check delivered footprints, actual terrain heights, and the traversable routes.
  const placementAudit=await page.evaluate(async()=>{
   const THREE=await import('three'),{GLTFLoader}=await import('/vendor/GLTFLoader.js'),{layout}=await import('/campus-layout.js');
   const placements=layout(),loader=new GLTFLoader();
   const models=new Map(await Promise.all([...new Set(placements.map(p=>p.id))].map(async id=>[id,(await loader.loadAsync('/runtime/'+id+'.glb')).scene])));
   const nodes=placements.map(p=>{const object=models.get(p.id).clone(true);object.position.fromArray(p.position);object.rotation.y=p.rotation||0;object.updateMatrixWorld(true);return {p,object,box:new THREE.Box3().setFromObject(object)};});
   const terrain=nodes.filter(n=>n.p.tile).map(n=>n.object),ray=new THREE.Raycaster(),problems=[];
   const height=(x,z)=>{ray.set(new THREE.Vector3(x,40,z),new THREE.Vector3(0,-1,0));return ray.intersectObjects(terrain,true)[0]?.point.y;};
   const overlaps=(a,b)=>Math.min(a.max.x,b.max.x)-Math.max(a.min.x,b.min.x)>.05&&Math.min(a.max.z,b.max.z)-Math.max(a.min.z,b.min.z)>.05;
   const decor=nodes.filter(n=>n.p.decor);
   const trees=nodes.filter(n=>n.p.id.startsWith('campus_tree_'));
   for(const tree of trees)for(const road of nodes.filter(n=>n.p.id.startsWith('campus_walk_'))){
    if(overlaps(tree.box,road.box))problems.push({type:'tree canopy or base over walkway',asset:tree.p.id,position:tree.p.position,road:road.p.id,roadPosition:road.p.position,bounds:[tree.box.min.toArray(),tree.box.max.toArray()]});
   }
   for(const tree of trees){
    const baseBox=new THREE.Box3();tree.object.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const v=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);if(Math.abs(v.y-1.2)<.001)baseBox.expandByPoint(v);}});
    if(!baseBox.isEmpty())for(const [x,z] of [[baseBox.min.x,baseBox.min.z],[baseBox.max.x,baseBox.min.z],[baseBox.min.x,baseBox.max.z],[baseBox.max.x,baseBox.max.z]]){const y=height(x,z);if(y===undefined||Math.abs(y-1.2)>.025)problems.push({type:'unsupported tree base',position:tree.p.position,point:[x,z],height:y});}
   }
   for(const n of decor){
    for(const other of nodes){if(other===n||other.p.tile)continue;if(overlaps(n.box,other.box))problems.push({type:'footprint overlap',asset:n.p.id,position:n.p.position,other:other.p.id,otherPosition:other.p.position});}
    const b=n.box,c=b.getCenter(new THREE.Vector3());
    for(const [x,z] of [[c.x,c.z],[b.min.x,b.min.z],[b.max.x,b.min.z],[b.min.x,b.max.z],[b.max.x,b.max.z]]){
     const y=height(x,z);if(y===undefined||Math.abs(y-b.min.y)>.025)problems.push({type:'unsupported furniture',asset:n.p.id,point:[x,z],terrainY:y,baseY:b.min.y});
    }
   }
   let routeSamples=0;
   for(const n of nodes.filter(n=>n.p.id.startsWith('campus_walk_'))){n.object.traverse(o=>{if(!o.isMesh)return;const positions=o.geometry.attributes.position;for(let i=0;i<positions.count;i++){const v=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld);if(Math.abs(v.y-1.2)>.001)continue;routeSamples++;const y=height(v.x,v.z);if(y===undefined||Math.abs(y-v.y)>.025)problems.push({type:'walkway terrain clearance',asset:n.p.id,point:v.toArray(),terrainY:y});}});}
   return {passed:problems.length===0,treeInstances:trees.length,decorInstances:decor.length,decorTypes:[...new Set(decor.map(n=>n.p.id))],routeSamples,instances:nodes.length,problems};
  });
  await writeFile(path.join(out,'placement-audit.json'),JSON.stringify(placementAudit,null,2));
  assert(placementAudit.passed,JSON.stringify(placementAudit.problems));assert(placementAudit.decorInstances>=20);assert.equal(placementAudit.decorTypes.length,11);assert(placementAudit.routeSamples>100);
  // Exercise growth and a different tile identity using real exported anchors.
  const growthAudit=await page.evaluate(async()=>{
   const THREE=await import('three'),{GLTFLoader}=await import('/vendor/GLTFLoader.js'),tiles=await import('/campus-layout.js');
   const loader=new GLTFLoader();const models=new Map(await Promise.all(['campus_base_hex','campus_tile_park','campus_tile_plaza','campus_tile_hill'].map(async id=>[id,(await loader.loadAsync('/runtime/'+id+'.glb')).scene])));
   const oldCount=tiles.BASE_TILES.length;
   try{
    tiles.BASE_TILES.push([2,0]);const group=new THREE.Group();
    for(const p of tiles.layout().filter(p=>p.tile)){
     const node=models.get(p.id).clone(true);node.name=p.tile.q===2?'future_surface_contract_fixture':p.id;
     node.position.fromArray(p.position);node.rotation.y=p.rotation||0;node.userData.campusTile={...p.tile};
     if(p.tile.q===2)node.userData.campusTile.profile='test_surface';group.add(node);
    }
    group.updateMatrixWorld(true);return tiles.auditBaseTiles(group);
   }finally{tiles.BASE_TILES.splice(oldCount);}
  });
  assert(growthAudit.passed);assert.equal(growthAudit.tiles,8);assert.equal(growthAudit.joinedEdges,13);assert.equal(growthAudit.exposedEdges,22);
  assert(growthAudit.surfaceProfiles.includes('test_surface'));
  await writeFile(path.join(out,'tile-growth-audit.json'),JSON.stringify({note:'Test fixture adds one temporary eighth tile to the delivered mixed-terrain layout.',...growthAudit},null,2));

  const delivered=[];
  for(const id of KIT_IDS){assert.equal((await fetch(base+'/runtime/'+id+'.glb')).status,200);const manifest=JSON.parse(await readFile(path.join(__dirname,'../../blender/environment',id,'v01/asset.json'),'utf8'));const report=JSON.parse(await readFile(path.join(__dirname,'../../blender/environment',id,'v01/validation/report.json'),'utf8'));assert(report.passed);assert.equal(report.sha256,manifest.delivery.sha256);delivered.push({id,revision:manifest.revision,sha256:report.sha256,triangles:report.triangles});}
  for(const route of ['/blender/environment/campus_lab/v01/build.py','/runtime/not-registered.glb','/previews/home-desktop.png'])assert.equal((await fetch(base+route)).status,404);
  assert.deepEqual(errors,[]);
  await writeFile(path.join(out,'scale-audit.json'),JSON.stringify(start.scaleAudit,null,2));
  await writeFile(path.join(out,'verification.json'),JSON.stringify({passed:true,checkedAt:new Date().toISOString(),checks:['29 environment assets plus canonical Copilot, low-poly Octocat and Lag Spike','7 expandable hex tiles with 12 exact edge connections','8-tile growth and alternative tile identity tested with actual exported anchors','50% larger tile dimensions with coordinated fixed framing','edge light streaks removed entirely','void-only grid below opaque models','Decor instances: supported by real terrain, no footprint overlaps; walkway terrain-contact samples','companion pause and reduced motion','four distinct camera presets with pressed state and touch support','building mesh hover, label focus, Escape dismissal and touch highlight','warm companion beacon with canonical source scale','fixed camera angles with drag pan, pointer-anchored wheel zoom, bounded button zoom and full reset','canonical Copilot scale and sampled hover doorway clearance','entire back-and-forth route and turning footprint','authored idle clip with pause/resume','reduced-motion preference','desktop, phone, landscape and touch','restricted asset serving','no browser warnings or errors'],delivered,strollSamples:samples,errors},null,2));
  console.log('Campus assembly, locked camera, animation and scale checks passed.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});




















