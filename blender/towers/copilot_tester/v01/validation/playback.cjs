const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:900}});
  await page.goto('http://127.0.0.1:4174/?asset=copilot_tester&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  const clips=(await page.evaluate(()=>window.inspectorState())).entries[0].clips;
  const output=path.join(__dirname,'animation');const observations=[];
  for(const clip of clips){
   await page.locator('#clip-select').selectOption({label:clip.name});
   // Selection begins normal-speed playback. Watch two complete loop cycles.
   const states=[];
   for(let i=0;i<8;i++){
    await page.waitForTimeout(clip.duration*1000/8);
    states.push(await page.evaluate(()=>window.inspectorState().entries[0]));
    await page.locator('#viewport').screenshot({path:path.join(output,`play-${clip.name}-${i}.png`)});
   }
   if(['idle','work','move'].includes(clip.name))await page.waitForTimeout(clip.duration*1000);
   observations.push({clip:clip.name,states});
   await page.locator('#rest-button').click();
  }
  await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();
  for(const clip of clips){
   await page.locator('#clip-select').selectOption({label:clip.name});
   await page.waitForTimeout(clip.duration*500);
   await page.locator('#play-button').click();
   await page.locator('#viewport').screenshot({path:path.join(output,`phone-${clip.name}.png`)});
   await page.locator('#rest-button').click();
  }
  await fs.writeFile(path.join(output,'playback.json'),JSON.stringify(observations,null,2));
  console.log('Normal-speed two-cycle loops, one-shots and phone captures complete.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
