const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1450,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const style of ['classic','modern']){
   const folder=path.resolve('blender/towers/github_octocat_'+style+'/v01');
   await page.goto('http://127.0.0.1:4174/?asset=github_octocat_'+style+'&version=v01');
   await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
   await page.locator('#review-open').click();
   await page.locator('#background-select').selectOption('light');
   await page.locator('#ground-toggle').check();
   await page.locator('#review-close').click();
   await page.locator('#grid-button').click();
   const canvas=page.locator('#viewport');
   const panTarget=async(desiredY)=>{
    const st=await page.evaluate(()=>window.inspectorState());const box=await canvas.boundingBox();
    const scale=2*st.distance*Math.tan(Math.PI/8)/box.height;
    const dy=(desiredY-st.target[1])/scale;
    await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);
    await page.mouse.down({button:'right'});
    await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5+dy,{steps:8});
    await page.mouse.up({button:'right'});
   };
   for(const view of ['front','left','rear','bottom']){
    await page.locator('[data-view="'+view+'"]').click();
    await canvas.screenshot({path:folder+'/renders/detail_'+view+'.png'});
   }
   await page.locator('[data-view="front"]').click();
   await page.locator('#zoom-in-button').click();await page.locator('#zoom-in-button').click();
   await panTarget(style==='classic'?2.05:2.38);
   await canvas.screenshot({path:folder+'/renders/face_close.png'});
   await page.locator('[data-view="front"]').click();
   await page.locator('#zoom-in-button').click();await page.locator('#zoom-in-button').click();
   await panTarget(.75);
   await canvas.screenshot({path:folder+'/renders/tentacles_close.png'});
   await page.locator('[data-view="iso"]').click();
   await page.locator('#viewport').screenshot({path:folder+'/renders/inspector_iso.png'});
   await page.locator('[data-view="rear"]').click();
   await page.locator('#viewport').screenshot({path:folder+'/renders/inspector_rear.png'});
   await page.locator('[data-view="iso"]').click();
   await page.locator('#review-open').click();
   await page.locator('#phone-toggle').check();
   await page.locator('#review-close').click();
   await page.locator('#viewport').screenshot({path:folder+'/renders/phone.png'});
   await page.locator('#review-open').click();
   await page.locator('#silhouette-button').click();
   await page.locator('#review-close').click();
   await page.locator('#viewport').screenshot({path:folder+'/renders/small_silhouette.png'});
   await fs.writeFile(folder+'/validation/inspector_check.json',JSON.stringify({errors,state:await page.evaluate(()=>window.inspectorState())},null,2));
  }
  await page.goto('http://127.0.0.1:4174/?asset=github_octocat_classic&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#review-open').click();
  await page.locator('#background-select').selectOption('light');
  await page.locator('#ground-toggle').check();
  await page.locator('#comparison-select').selectOption('towers/github_octocat_modern_v01.glb');
  await page.locator('#compare-asset').click();
  await page.waitForFunction(()=>window.inspectorState().entries.length===2&&!window.inspectorState().loading);
  await page.locator('#review-close').click();
  await page.locator('#grid-button').click();
  await page.locator('#frame-button').click();
  await page.locator('#viewport').screenshot({path:path.resolve('blender/towers/github_octocat_modern/v01/renders/octocat_comparison.png')});
  await page.locator('[data-view="front"]').click();
  await page.locator('#viewport').screenshot({path:path.resolve('blender/towers/github_octocat_modern/v01/renders/octocat_comparison_front.png')});
  console.log(JSON.stringify({errors,comparison:await page.evaluate(()=>window.inspectorState())}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
