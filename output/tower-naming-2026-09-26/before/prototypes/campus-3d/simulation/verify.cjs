const assert=require('node:assert/strict');
const {readFile,writeFile,mkdir}=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../../../game/node_modules/playwright');
const parent=path.resolve(__dirname,'..');
(async()=>{
 const {createWaveSchedule}=await import(pathToFileURL(path.join(__dirname,'schedule.js')));
 for(const cap of [25,100,200,500])for(const step of [1/30,.1]){const s=createWaveSchedule(322,cap);let maxQueue=0;for(let i=0;i<10000&&!s.state().done;i++){const state=s.update(step);assert(state.active<=cap);maxQueue=Math.max(maxQueue,state.queued);}assert(s.state().done);assert.equal(s.state().peak,cap);assert.equal(s.state().arrived,cap*2);assert.equal(s.state().events.length,3);assert(maxQueue>0);}
 const speedTest=createWaveSchedule(322);speedTest.update(1);const distances=new Map(speedTest.active.map(e=>[e.id,e.distance]));speedTest.update(.5);
 for(const e of speedTest.active.filter(e=>distances.has(e.id)))assert(Math.abs(e.distance-distances.get(e.id)-.5*[12.5,7.5,10][e.kind])<1e-8);
 const {createStudyServer}=await import(pathToFileURL(path.join(parent,'serve.mjs')));
 const server=createStudyServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;const results=[],out=path.join(parent,'previews');await mkdir(out,{recursive:true});
 try{
  browser=await chromium.launch({channel:'msedge',headless:!process.argv.includes('--headed')});
  for(const profile of [{name:'desktop',viewport:{width:1440,height:960},deviceScaleFactor:1,towers:50,cap:200},{name:'phone-emulated',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,towers:35,cap:100}]){
   const context=await browser.newContext(profile),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}/simulation/`);await page.waitForFunction(()=>window.simulationStudy);
   let initial=await page.evaluate(()=>window.simulationStudy.state());assert.equal(initial.map.decor.length,200);assert.equal(initial.map.areaMultiplier,2);assert(Math.abs(initial.map.width*initial.map.depth-94*66*2)<1e-6);assert(initial.map.availableTowerSlots>=50);assert.equal(initial.actors.cap,200);assert.equal(initial.map.forest.length,420);assert(initial.map.structures.length>=20);assert(initial.map.terrain.max-initial.map.terrain.min>20);assert.equal(initial.actors.octocats,2);assert.equal(initial.actors.heavyTowers,2);
   await page.locator('#settings-toggle').click();assert(await page.locator('#settings-panel').isVisible());
   await page.locator('#toggle-bert').uncheck();assert.equal(await page.evaluate(()=>window.simulationStudy.state().actors.heavyTowers),0);assert.equal(await page.evaluate(()=>window.simulationStudy.state().actors.towers),35);
   await page.locator('#max-enemies').fill(String(profile.cap));await page.locator('#max-enemies').press('Tab');assert.equal(await page.evaluate(()=>simulationStudy.state().actors.cap),profile.cap);await page.locator('#max-enemies').fill('0');await page.locator('#max-enemies').press('Tab');assert.equal(await page.evaluate(()=>simulationStudy.state().actors.cap),profile.cap);await page.locator('#toggle-octocat').uncheck();assert.equal(await page.evaluate(()=>window.simulationStudy.state().actors.octocats),0);
   await page.reload();await page.waitForFunction(()=>window.simulationStudy);assert.equal(await page.evaluate(()=>window.simulationStudy.state().actors.octocats),0);assert.equal(await page.evaluate(()=>window.simulationStudy.state().actors.heavyTowers),0);
   assert.equal(await page.evaluate(()=>simulationStudy.state().actors.cap),profile.cap);const enabled=profile.name==='desktop';
   await page.locator('#settings-toggle').click();await page.locator('#toggle-bert').check();assert.equal(await page.evaluate(()=>window.simulationStudy.state().actors.octocats),0);
   await page.locator('#toggle-octocat').check();await page.locator('#toggle-bert').uncheck();assert.equal(await page.evaluate(()=>window.simulationStudy.state().actors.octocats),2);assert.equal(await page.evaluate(()=>window.simulationStudy.state().actors.heavyTowers),0);
   await page.locator('#toggle-bert').setChecked(enabled);await page.locator('#toggle-octocat').setChecked(enabled);
   await page.screenshot({path:path.join(out,`simulation-settings-${profile.name}.png`)});await page.locator('#settings-close').click();
   await page.locator('#tower-count').selectOption('20');assert.equal(await page.evaluate(()=>window.simulationStudy.state().actors.towers),20);
   await page.locator('#tower-count').selectOption(String(profile.towers));
   // Wheel zoom anchors at the cursor, drag pans, presets/reset restore framing.
   const canvas=await page.locator('#map').boundingBox(),cx=canvas.x+canvas.width*.6,cy=canvas.y+canvas.height*.45;
   await page.mouse.move(cx,cy);await page.mouse.wheel(0,-180);await page.waitForFunction(()=>simulationStudy.state().zoom>1);
   const beforePan=await page.evaluate(()=>simulationStudy.state().pan);await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+70,cy+35,{steps:5});await page.mouse.up();
   assert.notDeepEqual(await page.evaluate(()=>simulationStudy.state().pan),beforePan);
   await page.locator('#camera-reset').click();assert.deepEqual(await page.evaluate(()=>({zoom:simulationStudy.state().zoom,pan:simulationStudy.state().pan})),{zoom:1,pan:[0,0,0]});
   await page.locator('[data-view=top]').click();await page.mouse.move(cx,cy);await page.mouse.wheel(0,150);await page.waitForFunction(()=>simulationStudy.state().zoom<1);await page.locator('[data-view=home]').click();
   await page.screenshot({path:path.join(out,`simulation-map-${profile.name}.png`)});
   await page.locator('#run').click();await page.waitForFunction(()=>window.simulationStudy.capture().phase==='waves');
   await page.waitForFunction(cap=>window.simulationStudy.state().actors.peak===cap,profile.cap,{timeout:45000});
   const loaded=await page.evaluate(()=>window.simulationStudy.state());assert.equal(loaded.actors.octocats,enabled?2:0);assert.equal(loaded.actors.heavyTowers,enabled?2:0);
   assert.equal(loaded.actors.composition.find(a=>a.id==='github_octocat_classic_lowpoly').count,enabled?2:0);
   assert(loaded.actors.composition.find(a=>a.id==='copilot_developer').count>=9);
   assert.equal(loaded.actors.composition.filter(a=>!a.enemy&&a.id!=='github_octocat_classic_lowpoly').reduce((sum,a)=>sum+a.count,0),profile.towers);
   assert(await page.locator('#max-enemies').isDisabled());const cameraBefore=await page.evaluate(()=>({zoom:simulationStudy.state().zoom,pan:simulationStudy.state().pan}));await page.mouse.move(cx,cy);await page.mouse.wheel(0,-180);await page.mouse.down();await page.mouse.move(cx+40,cy+20);await page.mouse.up();assert.deepEqual(await page.evaluate(()=>({zoom:simulationStudy.state().zoom,pan:simulationStudy.state().pan})),cameraBefore);assert(await page.locator('#toggle-bert').isDisabled());assert(await page.locator('#toggle-octocat').isDisabled());
   assert.deepEqual([...new Set(loaded.actors.enemyPositions.map(e=>e.speedFactor))].sort(),[.75,1,1.25]);
   assert(loaded.actors.composition.find(a=>a.id==='problem_missing_details').count>0);
   assert.equal(loaded.actors.towers,profile.towers);assert(await page.locator('#tower-count').isDisabled());
   // Models follow the same polyline used to draw the route, within its 2.2 m half-width.
   function distance(p,route){let best=Infinity;for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[2]-a[2])*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(p[0]-a[0]-t*dx,p[2]-a[2]-t*dz));}return best;}
   for(const e of loaded.actors.enemyPositions)assert(distance(e.position,loaded.map.route)<2.2);
   assert(await page.evaluate(async()=>{const {heightAt}=await import('/simulation/map.js');return simulationStudy.state().actors.enemyPositions.every(e=>Math.abs(e.position[1]-heightAt(e.position[0],e.position[2])-.22)<1e-6)&&simulationStudy.state().actors.towerPositions.every(t=>Math.abs(t.position[1]-heightAt(t.position[0],t.position[2])-.18)<1e-6);}));
   for(const t of loaded.actors.towerPositions)assert(distance(t.position,loaded.map.route)>=4.49);
   const times=loaded.actors.attackAnimationSamples.map(a=>a.time);await page.waitForTimeout(300);
   const later=await page.evaluate(()=>window.simulationStudy.state().actors.attackAnimationSamples);assert(later.every((a,i)=>a.playing&&a.time!==times[i]));
   await page.screenshot({path:path.join(out,`simulation-waves-${profile.name}.png`)});
   await page.waitForFunction(()=>!window.simulationStudy.capture().running,null,{timeout:120000});
   const report=await page.evaluate(()=>window.simulationStudy.capture().report);
   assert.equal(report.status,'completed',report.reason);assert(report.correctnessPassed,JSON.stringify({cleanup:report.cleanup,errors:report.errors,paused:report.pausedFrames}));assert(report.saved,report.saveError);
   assert.equal(report.waveResult.arrived,profile.cap*2);assert.equal(report.waveResult.peak,profile.cap);assert.equal(report.waveResult.events.length,3);
   assert.equal(report.configuration.towers,profile.towers);assert.deepEqual(report.configuration.settings,{bert:enabled,octocat:enabled,maxEnemies:profile.cap});assert(report.cases.length>=6);assert.equal(report.configuration.enemySpeeds.length,3);
   let peakFrame=0;for(const c of report.cases){assert(c.load.active<=profile.cap);assert.equal(c.load.octocats,enabled?2:0);for(const f of c.measurement.frameSamples){assert(f.enemyCount<=profile.cap);peakFrame=Math.max(peakFrame,f.enemyCount);}}
   assert.equal(peakFrame,profile.cap);
   const saved=JSON.parse(await readFile(path.resolve(parent,'../..',report.saved.path),'utf8'));assert.equal(saved.scene,'garden-switchback-v3');
   const image=await readFile(path.join(path.dirname(path.resolve(parent,'../..',report.saved.path)),saved.cases[0].screenshot));assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(await page.locator('#arrived').textContent(),String(profile.cap*2));assert.equal(await page.evaluate(()=>window.simulationStudy.state().actors.active),0);
   await page.locator('[data-view=top]').click();await page.screenshot({path:path.join(out,`simulation-complete-${profile.name}.png`)});
   console.log(`${profile.name}: ${profile.towers} towers, specials ${enabled?'on':'off'}, ${profile.cap*2} arrived, peak ${profile.cap}, capture and cleanup passed; ${report.saved.path}`);
   // Cancelling a new run restores the map and persists partial evidence.
   await page.locator('#run').click();await page.waitForFunction(()=>window.simulationStudy.state().actors.active>=10);await page.locator('#run').click();await page.waitForFunction(()=>!window.simulationStudy.capture().running);
   const cancelled=await page.evaluate(()=>window.simulationStudy.capture().report);assert.equal(cancelled.status,'cancelled');assert(cancelled.saved);assert.equal(await page.evaluate(()=>window.simulationStudy.state().actors.active),0);
   await page.locator('#run').click();await page.waitForFunction(()=>window.simulationStudy.capture().phase==='baseline');
   await page.setViewportSize({width:profile.viewport.width-10,height:profile.viewport.height});await page.waitForFunction(()=>!window.simulationStudy.capture().running);
   assert.match(await page.evaluate(()=>window.simulationStudy.capture().report.reason),/Viewport/);
   await page.route('**/stress-report',route=>route.fulfill({status:503,body:'Test storage failure'}));
   await page.locator('#run').click();await page.waitForFunction(()=>window.simulationStudy.capture().phase==='baseline');
   const download=page.waitForEvent('download');await page.locator('#run').click();assert.match((await download).suggestedFilename(),/^garden-waves-/);
   await page.waitForFunction(()=>!window.simulationStudy.capture().running);assert.match(await page.evaluate(()=>window.simulationStudy.capture().report.saveError),/503/);
   assert.deepEqual(errors,[]);results.push({profile,report:report.saved.path,correctness:report.correctnessPassed,overBudgetCases:report.overBudgetCases});await context.close();
  }
  await writeFile(path.join(out,'simulation-verification.json'),JSON.stringify({capturedAt:new Date().toISOString(),results},null,2));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
