const assert=require('node:assert/strict');
const {chromium}=require('../../../game/node_modules/playwright');
const {writeFile}=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const out=path.resolve(__dirname,'../previews');
(async()=>{
 const {createStudyServer}=await import(pathToFileURL(path.resolve(__dirname,'../serve.mjs')));const server=createStudyServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
 try{
  for(const phone of [false,true]){
   const context=await browser.newContext(phone?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1440,height:960}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}/simulation/`);await page.waitForFunction(()=>window.simulationStudy);
   const state=()=>page.evaluate(()=>simulationStudy.state()),build=()=>page.evaluate(()=>simulationStudy.placement.state());
   assert.equal((await state()).actors.manualTowers,0);assert.equal(await page.locator('[data-tower]').count(),7);
   const ids=await page.locator('[data-tower]').evaluateAll(nodes=>nodes.map(n=>n.dataset.tower));
   async function choose(id){if(phone)await page.locator('#build-toggle').click();await page.locator(`[data-tower=${id}]`).click();}
   async function spot(){return page.evaluate(()=>{const p=simulationStudy.placement,r=document.querySelector('#map').getBoundingClientRect();for(let x=-55;x<60;x+=3)for(let z=-32;z<38;z+=3){const screen=p.screenPoint(x,z);if([[0,0],[.5,0],[-.5,0],[0,.5],[0,-.5]].every(([dx,dz])=>p.validAt(x+dx,z+dz).valid)&&screen.x>r.left+20&&screen.x<r.right-20&&screen.y>r.top+100&&screen.y<r.bottom-130)return screen;}throw Error('No visible clearing');});}
   for(const [i,id] of ids.entries()){
    await choose(id);assert.equal((await build()).selected,id);const p=await spot();await page.mouse.move(p.x,p.y);assert((await build()).hover?.valid,JSON.stringify({id,p,build:await build()}));
    if(i===0)await page.screenshot({path:path.join(out,`placement-preview-${phone?'phone':'desktop'}.png`)});
    await page.mouse.click(p.x,p.y);await page.waitForFunction(n=>simulationStudy.state().actors.manualTowers===n,i+1);await page.waitForFunction(()=>simulationStudy.placement.state().animating===0);
   }
   assert.equal((await state()).actors.towers,35);assert.equal((await state()).actors.totalTowers,35+ids.length);
   // A click on the route is rejected. Dragging a selected tower pans without placing it.
   const road=await page.evaluate(()=>simulationStudy.placement.screenPoint(0,-22*Math.sqrt(2)));await page.mouse.move(road.x,road.y);assert.equal((await build()).hover.valid,false);await page.mouse.click(road.x,road.y);assert.equal((await state()).actors.manualTowers,ids.length);
   const p=await spot(),pan=(await state()).pan;await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+45,p.y+25,{steps:4});await page.mouse.up();assert.notDeepEqual((await state()).pan,pan);assert.equal((await state()).actors.manualTowers,ids.length);await page.locator('#camera-reset').click();
   await page.keyboard.press('Escape');assert.equal((await build()).selected,null);
   await page.locator('#tower-count').selectOption('20');assert.equal((await state()).actors.manualTowers,ids.length);assert.equal((await state()).actors.totalTowers,20+ids.length);
   await page.locator('#tower-count').selectOption('50');assert.equal((await state()).actors.manualTowers,ids.length);assert.equal((await state()).actors.totalTowers,50+ids.length);
   await page.reload();await page.waitForFunction(()=>window.simulationStudy);assert.equal((await state()).actors.manualTowers,ids.length);assert.equal((await state()).actors.towers,35);
   if(phone)await page.locator('#build-toggle').click();await page.locator('#placement-undo').click();assert.equal((await state()).actors.manualTowers,ids.length-1);
   await page.locator('#placement-clear').click();assert.equal((await state()).actors.manualTowers,0);assert.equal((await state()).actors.towers,35);
   if(phone){await page.screenshot({path:path.join(out,'placement-palette-phone.png')});await page.locator('#palette-close').click();}
   if(!phone){
    // Exercise capacity growth beyond the preset ceiling through the same placement command.
    const count=await page.evaluate(()=>{const b=simulationStudy.placement;b.select('golden_compiler');for(let x=-100;x<=100&&simulationStudy.state().actors.manualTowers<65;x+=4)for(let z=-85;z<=85&&simulationStudy.state().actors.manualTowers<65;z+=4)b.placeAt(x,z);b.finishEffects();return simulationStudy.state().actors.manualTowers;});assert.equal(count,65);
    await page.locator('#tower-count').selectOption('50');const layout=(await state()).actors;assert.equal(layout.totalTowers,115);assert(layout.beamCapacity>=115);
    await page.locator('#settings-toggle').click();await page.locator('#max-enemies').fill('25');await page.locator('#max-enemies').press('Tab');await page.locator('#settings-close').click();
    await page.screenshot({path:path.join(out,'placement-unlimited-desktop.png')});
    await page.locator('#run').click();await page.waitForFunction(()=>simulationStudy.capture().phase==='waves');assert((await build()).locked);assert.equal((await build()).selected,null);assert(await page.locator('[data-tower=copilot_base]').isDisabled());
    await page.waitForFunction(()=>simulationStudy.state().actors.peak===25,null,{timeout:45000});const samples=(await state()).actors.manualAnimationSamples;assert(samples.length>0);await page.waitForTimeout(300);assert((await state()).actors.manualAnimationSamples.every((a,i)=>a.playing&&a.time!==samples[i].time));
    await page.waitForFunction(()=>!simulationStudy.capture().running,null,{timeout:150000});const report=await page.evaluate(()=>simulationStudy.capture().report);assert.equal(report.status,'completed',report.reason);assert(report.correctnessPassed,JSON.stringify(report.cleanup));assert(report.saved);assert.equal(report.configuration.manualTowers,65);assert.equal(report.configuration.totalTowers,115);assert(report.cases.every(c=>c.checks.manualTowers));assert.equal(report.waveResult.arrived,50);assert.equal((await state()).actors.manualTowers,65);assert(!await page.locator('[data-tower=copilot_base]').isDisabled());
    results.push({profile:'desktop',manualTowers:65,totalTowers:115,report:report.saved.path,correctness:report.correctnessPassed});console.log('115 total towers, all placement operations, attack animation, full wave recording and cleanup passed:',report.saved.path);
   }else{results.push({profile:'phone-emulated',towerTypes:ids.length,passed:true});console.log('Phone palette, seven tower types, placement, pan, persistence, undo and clear passed');}
   assert.deepEqual(errors,[]);await context.close();
  }
  await writeFile(path.join(out,'placement-verification.json'),JSON.stringify({capturedAt:new Date().toISOString(),results},null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
