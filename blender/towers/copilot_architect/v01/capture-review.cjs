const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1050}});
 const out=path.join(__dirname,'validation','inspector');await fs.mkdir(out,{recursive:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4174/?asset=copilot_architect&version=v01');
 await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 await page.locator('#grid-button').click();
 const canvas=page.locator('#viewport');
 for(const view of ['iso','front','left','right','rear','bottom']){
   await page.locator(`[data-view="${view}"]`).click();
   await page.waitForTimeout(140);
   await canvas.screenshot({path:path.join(out,view+'.png')});
 }
 await page.locator('[data-view="iso"]').click();
 await page.locator('#zoom-in-button').click();
 await canvas.screenshot({path:path.join(out,'close_oblique.png')});
 await page.locator('#frame-button').click();
 await page.locator('#review-open').click();
 await page.locator('#lighting-select').selectOption('gameplay');
 await page.locator('#ground-toggle').check();
 await page.locator('#phone-toggle').check();
 await page.locator('#review-close').click();
 await canvas.screenshot({path:path.join(out,'phone.png')});
 await page.locator('#review-open').click();
 await page.locator('#silhouette-button').click();
 await page.locator('#review-close').click();
 await canvas.screenshot({path:path.join(out,'small.png')});
 const state=await page.evaluate(()=>window.inspectorState());
 await fs.writeFile(path.join(out,'state.json'),JSON.stringify({state,errors},null,2));
 console.log(JSON.stringify({errors,loaded:state.entries.map(e=>({path:e.path,sha256:e.revision})),out}));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
