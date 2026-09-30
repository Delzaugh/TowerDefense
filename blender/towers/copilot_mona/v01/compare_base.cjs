const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1450,height:1100}});await page.goto('http://127.0.0.1:4174/?asset=copilot_mona&version=v01');await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 await page.locator('#review-open').click();await page.locator('#background-select').selectOption('light');await page.locator('#ground-toggle').check();await page.locator('#comparison-select').selectOption('towers/copilot_octocat_classic_lowpoly_v01.glb');await page.locator('#compare-asset').click();await page.waitForFunction(()=>window.inspectorState().entries.length===2&&!window.inspectorState().loading);await page.locator('#review-close').click();await page.locator('#rest-button').click();await page.locator('#grid-button').click();
 for(const view of ['front','left','iso']){await page.locator('[data-view="'+view+'"]').click();await page.locator('#viewport').screenshot({path:__dirname+'/renders/base-comparison-'+view+'.png'});}
 const state=await page.evaluate(()=>window.inspectorState());await fs.writeFile(__dirname+'/validation/base_comparison.json',JSON.stringify(state,null,2));console.log(JSON.stringify(state.entries));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
