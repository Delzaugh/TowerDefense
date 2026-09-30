const fs=require('node:fs');const path=require('node:path');
const {chromium}=require('C:/Users/jonas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1400,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const plan=JSON.parse(fs.readFileSync('tools/github-campus-kit/plan.json'));
for(const a of plan.assets.filter(a=>a.owner==='site'&&(!process.argv.slice(2).length||process.argv.slice(2).includes(a.id)))){
 await page.goto(`http://127.0.0.1:4174/?asset=${a.id}&version=v01`);await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 await page.locator('#review-open').click();await page.locator('#background-select').selectOption('light');await page.locator('#ground-toggle').check();await page.locator('#review-close').click();
 const folder=`blender/environment/${a.id}/v01/validation`;
 await page.locator('[data-view="iso"]').click();await page.locator('#viewport').screenshot({path:path.join(folder,'inspector-iso.png')});
 await page.locator('[data-view="rear"]').click();await page.locator('#viewport').screenshot({path:path.join(folder,'inspector-rear.png')});
 await page.locator('[data-view="iso"]').click();await page.locator('#zoom-in-button').click();await page.locator('#viewport').screenshot({path:path.join(folder,'inspector-detail.png')});
 if(a.id==='gh_ceiling_services'){
  await page.locator('#review-open').click();await page.locator('#ground-toggle').uncheck();await page.locator('#review-close').click();await page.locator('[data-view="bottom"]').click();await page.locator('#viewport').screenshot({path:path.join(folder,'inspector-underside.png')});await page.locator('[data-view="iso"]').click();
 }
 await page.locator('#frame-button').click();await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();await page.evaluate(()=>new Promise(requestAnimationFrame));await page.locator('#frame-button').click();await page.locator('#viewport').screenshot({path:path.join(folder,'inspector-phone.png')});
 console.log(a.id+': fixed and phone views captured');
}
fs.writeFileSync('artifacts/github-campus/site-inspector.json',JSON.stringify({errors,inspectedAt:new Date().toISOString()},null,2));await browser.close();if(errors.length)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});
