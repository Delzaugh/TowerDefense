const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises');const path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const folder=path.join(__dirname,'validation/side-detail-evaluation-r45');await fs.mkdir(folder,{recursive:true});
try{const page=await browser.newPage({viewport:{width:1350,height:1000}});await page.goto('http://127.0.0.1:4174/?asset=copilot_architect&version=v01');
await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
const state=await page.evaluate(()=>window.inspectorState());await fs.writeFile(path.join(folder,'inspector-state.json'),JSON.stringify(state,null,2));
await page.locator('#zoom-in-button').click();await page.locator('#zoom-in-button').click();
for(const view of ['left','right']){await page.locator(`[data-view="${view}"]`).click();await page.waitForTimeout(100);await page.locator('#viewport').screenshot({path:path.join(folder,view+'.png')});}
for(const sign of [-1,1]){await page.locator('[data-view="front"]').click();const b=await page.locator('#viewport').boundingBox();const x=b.x+b.width*.5,y=b.y+b.height*.5;
await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+sign*145,y-30,{steps:12});await page.mouse.up();await page.waitForTimeout(100);
await page.locator('#viewport').screenshot({path:path.join(folder,sign<0?'oblique-a.png':'oblique-b.png')});}
console.log(JSON.stringify({hash:state.entries[0].revision,views:4}));}finally{await browser.close();}})();
