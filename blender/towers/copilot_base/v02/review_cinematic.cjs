const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const project=path.resolve(__dirname,'../../../..');
const cast=[['copilot_base','v02','towers'],['copilot_octocat_classic_lowpoly','v01','towers'],['problem_bug','v01','enemies']];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:900}});
  for(const [id,version,category] of cast){
   if(process.argv[2]&&process.argv[2]!==id)continue;
   const folder=path.join(project,'blender',category,id,version),out=path.join(folder,'validation/cinematic');await fs.mkdir(out,{recursive:true});
   await page.goto(`http://127.0.0.1:4174/?asset=${id}&version=${version}`);
   await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
   await page.locator('#review-open').click();await page.locator('#background-select').selectOption('light');await page.locator('#ground-toggle').check();await page.locator('#review-close').click();
   const state=await page.evaluate(()=>window.inspectorState());const clips=state.entries[0].clips;const evidence=[];
   for(const clip of clips.filter(c=>c.name.startsWith('story_'))){
    const idx=clips.indexOf(clip);await page.locator('#clip-select').selectOption(String(idx));
    // Pause from observed UI state; seek exact authored pose.
    if((await page.locator('#play-button').textContent()).includes('Pause'))await page.locator('#play-button').click();
    for(const t of [0,.20,.30,.48,.65,.82,1]){
     await page.locator('[data-view="iso"]').click();await page.locator('#timeline').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));},clip.duration*t);
     const file=clip.name+'_'+Math.round(t*100)+'.png';await page.locator('#viewport').screenshot({path:path.join(out,file)});
     evidence.push({path:path.relative(project,path.join(out,file)).replaceAll('\\','/'),sha256:hash(await fs.readFile(path.join(out,file))),view:'Inspector iso',clip:clip.name,time:clip.duration*t});
    }
    await page.locator('[data-view="left"]').click();await page.locator('#timeline').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));},clip.duration*.48);
    const file=clip.name+'_side.png';await page.locator('#viewport').screenshot({path:path.join(out,file)});evidence.push({path:path.relative(project,path.join(out,file)).replaceAll('\\','/'),sha256:hash(await fs.readFile(path.join(out,file))),view:'Inspector side',clip:clip.name,time:clip.duration*.48});
    // Run multiple cycles at normal speed, then capture small-phone readability.
    await page.locator('[data-view="iso"]').click();await page.locator('#play-button').click();await page.waitForTimeout(clip.duration*2100);await page.locator('#play-button').click();
    await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();await page.locator('#timeline').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));},clip.duration*.30);
    const phone=clip.name+'_phone.png';await page.locator('#viewport').screenshot({path:path.join(out,phone)});evidence.push({path:path.relative(project,path.join(out,phone)).replaceAll('\\','/'),sha256:hash(await fs.readFile(path.join(out,phone))),view:'Inspector phone iso',clip:clip.name,time:clip.duration*.30});
    await page.locator('#review-open').click();await page.locator('#phone-toggle').uncheck();await page.locator('#review-close').click();
   }
   await fs.writeFile(path.join(out,'evidence.json'),JSON.stringify({state,evidence},null,2));console.log(id+' cinematic evidence '+evidence.length);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});


