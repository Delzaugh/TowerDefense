// Screenshots of the registered runtime asset, with no viewer-only deformation.
const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{
 const m=JSON.parse(await fs.readFile(path.join(__dirname,'asset.json'),'utf8'));
 const out=path.join(__dirname,'validation','work_straps_r'+m.revision);await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1200,height:1000}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4174/?asset=bert_breugelmans&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.locator('#viewport').screenshot({path:path.join(out,name+'.png')});};
  const scrub=async f=>{await page.locator('#timeline').fill(String(Math.round(f/24*1000)/1000));await page.locator('#timeline').dispatchEvent('input');};
  for(const view of ['front','iso','right','left','rear']){
   await page.locator('[data-view="'+view+'"]').click();await page.locator('#frame-button').click();
   await page.locator('#clip-select').selectOption({label:'work'});
   for(const f of (view==='front'||view==='iso'?[0,12,24,38,52,64,76,92,108,120]:[24,38,76,108])){await scrub(f);await shot('work_'+view+'_'+f);}
  }
  for(const view of ['front','iso','right','left','rear']){
   await page.locator('[data-view="'+view+'"]').click();await page.locator('#frame-button').click();await page.locator('#zoom-in-button').click();
   const box=await page.locator('#viewport').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down({button:'right'});await page.mouse.move(box.x+box.width/2,box.y+box.height/2+100,{steps:6});await page.mouse.up({button:'right'});await page.locator('#zoom-in-button').click();
   for(const clip of ['work','celebrate_team']){
    await page.locator('#clip-select').selectOption({label:clip});
    for(const f of clip==='work'?[0,38,76]:[22,28,54]){await scrub(f);await shot('close_'+clip+'_'+view+'_'+f);}
   }
  }
  await page.locator('[data-view="iso"]').click();await page.locator('#frame-button').click();await page.locator('#clip-select').selectOption({label:'work'});
  await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();await scrub(76);await shot('phone_work');
  await page.locator('#review-open').click();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();await shot('phone_small');
  await fs.writeFile(path.join(out,'state.json'),JSON.stringify({revision:m.revision,sha256:m.delivery.sha256,errors,state:await page.evaluate(()=>window.inspectorState())},null,2));
  console.log(JSON.stringify({out,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
