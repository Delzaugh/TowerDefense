import fs from 'node:fs';import {createRequire} from 'node:module';import {createInspectorServer} from '../asset-inspector/server.mjs';const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/jonas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const id of ['gh_mural_universe','gh_mural_currents','gh_mural_collaboration']){
 await page.goto(`http://127.0.0.1:${server.address().port}/?asset=${id}&version=v01`);try{await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);}catch(e){console.log({id,errors,state:await page.evaluate(()=>window.inspectorState?.()),body:(await page.locator('body').innerText()).slice(-1200)});throw e;}
 await page.locator('#grid-button').click();const folder=`blender/environment/${id}/v01/validation`;
 for(const view of ['front','iso','rear']){await page.locator(`[data-view="${view}"]`).click();await page.locator('#frame-button').click();await page.evaluate(()=>new Promise(requestAnimationFrame));await page.locator('#viewport').screenshot({path:folder+`/inspector-${view}.png`});}
 await page.locator('[data-view="front"]').click();await page.locator('#frame-button').click();await page.locator('#zoom-in-button').click();await page.locator('#viewport').screenshot({path:folder+'/inspector-detail.png'});
 await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();await page.evaluate(()=>new Promise(requestAnimationFrame));await page.locator('#frame-button').click();await page.locator('#viewport').screenshot({path:folder+'/inspector-phone.png'});
 console.log(id+' shared Inspector views captured');
}
fs.writeFileSync('artifacts/github-campus/mural-inspector.json',JSON.stringify({errors,inspectedAt:new Date().toISOString()},null,2));if(errors.length)throw Error(errors.join('\n'));}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
