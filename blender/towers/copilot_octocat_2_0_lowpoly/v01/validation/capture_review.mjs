import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {findAsset} from '../../../../../tools/asset-pipeline/contracts.mjs';
import {previewUrl} from '../../../../../tools/asset-pipeline/asset.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('../../../../../game/node_modules/playwright');
const folder='blender/towers/copilot_octocat_2_0_lowpoly/v01';
const manifest=JSON.parse(await fs.readFile(folder+'/asset.json'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=await previewUrl(await findAsset(manifest.id));
const evidence=[];
try{
 await page.goto(url);
 await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 await page.locator('#grid-button').click();
 await page.locator('#review-open').click();
 await page.locator('#background-select').selectOption('light');
 await page.locator('#copy-feedback').click();
 const note=JSON.parse(await page.locator('#feedback-copy').inputValue());
 if(note.sha256!==manifest.delivery.sha256)throw Error('Inspector loaded stale export');
 await page.locator('#review-close').click();
 async function capture(name){
   await page.waitForTimeout(150);
   const file=folder+'/renders/'+name+'.png';
   const png=await page.locator('#viewport').screenshot({path:file});
   evidence.push({path:file,sha256:crypto.createHash('sha256').update(png).digest('hex'),view:name,camera:await page.evaluate(()=>window.inspectorState())});
 }
 for(const v of ['front','iso','rear','right','bottom']){
  await page.locator(`[data-view="${v}"]`).click();await capture('inspector-'+v);
 }
 // Close-up uses the Inspector's own orbit, zoom and pan controls.
 for(const v of ['front','iso']){
  await page.locator(`[data-view="${v}"]`).click();
  for(let i=0;i<4;i++)await page.locator('#zoom-in-button').click();
  const box=await page.locator('#viewport').boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down({button:'right'});
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2+170,{steps:10});
  await page.mouse.up({button:'right'});
  await capture('face-close-'+v);
 }
 await page.locator('[data-view="iso"]').click();
 await page.locator('#review-open').click();
 await page.locator('#phone-toggle').check();
 await page.locator('#review-close').click();
 await capture('phone');
 await page.locator('#review-open').click();
 await page.locator('#silhouette-button').click();
 await page.locator('#review-close').click();
 await capture('game-scale');
 if(errors.length)throw Error(errors.join('; '));
 await fs.writeFile(folder+'/validation/inspector_evidence.json',JSON.stringify({url,revision:manifest.revision,sourceHash:manifest.delivery.sourceHash,sha256:note.sha256,evidence,errors},null,2));
 console.log(JSON.stringify({url,revision:manifest.revision,sha256:note.sha256,evidence:evidence.map(e=>e.view),errors}));
}finally{await browser.close();}

