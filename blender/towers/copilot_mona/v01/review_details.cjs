// Second author pass: exposed joints, gesture extremes, blink and loop joins.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises'),path=require('node:path');
const sha=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1060}});
  await page.goto('http://127.0.0.1:4174/?asset=copilot_mona&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#grid-button').click();
  const frames=[];
  for(const [view,clip,progress] of [
   ['front','wave',.375],['front','wave',.625],['front','wave',.84],['front','idle',.7],
   ['rear','work',.5],['rear','wave',.625],['rear','hit',.25],['rear','move',.25],
   ['left','work',.375],['left','celebrate',.48],
  ]){
   await page.locator('[data-view="'+view+'"]').click();
   await page.locator('#zoom-in-button').click();
   await page.locator('#clip-select').selectOption({label:clip});
   await page.locator('#play-button').click();
   const s=await page.evaluate(()=>window.inspectorState()),time=Number((s.entries[0].clips.find(c=>c.name===clip).duration*progress).toFixed(3));
   await page.locator('#timeline').fill(String(time));await page.locator('#timeline').dispatchEvent('input');
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const file='detail-'+view+'-'+clip+'-'+Math.round(progress*100)+'.png';
   const bytes=await page.locator('#viewport').screenshot({path:path.join(__dirname,'validation/motion',file)});
   frames.push({file,sha256:sha(bytes),view,clip,progress,time});
  }
  await page.locator('#rest-button').click();
  await fs.writeFile(path.join(__dirname,'validation/motion/second_pass.json'),JSON.stringify({frames,checkedAt:new Date().toISOString(),state:await page.evaluate(()=>window.inspectorState())},null,2)+'\n');
  console.log(JSON.stringify({captured:frames.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
