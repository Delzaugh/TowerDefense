const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1450,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4174/?asset=copilot_mona&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#rest-button').click();
  await page.locator('#review-open').click();
  await page.locator('#background-select').selectOption('light');
  await page.locator('#ground-toggle').check();
  await page.locator('#review-close').click();
  await page.locator('#grid-button').click();
  const canvas=page.locator('#viewport');
  for(const view of ['front','left','rear','bottom','iso']){
   await page.locator('[data-view="'+view+'"]').click();
   await canvas.screenshot({path:__dirname+'/renders/inspector-'+view+'.png'});
   if(view==='bottom')continue;
   for(let i=0;i<2;i++)await page.locator('#zoom-in-button').click();
   await canvas.screenshot({path:__dirname+'/renders/detail-'+view+'.png'});
  }
  await page.locator('[data-view="iso"]').click();
  await page.locator('#review-open').click();
  await page.locator('#phone-toggle').check();
  await page.locator('#review-close').click();
  await canvas.screenshot({path:__dirname+'/renders/inspector-phone.png'});
  await page.locator('#review-open').click(); await page.locator('#phone-toggle').uncheck(); await page.locator('#silhouette-button').click(); await page.locator('#review-close').click(); await canvas.screenshot({path:__dirname+'/renders/inspector-small.png'}); const state=await page.evaluate(()=>window.inspectorState());
  await fs.writeFile(__dirname+'/validation/inspector_check.json',JSON.stringify({errors,state},null,2));
  console.log(JSON.stringify({errors,entries:state.entries}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

