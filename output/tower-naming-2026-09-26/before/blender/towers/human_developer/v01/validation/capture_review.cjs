const {chromium}=require('../../../../../game/node_modules/playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4175/?asset=human_developer&version=v01');
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#review-open').click();
  await page.locator('#background-select').selectOption('light');
  await page.locator('#review-close').click();
  await page.locator('#grid-button').click();
  const canvas=page.locator('#viewport');
  const shot=async(name)=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await canvas.screenshot({path:path.join(__dirname,name+'.png')});};
  await shot('inspector-iso');
  await page.locator('[data-view="front"]').click();await page.locator('#zoom-in-button').click();await shot('close-front');
  await page.locator('[data-view="left"]').click();await page.locator('#frame-button').click();await shot('laptop-side');
  const box=await canvas.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+95,box.y+box.height/2+30,{steps:16});await page.mouse.up();await shot('laptop-oblique');
  await page.locator('[data-view="rear"]').click();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+70,box.y+box.height/2+60,{steps:16});await page.mouse.up();await shot('rear-oblique');
  await page.locator('[data-view="iso"]').click();await page.locator('#frame-button').click();
  await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();await shot('phone');
  await page.locator('#review-open').click();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();await shot('small-silhouette');
  await page.locator('#review-open').click();await page.locator('#copy-feedback').click();
  const note=JSON.parse(await page.locator('#feedback-copy').inputValue());
  const state=await page.evaluate(()=>window.inspectorState());
  await fs.writeFile(path.join(__dirname,'inspector-check.json'),JSON.stringify({errors,note,state},null,2));
  if(errors.length)throw Error(errors.join('; '));
  console.log(JSON.stringify({revision:note.revision,sha256:note.sha256,errors,triangles:state.entries[0].triangles}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
