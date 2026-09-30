const fs=require('node:fs/promises'),path=require('node:path');const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{
 const manifest=JSON.parse(await fs.readFile(path.join(__dirname,'asset.json'),'utf8'));
 const out=path.join(__dirname,'validation','hands_motion_r'+manifest.revision);await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1000}});await page.goto('http://127.0.0.1:4174/?asset=bert_breugelmans&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  const capture=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.locator('#viewport').screenshot({path:path.join(out,name+'.png')});};
  for(const view of ['front','iso','rear','right','left']){
   await page.locator('[data-view="'+view+'"]').click();await page.locator('#frame-button').click();await page.locator('#rest-button').click();
   for(let i=0;i<5;i++)await page.locator('#zoom-in-button').click();
   const box=await page.locator('#viewport').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down({button:'right'});await page.mouse.move(box.x+box.width/2,box.y+box.height/2-150,{steps:5});await page.mouse.up({button:'right'});
   await capture('rest_'+view);
   await page.locator('#clip-select').selectOption({label:'move'});
   for(const f of [0,9,18,27]){await page.locator('#timeline').fill(String(f/24));await page.locator('#timeline').dispatchEvent('input');await capture('move_'+view+'_'+f);}
   // Raise framing for the offered palms and clap, preserving the close scale.
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down({button:'right'});await page.mouse.move(box.x+box.width/2,box.y+box.height/2+160,{steps:5});await page.mouse.up({button:'right'});
   for(const [clip,frame] of [['work',64],['celebrate_team',28]]){
    await page.locator('#clip-select').selectOption({label:clip});await page.locator('#timeline').fill(String(Math.round(frame/24*1000)/1000));await page.locator('#timeline').dispatchEvent('input');await capture(clip+'_'+view);
   }
  }
  console.log(out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
