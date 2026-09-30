// Review real-time playback controls in the registered shared Inspector.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4174/?asset=copilot_developer&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  const state=()=>page.evaluate(()=>window.inspectorState().entries[0]);
  const rest=await state();const evidence=[];
  await page.locator('#review-open').click();await page.locator('#phone-toggle').check();
  await page.locator('#lighting-select').selectOption('gameplay');await page.locator('#review-close').click();
  for(const c of rest.clips){
   await page.locator('#clip-select').selectOption({label:c.name});
   const loop=['idle','work','move'].includes(c.name);assert.equal((await state()).loop,loop);
   await page.waitForTimeout((loop?c.duration*2.2:c.duration+.15)*1000);
   const after=await state();assert.equal(after.playing,loop,`${c.name} loop/hold`);
   // Scrub exact extremes after normal-speed playback.
   const time=Number((c.duration*(c.name==='idle'?.70:c.name==='hit'?.22:.5)).toFixed(3));
   await page.locator('#timeline').fill(String(time));await page.locator('#timeline').dispatchEvent('input');
   const filename=`phone-${c.name}.png`,bytes=await page.locator('#viewport').screenshot({path:path.join(__dirname,'animation',filename)});
   evidence.push({file:filename,sha256:createHash('sha256').update(bytes).digest('hex'),clip:c.name,time,view:'isometric, phone viewport, gameplay light',afterPlayback:after});
   await page.locator('#rest-button').click();const reset=await state();
   assert.equal(reset.clip,null);assert.deepEqual(reset.pose,rest.pose,`${c.name} reset`);
  }
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(__dirname,'animation','inspector_playback.json'),JSON.stringify({passed:true,revision:rest.revision,clips:rest.clips,evidence,errors},null,2));
  console.log(JSON.stringify({passed:true,clips:rest.clips.length,revision:rest.revision}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
