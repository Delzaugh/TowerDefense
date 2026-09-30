// Integration check for separately owned presentation effects on registered GLBs.
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
(async()=>{
  const {createInspectorServer}=await import(pathToFileURL(path.join(__dirname,'server.mjs')));
  const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(m.text());});
  const base='http://127.0.0.1:'+server.address().port;
  const dir=path.resolve(__dirname,'../../blender/towers/golden_compiler/v01/validation');
  const state=()=>page.evaluate(()=>window.inspectorState());
  const ready=()=>page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  try{
    await page.goto(base+'/?asset=golden_compiler&version=v01');await ready();
    let s=await state();const initial=s.entries[0],effect=s.effects[0];
    assert(s.effects[0].enabled);assert.equal(initial.meshes+s.effects[0].meshes,4);assert.equal(initial.materials+s.effects[0].materials,4);
    assert(initial.triangles+s.effects[0].triangles<=3000);assert.deepEqual(initial.root,[0,0,0]);
    await page.locator('#grid-button').click();
    await page.locator('#viewport').screenshot({path:path.join(dir,'aura_iso.png')});
    await page.locator('[data-view="front"]').click();await page.locator('#viewport').screenshot({path:path.join(dir,'aura_front.png')});
    await page.locator('[data-view="rear"]').click();await page.locator('#viewport').screenshot({path:path.join(dir,'aura_rear.png')});
    await page.locator('[data-view="right"]').click();await page.locator('#viewport').screenshot({path:path.join(dir,'aura_side.png')});
    await page.locator('[data-view="front"]').click();
    await page.locator('#effects-toggle').uncheck();s=await state();assert(!s.effects[0].enabled);assert.deepEqual(s.entries[0].root,initial.root);assert.equal(s.entries[0].triangles,initial.triangles);
    await page.locator('#clip-select').selectOption({label:'work'});await page.locator('#play-button').click();
    for(const value of ['0','0.375','0.75','1.125','1.499']){
      await page.locator('#timeline').fill(value);
      assert.deepEqual((await state()).entries[0].root,[0,0,0]);
      if(value==='0.75')await page.locator('#viewport').screenshot({path:path.join(dir,'work_extreme_front.png')});
    }
    await page.locator('[data-view="right"]').click();await page.locator('#viewport').screenshot({path:path.join(dir,'work_oblique_detail.png')});
    await page.locator('#rest-button').click();await page.locator('[data-view="rear"]').click();await page.locator('#viewport').screenshot({path:path.join(dir,'final_rear.png')});
    // Focus the corrected hanging hand from both sides using normal viewer input.
    for(const view of ['front','rear']){
      await page.locator('[data-view="'+view+'"]').click();const s=await state(),rect=await page.locator('#viewport').boundingBox();
      const pixels=rect.height/(2*s.distance*Math.tan(Math.PI/8)),right=view==='front'?1:-1;
      const dx=-(.70-s.target[0])*right*pixels,dy=(1.10-s.target[1])*pixels;
      await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down({button:'right'});await page.mouse.move(rect.x+rect.width/2+dx,rect.y+rect.height/2+dy);await page.mouse.up({button:'right'});
      for(let i=0;i<4;i++)await page.locator('#zoom-in-button').click();
      await page.locator('#viewport').screenshot({path:path.join(dir,'hand_detail_'+view+'.png')});
    }
    // Anatomy and hair evidence: both sides of the raised palm, and head front/profile.
    for(const [name,view,x,y,zoom] of [['raised_palm_front','front',-.97,1.81,4],['raised_palm_rear','rear',-.97,1.81,4],['head_front','front',0,2.62,2],['head_profile','right',0,2.62,2]]){
      await page.locator('[data-view="'+view+'"]').click();const s=await state(),rect=await page.locator('#viewport').boundingBox();
      const pixels=rect.height/(2*s.distance*Math.tan(Math.PI/8)),right=view==='rear'?-1:1;
      const dx=view==='right'?0:-(x-s.target[0])*right*pixels,dy=(y-s.target[1])*pixels;
      await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down({button:'right'});await page.mouse.move(rect.x+rect.width/2+dx,rect.y+rect.height/2+dy);await page.mouse.up({button:'right'});
      for(let i=0;i<zoom;i++)await page.locator('#zoom-in-button').click();
      await page.locator('#viewport').screenshot({path:path.join(dir,name+'.png')});
    }
    await page.locator('#effects-toggle').check();await page.locator('#reset-view-button').click();
    await page.locator('#clip-select').selectOption({label:'work'});await page.locator('#play-button').click();await page.locator('#timeline').fill('0.75');
    await page.locator('#viewport').screenshot({path:path.join(dir,'aura_work.png')});await page.locator('#rest-button').click();
    await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();await page.locator('#frame-button').click();
    await page.locator('#viewport').screenshot({path:path.join(dir,'aura_phone.png')});
    await page.locator('#review-open').click();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();
    await page.locator('#viewport').screenshot({path:path.join(dir,'aura_small.png')});
    await page.goto(base+'/?asset=copilot_shield&version=v01');await ready();assert(!(await state()).effects[0].enabled);assert(await page.locator('#effects-toggle').isDisabled());
    await page.goto(base+'/?asset=golden_compiler&version=v01');await ready();assert((await state()).effects[0].enabled);
    await page.locator('#refresh-models').click();await ready();assert.equal((await state()).effects.length,1);assert((await state()).effects[0].enabled);
    assert.deepEqual(errors,[]);
    const manifest=JSON.parse(await fs.readFile(path.join(dir,'../asset.json'),'utf8'));
    const report={passed:true,revision:manifest.revision,sha256:manifest.delivery.sha256,checkedAt:new Date().toISOString(),characterTriangles:initial.triangles,effectTriangles:effect.triangles,totalTriangles:initial.triangles+effect.triangles,totalMeshes:initial.meshes+effect.meshes,totalMaterials:initial.materials+effect.materials,checks:['shader compiles without browser warnings','aura toggles independently','stationary root through five work poses','unaffected asset has no aura','refresh does not duplicate effect'],visualReview:'Screenshots require visual inspection.'};
    report.rendererSha256=require('node:crypto').createHash('sha256').update(await fs.readFile(path.join(__dirname,'review.js'))).digest('hex');
    await fs.writeFile(path.join(dir,'effects_report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
