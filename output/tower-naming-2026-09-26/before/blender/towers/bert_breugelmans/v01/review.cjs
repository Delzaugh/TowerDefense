// Runtime-only evidence from the registered shared Asset Inspector.
const fs=require('node:fs/promises');const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{
 const out=path.join(__dirname,'validation','extra-review');await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1300,height:1050}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4174/?asset=bert_breugelmans&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  const canvas=page.locator('#viewport');
  const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await canvas.screenshot({path:path.join(out,name+'.png')});};
  const view=async name=>page.locator('[data-view="'+name+'"]').click();
  const scrub=async(name,t)=>{await page.locator('#clip-select').selectOption({label:name});await page.locator('#timeline').fill(String(t));await page.locator('#timeline').dispatchEvent('input');};
  for(const v of ['iso','front','rear','left','right','top','bottom']){await view(v);await shot('rest_'+v);}
  await view('iso');await page.locator('#zoom-in-button').click();await shot('detail_iso');
  // Right-drag pans the camera target upward for a face/shoulder close-up.
  const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down({button:'right'});await page.mouse.move(box.x+box.width/2,box.y+box.height/2+160,{steps:10});await page.mouse.up({button:'right'});
  await page.locator('#zoom-in-button').click();await shot('detail_head_shoulders');
  await page.locator('#frame-button').click();
  for(const [name,times] of [['idle',[0,1.25,2.5]],['work',[0,.75,1.5,2.25,3]],['celebrate_team',[0,.8,1.26,1.60,1.94,2.28,2.62,3.2,4]]]){
   for(const t of times){await scrub(name,t);await shot(name+'_'+t.toFixed(3));}
  }
  for(const v of ['front','right','rear']){await view(v);await scrub('celebrate_team',1.26);await shot('clap_contact_'+v);}
  for(const v of ['iso','front','right','rear']){
   await view(v);await page.locator('#frame-button').click();
   for(const t of [0,.167,.333,.5,.667,.833,1,1.167,1.333]){await scrub('move',t);await shot('move_'+v+'_'+t.toFixed(3));}
  }
  await page.locator('#rest-button').click();await view('iso');await page.locator('#frame-button').click();
  await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await shot('phone');
  await page.locator('#silhouette-button').click();await shot('phone_silhouette');
  const state=await page.evaluate(()=>window.inspectorState());await fs.writeFile(path.join(out,'state.json'),JSON.stringify({errors,state},null,2));
  console.log(JSON.stringify({out,errors,state},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
