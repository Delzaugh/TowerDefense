const {chromium}=require('../../game/node_modules/playwright');
const {writeFile,mkdir,readFile}=require('node:fs/promises');
const {createHash}=require('node:crypto');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
// Run separately from other browser tests. Headless/emulated results are regression evidence,
// not proof of performance on a physical phone or a production network.
(async()=>{
 const {createStudyServer}=await import(pathToFileURL(path.join(__dirname,'serve.mjs')));
 const server=createStudyServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:!process.argv.includes('--headed')});
 const out=path.join(__dirname,'previews');await mkdir(out,{recursive:true});
 const results=[],errors=[];
 try{
  for(const profile of [{name:'desktop',viewport:{width:1440,height:960},deviceScaleFactor:1},{name:'phone-emulated',viewport:{width:390,height:844},deviceScaleFactor:2}]){
   const context=await browser.newContext(profile),page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/?review=1');await page.waitForFunction(()=>window.campusPerformance?.snapshot().ready);
   const cold=await page.evaluate(()=>window.campusPerformance.snapshot());
   for(const view of ['top','front','left','home'])await page.locator('[data-camera='+view+']').click();
   await page.waitForTimeout(3000);
   const cases=[];
   for(const spec of [{name:'home-active',view:'home'},{name:'top-active',view:'top'},{name:'front-close',view:'front',zoom:true},{name:'left-active',view:'left'}]){
    await page.locator('#zoom-reset').click();await page.locator('[data-camera='+spec.view+']').click();
    if(spec.zoom)for(let i=0;i<12;i++)await page.locator('#zoom-in').click();
    await page.waitForTimeout(1000);await page.evaluate(()=>window.campusPerformance.reset());
    await page.waitForTimeout(8000);const measurement=await page.evaluate(()=>window.campusPerformance.snapshot());
    const {scene,...metrics}=measurement;
    cases.push({case:spec.name,...metrics,view:scene.currentView,zoom:scene.zoom,budget:{fps:metrics.fps>=28,p95Frame:metrics.frameIntervalMs.p95<=50,cpu:metrics.cpuSubmissionMs.p95<=16.7,drawCalls:metrics.drawCalls<=600,triangles:metrics.triangles<=1000000,textures:metrics.textures<=64}});
   }
   await page.locator('#motion-toggle').click();await page.evaluate(()=>window.campusPerformance.reset());await page.waitForTimeout(1000);
   const paused=await page.evaluate(()=>window.campusPerformance.snapshot());
   const before={geometries:paused.geometries,textures:paused.textures};
   for(let i=0;i<5;i++)for(const view of ['home','top','front','left'])await page.locator('[data-camera='+view+']').click();
   const after=await page.evaluate(()=>window.campusPerformance.snapshot());
   await page.locator('#zoom-reset').click();await page.locator('[data-camera=home]').click();
   await page.locator('#performance-toggle').click();await page.screenshot({path:path.join(out,'performance-'+profile.name+'.png')});
   results.push({profile,coldLoadMs:cold.loadMs,glbDecodedBytes:cold.glbDecodedBytes,uniqueGLBs:cold.uniqueGLBs,cases,pausedFrames:paused.frames,resourceCountsStable:before.geometries===after.geometries&&before.textures===after.textures,before,after:{geometries:after.geometries,textures:after.textures}});
   console.log(profile.name+': '+cases.map(c=>c.case+' '+c.fps.toFixed(1)+' FPS / '+c.cpuSubmissionMs.p95.toFixed(1)+' ms CPU p95 / '+c.drawCalls+' calls').join('; '));await context.close();
  }
  const report={capturedAt:new Date().toISOString(),headless:!process.argv.includes('--headed'),notes:['8-second warm samples, 4 camera scenarios, fixed 30 fps target.','Phone profile is viewport/DPR emulation on this desktop, not a mobile GPU.','Budget thresholds are provisional prototype regression targets, not universal hardware guarantees.','Pause should produce zero frames; preset switching should retain resource counts.','Run at least three times on an otherwise idle machine and compare medians; use Performance panel on physical target devices.'],results,errors};
  report.sourceHashes=Object.fromEntries(await Promise.all(['app.js','campus-layout.js','ambient.js','guests.js','performance.js','companion.js','presentation.js','light-lines.js','index.html','style.css'].map(async f=>[f,createHash('sha256').update(await readFile(path.join(__dirname,f))).digest('hex')])));
  await writeFile(path.join(out,'performance.json'),JSON.stringify(report,null,2));
  if(errors.length||results.some(r=>r.pausedFrames!==0||!r.resourceCountsStable))throw Error('Performance correctness check failed; see report.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});

