import fs from 'node:fs/promises';
import {playwrightRuntime} from '../../../../tools/asset-pipeline/validate.mjs';
const d='blender/towers/copilot_security/v01/validation';
const m=JSON.parse(await fs.readFile('blender/towers/copilot_security/v01/asset.json'));
const {chromium}=playwrightRuntime();
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1480,height:1150}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://127.0.0.1:4175/?asset=copilot_security&version=v01');
 await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 await page.locator('#grid-button').click();
 await page.locator('#review-open').click();
 await page.locator('#background-select').selectOption('light');
 await page.locator('#copy-feedback').click();
 const note=JSON.parse(await page.locator('#feedback-copy').inputValue());
 if(note.sha256!==m.delivery.sha256)throw Error('Inspector loaded a stale export');
 await page.locator('#review-close').click();
 async function capture(name){await page.waitForTimeout(180);await page.locator('#viewport').screenshot({path:d+'/'+name+'.png'});}
 await capture('inspector_iso');
 for(const view of ['front','left','right','rear','bottom']){
  await page.locator('[data-view='+view+']').click();await capture('inspector_'+view);
 }
 async function panTo(target){
  const state=await page.evaluate(()=>window.inspectorState());
  const box=await page.locator('canvas').boundingBox();
  const back=state.camera.map((v,i)=>v-state.target[i]);const length=Math.hypot(...back);back.forEach((v,i)=>back[i]=v/length);
  const right=[back[2],0,-back[0]];const rl=Math.hypot(...right);right.forEach((v,i)=>right[i]=v/rl);
  const up=[back[1]*right[2],back[2]*right[0]-back[0]*right[2],-back[1]*right[0]];
  const delta=target.map((v,i)=>v-state.target[i]);const dot=v=>v.reduce((sum,x,i)=>sum+x*delta[i],0);
  const scale=2*state.distance*Math.tan(Math.PI/8)/box.height;
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);await page.mouse.down({button:'right'});
  await page.mouse.move(x-dot(right)/scale,y+dot(up)/scale,{steps:6});await page.mouse.up({button:'right'});
 }
 await page.locator('[data-view=front]').click();await panTo([0,.29,0]);
 for(let i=0;i<5;i++)await page.locator('#zoom-in-button').click();await capture('inspector_shield');
 let box=await page.locator('canvas').boundingBox();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 await page.mouse.move(box.x+box.width/2-48,box.y+box.height/2-22,{steps:6});await page.mouse.up();
 await capture('inspector_shield_oblique');
 for(const view of ['left','right']){
  await page.locator('[data-view='+view+']').click();await panTo([0,.94,-.30]);
  await page.locator('#zoom-in-button').click();await page.locator('#zoom-in-button').click();await capture('inspector_pod_'+view);
 }
 await page.locator('[data-view=iso]').click();await page.locator('#zoom-in-button').click();await capture('inspector_detail');
 await page.locator('#frame-button').click();
 await page.locator('#review-open').click();await page.locator('#phone-toggle').check();await page.locator('#review-close').click();await capture('inspector_phone');
 await page.locator('#review-open').click();await page.locator('#lighting-select').selectOption('gameplay');await page.locator('#silhouette-button').click();await page.locator('#review-close').click();await capture('inspector_small');
 await fs.writeFile(d+'/inspector_check.json',JSON.stringify({sha256:note.sha256,revision:m.revision,note,errors,state:await page.evaluate(()=>window.inspectorState())},null,2));
 if(errors.length)throw Error(errors.join('; '));
 console.log('Inspector current hash verified; desktop, close-up, reverse, underside, phone and small views saved.');
}finally{await browser.close();}
