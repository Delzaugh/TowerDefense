// Focused visual evidence for the registered Lag Spike runtime delivery.
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||require.resolve('playwright',{paths:[process.cwd(),path.dirname(process.execPath),path.resolve(path.dirname(process.execPath),'..')]}));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const output=path.join(__dirname,'renders');fs.mkdirSync(output,{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:1050}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try {
  const {previewUrl}=await import(pathToFileURL(path.resolve('tools/asset-pipeline/asset.mjs')));
  const {findAsset}=await import(pathToFileURL(path.resolve('tools/asset-pipeline/contracts.mjs')));
  const url=await previewUrl(await findAsset('problem_lag_spike','v01'));
  await page.goto(url);await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#rest-button').click();
  await page.locator('#review-open').click();await page.locator('#ground-toggle').check();
  await page.locator('#review-close').click();
  const shot=async name=>{await page.screenshot({path:path.join(output,name+'-inspector.png')});await page.locator('#viewport').screenshot({path:path.join(output,name+'.png')});};
  for(const view of ['iso','front','rear','right','top']){
   await page.locator(`[data-view="${view}"]`).click();await shot('rest-'+view);
  }
  await page.locator('[data-view="iso"]').click();
  const states=[];
  for(const clip of ['idle','move','hit','resolve']){
   await page.locator('#clip-select').selectOption({label:clip});
   const state=await page.evaluate(()=>window.inspectorState());
   const duration=state.entries[0].clips.find(c=>c.name===clip).duration;
   for(const fraction of clip==='move'?[0,.125,.25,.375,.5,.625,.75,.875,1]:clip==='idle'?[0,.25,.32,.38,.43,.46,.5,.75,1]:[0,.25,.5,.75,1]){
    await page.locator('#timeline').evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},duration*fraction);
    states.push(await page.evaluate(()=>window.inspectorState()));
    await page.locator('#viewport').screenshot({path:path.join(output,clip+'-'+Math.round(fraction*100)+'.png')});
   }
  }
  await page.locator('#clip-select').selectOption({label:'move'});
  await page.locator('#timeline').evaluate(e=>{e.value=.27;e.dispatchEvent(new Event('input',{bubbles:true}));});
  await shot('hero');
  await page.locator('#review-open').click();await page.locator('#lighting-select').selectOption('gameplay');
  await page.locator('#phone-toggle').check();await page.locator('#review-close').click();await shot('phone');
  const width=(await page.locator('#viewport').boundingBox()).width;
  await page.locator('#review-open').click();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();await shot('small-silhouette');
  fs.writeFileSync(path.join(output,'inspector-review.json'),JSON.stringify({url,phoneWidth:width,errors,states},null,2));
  console.log(JSON.stringify({url,phoneWidth:width,errors,poses:states.length,output}));
  if(errors.length||width>391)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
