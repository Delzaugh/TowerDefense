// Author-only screenshots from the actual registered GLBs in the shared Inspector.
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createInspectorServer} from '../asset-inspector/server.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const id of process.argv.slice(2)){
  const folder=`blender/environment/${id}/v01/validation`;await mkdir(folder,{recursive:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?asset=${id}&version=v01`);
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#grid-button').click();await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();
  await page.locator('#frame-button').click();
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.locator('#viewport').screenshot({path:`${folder}/phone.png`});
  if(id==='gh_atrium'){
   await page.locator('#review-open').click();await page.locator('#phone-toggle').uncheck();await page.locator('#review-close').click();
   await page.locator('[data-view="left"]').click();await page.locator('#frame-button').click();
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.locator('#viewport').screenshot({path:`${folder}/west_access.png`});
  }
  if(errors.length)throw Error(errors.join('; '));await page.close();console.log(`${id} phone screenshot captured`);
 }
}finally{await browser.close();server.close();}
