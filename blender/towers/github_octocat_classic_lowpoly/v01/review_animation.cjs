const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1300,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4174/?asset=github_octocat_classic_lowpoly&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#review-open').click();await page.locator('#background-select').selectOption('light');await page.locator('#ground-toggle').check();await page.locator('#review-close').click();await page.locator('#grid-button').click();
  const canvas=page.locator('#viewport');const entries=(await page.evaluate(()=>window.inspectorState())).entries;
  for(const name of ['idle','move','wave','celebrate']){
   const i=entries[0].clips.findIndex(c=>c.name===name);const duration=entries[0].clips[i].duration;
   await page.locator('#clip-select').selectOption(String(i));await page.locator('#play-button').click();
   for(const t of [0,.17,.25,.375,.5,.625,.7,.74,1]){
    await page.locator('[data-view="front"]').click();
    await page.locator('#timeline').fill(String(Math.round(duration*t*1000)/1000));await page.locator('#timeline').dispatchEvent('input');
    await canvas.screenshot({path:__dirname+'/renders/anim_'+name+'_'+Math.round(t*100)+'.png'});
   }
   await page.locator('[data-view="left"]').click();await page.locator('#zoom-in-button').click();
   await page.locator('#timeline').fill(String(Math.round(duration*.4*1000)/1000));await page.locator('#timeline').dispatchEvent('input');
   await canvas.screenshot({path:__dirname+'/renders/anim_'+name+'_side.png'});
   if(name==='move'){
    await page.locator('[data-view="iso"]').click();await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();
    await canvas.screenshot({path:__dirname+'/renders/anim_move_phone.png'});
    await page.locator('#review-open').click();await page.locator('#phone-toggle').uncheck();await page.locator('#review-close').click();
   }
  }
  await page.locator('[data-view="iso"]').click();await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();
  await canvas.screenshot({path:__dirname+'/renders/anim_phone.png'});
  await fs.writeFile(__dirname+'/validation/animation_inspector.json',JSON.stringify({errors,entries},null,2));console.log(JSON.stringify({errors,clips:entries[0].clips}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
