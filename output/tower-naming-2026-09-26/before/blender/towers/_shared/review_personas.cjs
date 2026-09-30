const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const ids=['linter_agent'];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  for(const id of ids){
   const folder=path.resolve('blender/towers',id,'v01/validation');
   await page.goto('http://127.0.0.1:4174/?asset='+id+'&version=v01');
   await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
   await page.locator('#review-open').click();
   await page.locator('#background-select').selectOption('light');
   await page.locator('#review-close').click();
   if(await page.locator('#grid-button').getAttribute('aria-pressed')==='true')await page.locator('#grid-button').click();
   await page.locator('#viewport').screenshot({path:path.join(folder,'inspector_iso.png')});
   await page.locator('[data-view="bottom"]').click();
   await page.locator('#viewport').screenshot({path:path.join(folder,'inspector_underside.png')});
   await page.locator('[data-view="iso"]').click();
   await page.locator('#review-open').click();
   await page.locator('#phone-toggle').check();
   await page.locator('#review-close').click();
   assert((await page.locator('#viewport').boundingBox()).width<=391);
   await page.locator('#viewport').screenshot({path:path.join(folder,'inspector_phone.png')});
   await page.locator('#review-open').click();
   await page.locator('#silhouette-button').click();
   await page.locator('#review-close').click();
   await page.locator('#viewport').screenshot({path:path.join(folder,'inspector_small.png')});
   const m=JSON.parse(await fs.readFile(path.join(folder,'../asset.json'),'utf8'));
   await fs.writeFile(path.join(folder,'inspector_check.json'),JSON.stringify({asset:id,revision:m.revision,sha256:m.delivery.sha256,checkedAt:new Date().toISOString(),passed:errors.length===0,errors,checks:['registered GLB loads in shared Inspector','fixed underside capture','390px phone viewport','small silhouette capture'],visualReview:'Evidence captured; requires personal inspection.'},null,2));
   console.log(id+' shared Inspector captures complete');
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
