const { chromium }=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises');const path=require('node:path');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1350,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
await page.goto('http://127.0.0.1:4174/?asset=copilot_architect&version=v01');
await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
const state=await page.evaluate(()=>window.inspectorState());
await fs.writeFile(path.join(__dirname,'validation/inspector-state.json'),JSON.stringify(state,null,2));
async function capture(name){await page.waitForTimeout(150);await page.locator('#viewport').screenshot({path:path.join(__dirname,'validation',name)});}
await page.locator('#zoom-in-button').click();await page.locator('#zoom-in-button').click();
for(const view of ['iso','front','left','rear','bottom']){await page.locator(`[data-view="${view}"]`).click();await capture(`close-${view}.png`);}
await page.locator('[data-view="iso"]').click();await page.locator('#frame-button').click();
await page.locator('#review-open').click();await page.locator('#phone-toggle').check();
await page.locator('#review-close').click();await capture('phone.png');
await page.locator('#review-open').click();await page.locator('#silhouette-button').click();
await page.locator('#review-close').click();await capture('small-silhouette.png');
if(errors.length)throw Error(errors.join('; '));console.log(JSON.stringify({loaded:state.entries,errors},null,2));
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
