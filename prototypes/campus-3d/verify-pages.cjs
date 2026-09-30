const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {readFile,writeFile}=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../../game/node_modules/playwright');
(async()=>{
 const {buildPages}=await import(pathToFileURL(path.join(__dirname,'build-pages.mjs')));const built=await buildPages(),root=built.output,requests=[];
 const server=createServer(async(req,res)=>{requests.push({method:req.method,url:req.url});try{let url=new URL(req.url,'http://localhost').pathname;if(!url.startsWith('/TowerDefense/')){res.writeHead(404).end();return;}let relative=decodeURIComponent(url.slice('/TowerDefense/'.length));if(relative.endsWith('/')||!relative)relative+='index.html';const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||req.method!=='GET'){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.css':'text/css','.html':'text/html','.glb':'model/gltf-binary','.json':'application/json'}[path.extname(file)]||'text/plain'}).end(await readFile(file));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(`http://127.0.0.1:${server.address().port}/TowerDefense/`);await page.waitForFunction(()=>window.campusStudyState);await page.waitForFunction(()=>document.querySelector('#loading').hidden);assert.equal(await page.locator('a[href*="127.0.0.1"]').count(),0);await page.screenshot({path:path.join(__dirname,'previews/pages-campus-phone.png')});
  await page.locator('#simulation-toggle').click();await page.waitForFunction(()=>window.simulationStudy);assert.equal(await page.locator('[data-tower]').count(),7);assert.equal(await page.evaluate(()=>simulationStudy.state().actors.cap),200);await page.screenshot({path:path.join(__dirname,'previews/pages-simulation-phone.png')});
  assert.equal(await page.locator('#enemy-limit').textContent(),'/ 200');
  // Exercise the newly animated Developer through the same commands as the palette.
  await page.evaluate(()=>{const p=simulationStudy.placement;p.select('copilot_developer');for(let x=-30;x<30;x+=3)for(let z=-20;z<25;z+=3)if(p.validAt(x,z).valid){p.placeAt(x,z);return;}throw Error('No developer clearing');});
  await page.waitForFunction(()=>simulationStudy.state().actors.developerSamples.some(a=>a.clip==='place'&&a.time>.2));
  const placementSample=await page.evaluate(()=>simulationStudy.state().actors.developerSamples.find(a=>a.clip==='place'));
  assert.equal(placementSample.effect.clip,'place');assert(placementSample.effect.timelineProgress>0);
  await page.screenshot({path:path.join(__dirname,'previews/pages-developer-assembly.png')});
  await page.waitForFunction(()=>simulationStudy.placement.state().animating===0);
  assert((await page.evaluate(()=>simulationStudy.state().actors.developerSamples)).every(a=>a.clip==='idle'));
  await page.locator('#build-toggle').click();await page.locator('#placement-undo').click();
  await page.waitForFunction(()=>simulationStudy.state().actors.presentation.retiring===1);
  assert.equal(await page.evaluate(()=>simulationStudy.state().actors.manualTowers),0);
  await page.waitForFunction(()=>simulationStudy.placement.state().animating===0);
  assert.equal(await page.evaluate(()=>simulationStudy.state().actors.presentation.fragments),0);
  await page.locator('#palette-close').click();
  await page.locator('#settings-toggle').click();await page.locator('#max-enemies').fill('25');await page.locator('#max-enemies').press('Tab');await page.locator('#settings-close').click();await page.locator('#run').click();await page.waitForFunction(()=>simulationStudy.capture().phase==='waves',null,{timeout:30000});await page.waitForFunction(()=>simulationStudy.state().actors.developerSamples.every(a=>a.clip==='work'&&a.time>.1));await page.waitForFunction(()=>!simulationStudy.capture().running,null,{timeout:180000});
  const report=await page.evaluate(()=>simulationStudy.capture().report);assert.equal(report.status,'completed',report.reason);assert(report.correctnessPassed);assert.equal(report.storage.mode,'browser-download');assert.equal(report.waveResult.arrived,50);assert(report.cases.every(c=>c.screenshot.startsWith('data:image/png;base64,')));assert(report.revision.runtimeAssets.length>30);assert(!report.saveError);assert(!requests.some(r=>r.method==='POST'));
  const pending=page.waitForEvent('download');await page.locator('#download-report').click();const download=await pending;assert.match(download.suggestedFilename(),/^garden-waves-/);const saved=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(saved.waveResult.arrived,50);assert(saved.cases.every(c=>c.screenshot.startsWith('data:image/png;base64,')));
  assert.deepEqual(errors,[]);await writeFile(path.join(__dirname,'previews/pages-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),built,passed:true,campus:true,simulation:true,fullPhoneLayoutRun:true,reportDownload:true,errors},null,2));console.log('Static /TowerDefense/ deployment: campus, simulation, seven tower cards, full 50-enemy run, captures and report download passed.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
