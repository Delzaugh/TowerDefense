// Review only the registered asset in the shared Inspector.
const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{
 const m=JSON.parse(await fs.readFile(path.join(__dirname,'asset.json'),'utf8'));
 const out=path.join(__dirname,'validation','proportions_walk_r'+m.revision);await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1200,height:1000}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4174/?asset=bert_breugelmans&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.locator('#viewport').screenshot({path:path.join(out,name+'.png')});};
  const scrub=async f=>{await page.locator('#timeline').fill(String(Math.round(f/24*1000)/1000));await page.locator('#timeline').dispatchEvent('input');};
  for(const view of ['front','right','rear','iso']){
   await page.locator('[data-view="'+view+'"]').click();await page.locator('#frame-button').click();await page.locator('#rest-button').click();await shot('rest_'+view);
   await page.locator('#clip-select').selectOption({label:'move'});
   for(const f of view==='right'?[0,3,6,9,12,15,18,21,24,27,30,33,36]:[0,6,12,18,24,30,36]){await scrub(f);await shot('move_'+view+'_'+f);}
  }
  for(const view of ['front','iso','right','left']){
   await page.locator('[data-view="'+view+'"]').click();await page.locator('#frame-button').click();await page.locator('#zoom-in-button').click();
   const box=await page.locator('#viewport').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down({button:'right'});await page.mouse.move(box.x+box.width/2,box.y+box.height/2+100,{steps:6});await page.mouse.up({button:'right'});await page.locator('#zoom-in-button').click();
   await page.locator('#clip-select').selectOption({label:'work'});
   for(const f of [24,38,64,76,108]){await scrub(f);await shot('work_'+view+'_'+f);}
   await page.locator('#clip-select').selectOption({label:'celebrate_team'});await scrub(28);await shot('celebrate_'+view+'_28');
  }
  await page.locator('[data-view="iso"]').click();await page.locator('#frame-button').click();await page.locator('#clip-select').selectOption({label:'move'});
  await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();await scrub(12);await shot('phone_move');
  await page.locator('#review-open').click();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();await shot('phone_small');
  await fs.writeFile(path.join(out,'state.json'),JSON.stringify({revision:m.revision,sha256:m.delivery.sha256,errors,state:await page.evaluate(()=>window.inspectorState())},null,2));
  console.log(JSON.stringify({out,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
