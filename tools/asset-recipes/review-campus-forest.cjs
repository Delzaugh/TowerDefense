const {chromium}=require('../../game/node_modules/playwright');
const {readFile,mkdir,writeFile}=require('node:fs/promises');
const {createHash}=require('node:crypto');
(async()=>{
 const entries=JSON.parse(await readFile('tools/asset-recipes/campus-forest-entries.json','utf8'));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1040}});
  page.on('pageerror',e=>errors.push(e.message));
  for(const e of entries.filter(e=>process.argv.length<=2||process.argv.slice(2).includes(e.id))){
   const dir=`blender/environment/${e.id}/v01`,m=JSON.parse(await readFile(dir+'/asset.json','utf8'));
   const responses=[];page.on('response',r=>{if(r.url().includes(e.id+'_v01.glb'))responses.push(r)});
   await page.goto('http://127.0.0.1:4175/?asset='+e.id+'&version=v01');
   await page.waitForFunction(id=>window.inspectorState&&!window.inspectorState().loading&&window.inspectorState().entries[0]?.path==='environment/'+id+'_v01.glb',e.id);
   const loaded=responses.at(-1);if(!loaded)throw Error('Missing runtime response: '+e.id);
   const sha=createHash('sha256').update(await loaded.body()).digest('hex');if(sha!==m.delivery.sha256)throw Error('Loaded hash mismatch: '+e.id);
   await page.locator('#review-open').click();await page.locator('#background-select').selectOption('light');await page.locator('#ground-toggle').check();await page.locator('#review-close').click();
   await mkdir(dir+'/renders',{recursive:true});
   for(const view of ['iso','rear','bottom','top']){
    await page.locator('[data-view='+view+']').click();
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await page.locator('#viewport').screenshot({path:dir+'/renders/inspector-'+view+'.png'});
   }
   await page.locator('[data-view=iso]').click();await page.locator('#zoom-in-button').click();
   await page.locator('#viewport').screenshot({path:dir+'/renders/inspector-close.png'});
   await page.locator('#frame-button').click();
   await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();
   await page.locator('#viewport').screenshot({path:dir+'/renders/inspector-phone.png'});
   await writeFile(dir+'/renders/inspector-session.json',JSON.stringify({sha256:sha,revision:m.revision,capturedAt:new Date().toISOString(),state:await page.evaluate(()=>window.inspectorState()),errors:[...errors]},null,2)+'\n');
   await page.locator('#review-open').click();await page.locator('#phone-toggle').uncheck();await page.locator('#review-close').click();
   console.log('Inspector captured: '+e.id);
  }
  if(errors.length)throw Error(errors.join('\n'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
