const path=require('node:path');
const fs=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
 const out=path.join(__dirname,'validation');
 try{
  await page.goto('http://127.0.0.1:4174/?asset=copilot_tester&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#review-open').click();await page.locator('#background-select').selectOption('light');await page.locator('#review-close').click();
  if(await page.locator('#grid-button').getAttribute('aria-pressed')==='true')await page.locator('#grid-button').click();
  for(const v of ['iso','front','rear','right','bottom']){
   await page.locator('[data-view="'+v+'"]').click();
   await page.locator('#viewport').screenshot({path:path.join(out,'inspector_'+v+'.png')});
  }
  await page.locator('[data-view="rear"]').click();
  let box=await page.locator('#viewport').boundingBox();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();
  await page.mouse.move(box.x+box.width*.62,box.y+box.height*.57,{steps:12});await page.mouse.up();
  await page.locator('#viewport').screenshot({path:path.join(out,'inspector_rear_oblique.png')});
  await page.locator('[data-view="iso"]').click();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.wheel(0,-180);
  await page.waitForTimeout(300);
  await page.locator('#viewport').screenshot({path:path.join(out,'inspector_close.png')});
  await page.locator('[data-view="iso"]').click();
  await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();
  await page.locator('#viewport').screenshot({path:path.join(out,'inspector_phone.png')});
  await page.locator('#review-open').click();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();
  await page.locator('#viewport').screenshot({path:path.join(out,'inspector_small.png')});
  const m=JSON.parse(await fs.readFile(path.join(__dirname,'asset.json'),'utf8'));
  const report={asset:m.id,revision:m.revision,sha256:m.delivery.sha256,sourceHash:m.delivery.sourceHash,checkedAt:new Date().toISOString(),passed:!errors.length,errors,state:await page.evaluate(()=>window.inspectorState()),visualReview:'Captured; personal visual inspection follows.'};
  await fs.writeFile(path.join(out,'inspector_check.json'),JSON.stringify(report,null,2));
  if(errors.length)throw Error(errors.join('; '));
  console.log('Tester revision '+m.revision+' shared Inspector captures ready.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
