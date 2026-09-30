import {createRequire} from 'node:module';import fs from 'node:fs/promises';import {createInspectorServer} from '../asset-inspector/server.mjs';
const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/jonas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try {for(const id of ['gh_bookshelf_pod','gh_worklounge_pod','gh_recessed_lounge']){
 const folder=`blender/environment/${id}/v01/validation`,manifest=JSON.parse(await fs.readFile(`blender/environment/${id}/v01/asset.json`,'utf8'));
 const page=await browser.newPage({viewport:{width:1500,height:1050}}),errors=[],states=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/?asset=${id}&version=v01`);await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);await page.locator('#grid-button').click();
 for(const view of ['front','iso','rear','left']){
  await page.locator(`[data-view="${view}"]`).click();await page.locator('#frame-button').click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.locator('#viewport').screenshot({path:folder+`/inspector-${view}.png`});states.push({view,state:await page.evaluate(()=>window.inspectorState())});
 }
 // Left-side oblique displays both the bookshelf face and its occupied side portal.
 await page.locator(id==='gh_bookshelf_pod'?'[data-view="front"]':'[data-view="iso"]').click();const bounds=await page.locator('canvas').first().boundingBox();
 if(id==='gh_bookshelf_pod'){await page.mouse.move(bounds.x+bounds.width*.50,bounds.y+bounds.height*.50);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.62,bounds.y+bounds.height*.45,{steps:18});await page.mouse.up();}
 await page.locator('#frame-button').click();await page.locator('#zoom-in-button').click();await page.locator('#viewport').screenshot({path:folder+'/inspector-close.png'});states.push({view:'close-left-oblique',state:await page.evaluate(()=>window.inspectorState())});
 await page.setViewportSize({width:390,height:844});await page.locator(id==='gh_bookshelf_pod'?'[data-view="left"]':'[data-view="iso"]').click();await page.locator('#frame-button').click();
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.locator('#viewport').screenshot({path:folder+'/inspector-phone.png'});states.push({view:'390px-phone',state:await page.evaluate(()=>window.inspectorState())});
 await fs.writeFile(folder+'/inspector-evidence.json',JSON.stringify({id,revision:manifest.revision,sha256:manifest.delivery.sha256,sourceHash:manifest.delivery.sourceHash,states,errors},null,2));
 if(errors.length)throw Error(errors.join('\n'));console.log(id+' current GLB front/oblique/reverse/left/close/390px screenshots captured');await page.close();
}}finally{await browser.close();server.close();}

