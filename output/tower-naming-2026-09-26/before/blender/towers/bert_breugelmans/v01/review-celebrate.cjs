// Review only the current registered GLB through the shared Asset Inspector.
const fs=require('node:fs/promises'); const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{
 const manifest=JSON.parse(await fs.readFile(path.join(__dirname,'asset.json'),'utf8'));
 const out=path.join(__dirname,'validation','celebrate_r'+manifest.revision);await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1100,height:1000}}); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4174/?asset=bert_breugelmans&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.locator('#viewport').screenshot({path:path.join(out,name+'.png')});};
  for(const view of ['front','right','iso','rear']){
   await page.locator('[data-view="'+view+'"]').click();
   await page.locator('#clip-select').selectOption({label:'celebrate_team'});
   for(const f of (view==='front'?[0,8,14,20,24,28,35,40,48,54,66,80,88,96]:view==='rear'?[22,54,80]:[14,22,28,35,54,80])) {
    await page.locator('#timeline').fill(String(Math.round(f/24*1000)/1000));await page.locator('#timeline').dispatchEvent('input');await shot(view+'_'+f);
   }
  }
  // Close frontal and oblique evidence of wrists and continuous sleeve joints.
  for(const view of ['front','iso','right']){
   await page.locator('[data-view="'+view+'"]').click();
   await page.locator('#frame-button').click();
   await page.locator('#zoom-in-button').click();
   const box=await page.locator('#viewport').boundingBox();
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down({button:'right'});
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2+100,{steps:6});await page.mouse.up({button:'right'});
   await page.locator('#zoom-in-button').click();
   for(const f of [20,28,54,80]){await page.locator('#timeline').fill(String(Math.round(f/24*1000)/1000));await shot('close_'+view+'_'+f);}
  }
  await page.locator('#frame-button').click();
  await page.locator('[data-view="iso"]').click();await page.locator('#review-open').click();await page.locator('#phone-toggle').check();
  await page.locator('#review-close').click();
  await page.locator('#timeline').fill((28/24).toFixed(3));await page.locator('#timeline').dispatchEvent('input');await shot('phone_contact');
  await page.locator('#review-open').click();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();await shot('phone_silhouette');
  await fs.writeFile(path.join(out,'state.json'),JSON.stringify({revision:manifest.revision,sha256:manifest.delivery.sha256,errors,state:await page.evaluate(()=>window.inspectorState())},null,2));
  console.log(JSON.stringify({out,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
