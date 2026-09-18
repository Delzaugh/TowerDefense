const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1450,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const folder=__dirname;
  await page.goto('http://127.0.0.1:4174/?asset=github_octocat_classic&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#review-open').click();
  await page.locator('#background-select').selectOption('light');
  await page.locator('#ground-toggle').check();
  await page.locator('#review-close').click();
  await page.locator('#grid-button').click();
  const canvas=page.locator('#viewport');
  for(const view of ['front','left','rear','bottom','iso']){
   await page.locator('[data-view="'+view+'"]').click();
   await canvas.screenshot({path:folder+'/renders/join_full_'+view+'.png'});
   if(view==='bottom')continue;
   for(let i=0;i<4;i++)await page.locator('#zoom-in-button').click();
   const st=await page.evaluate(()=>window.inspectorState());const box=await canvas.boundingBox();
   const scale=2*st.distance*Math.tan(Math.PI/8)/box.height;
   const dy=(1.06-st.target[1])/scale;
   await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);
   await page.mouse.down({button:'right'});
   await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5+dy,{steps:8});
   await page.mouse.up({button:'right'});
   await canvas.screenshot({path:folder+'/renders/join_close_'+view+'.png'});
  }
  await page.locator('[data-view="iso"]').click();
  await page.locator('#review-open').click();
  await page.locator('#phone-toggle').check();
  await page.locator('#review-close').click();
  await canvas.screenshot({path:folder+'/renders/join_phone.png'});
  const state=await page.evaluate(()=>window.inspectorState());
  await fs.writeFile(folder+'/validation/inspector_check.json',JSON.stringify({errors,state},null,2));
  console.log(JSON.stringify({errors,entries:state.entries}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
