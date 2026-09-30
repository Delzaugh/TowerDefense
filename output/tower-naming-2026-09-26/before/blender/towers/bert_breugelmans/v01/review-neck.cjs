const fs=require('node:fs/promises'),path=require('node:path');const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{
 const m=JSON.parse(await fs.readFile(path.join(__dirname,'asset.json'),'utf8'));
 const out=path.join(__dirname,'validation','neck_r'+m.revision);await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4174/?asset=bert_breugelmans&version=v01');await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.locator('#viewport').screenshot({path:path.join(out,name+'.png')});};
  for(const view of ['iso','left','right','front','rear']){
   await page.locator('[data-view="'+view+'"]').click();await page.locator('#frame-button').click();await page.locator('#rest-button').click();
   for(let i=0;i<6;i++)await page.locator('#zoom-in-button').click();
   const box=await page.locator('#viewport').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
   await page.mouse.move(x,y);await page.mouse.down({button:'right'});await page.mouse.move(x,y+285,{steps:8});await page.mouse.up({button:'right'});
   // Raise the orbit to expose the collar opening from both shoulders.
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-(view==='iso'?40:105),{steps:6});await page.mouse.up();
   await shot('rest_'+view);
   for(const [clip,frames] of [['idle',[15,45]],['work',[24,64,96]],['celebrate_team',[28,54,72]],['move',[0,9,18,27]]]){
    await page.locator('#clip-select').selectOption({label:clip});
    for(const f of frames){await page.locator('#timeline').fill(String(Math.round(f/24*1000)/1000));await page.locator('#timeline').dispatchEvent('input');await shot(clip+'_'+view+'_'+f);}
   }
  }
  await page.locator('[data-view="iso"]').click();await page.locator('#frame-button').click();await page.locator('#rest-button').click();await shot('game_scale');
  await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();await shot('phone_scale');
  await fs.writeFile(path.join(out,'state.json'),JSON.stringify({revision:m.revision,sha256:m.delivery.sha256,errors,state:await page.evaluate(()=>window.inspectorState())},null,2));console.log(out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
