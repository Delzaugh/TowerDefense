const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||require.resolve('playwright',{paths:[process.cwd(),path.dirname(process.execPath),path.resolve(path.dirname(process.execPath),'..')]}));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4175/?asset=problem_missing_details&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#review-open').click();await page.locator('#ground-toggle').check();await page.locator('#review-close').click();
  await page.locator('#viewport').screenshot({path:path.join(__dirname,'inspector_iso.png')});
  for(const view of ['front','rear','left']) {
   await page.locator(`[data-view="${view}"]`).click();
   await page.locator('#viewport').screenshot({path:path.join(__dirname,`inspector_${view}.png`)});
  }
  await page.locator('[data-view="iso"]').click();
  for(const clip of ['idle','move','hit','resolve']) {
   await page.locator('#clip-select').selectOption({label:clip});
   if((await page.evaluate(()=>window.inspectorState())).entries[0].playing)await page.locator('#play-button').click();
   const duration=Number(await page.locator('#timeline').getAttribute('max'));
   for(const f of [.25,.75]) {
    await page.locator('#timeline').evaluate((input,t)=>{input.value=t;input.dispatchEvent(new Event('input',{bubbles:true}));},duration*f);
    await page.locator('#viewport').screenshot({path:path.join(__dirname,`inspector_${clip}_${f}.png`)});
   }
  }
  await page.locator('#rest-button').click();await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();
  await page.locator('#viewport').screenshot({path:path.join(__dirname,'inspector_phone.png')});
  await page.locator('#review-open').click();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();
  await page.locator('#viewport').screenshot({path:path.join(__dirname,'inspector_small.png')});
  fs.writeFileSync(path.join(__dirname,'inspector-review.json'),JSON.stringify({errors,state:await page.evaluate(()=>window.inspectorState())},null,2));
  console.log(JSON.stringify({errors,evidence:__dirname}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
