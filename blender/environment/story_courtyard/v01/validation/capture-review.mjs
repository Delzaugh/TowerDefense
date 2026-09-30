import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createInspectorServer } from '../../../../../tools/asset-inspector/server.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(path.resolve('game/node_modules/playwright'));
const server=createInspectorServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  for(const id of ['story_courtyard','story_capture_carrier']) {
    const out=path.resolve(`blender/environment/${id}/v01/validation`);
    const manifest=JSON.parse(await fs.readFile(path.join(out,'../asset.json'),'utf8'));
    const page=await browser.newPage({viewport:{width:1600,height:1100}});
    const errors=[]; page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${origin}/?asset=${id}&version=v01`);
    await page.waitForFunction(() => window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
    await page.locator('#grid-button').click();
    const metadata=[];
    for(const view of ['iso','rear']) {
      await page.locator(`[data-view="${view}"]`).click();
      await page.locator('#viewport').screenshot({path:path.join(out,`inspector-${view}.png`)});
      metadata.push({view,state:await page.evaluate(()=>window.inspectorState())});
    }
    await page.locator('[data-view="iso"]').click();
    const box=await page.locator('#viewport').boundingBox();
    const focus=id==='story_courtyard'?[0,2.8,-6.4]:[1.1,.7,-.2];
    const pan=await page.evaluate(async focus=>{
      const THREE=await import('/vendor/three.module.js'),state=window.inspectorState();
      const camera=new THREE.PerspectiveCamera(45,1,.01,1000); camera.position.fromArray(state.camera);camera.lookAt(new THREE.Vector3(...state.target));camera.updateMatrixWorld();
      const delta=new THREE.Vector3(...focus).sub(new THREE.Vector3(...state.target));
      const scale=2*state.distance*Math.tan(Math.PI/8)/document.getElementById('viewport').clientHeight;
      return {x:-delta.dot(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0))/scale,y:delta.dot(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1))/scale};
    },focus);
    const start={x:box.x+box.width/2,y:box.y+box.height/2};
    await page.mouse.move(start.x,start.y);await page.mouse.down({button:'right'});await page.mouse.move(start.x+pan.x,start.y+pan.y,{steps:8});await page.mouse.up({button:'right'});
    for(let n=0;n<(id==='story_courtyard'?3:1);n++)await page.locator('#zoom-in-button').click();
    await page.locator('#viewport').screenshot({path:path.join(out,'inspector-close.png')});
    metadata.push({view:'close',state:await page.evaluate(()=>window.inspectorState())});
    await page.setViewportSize({width:390,height:844});
    await page.locator('[data-view="iso"]').click();
    await page.locator('#frame-button').click();
    await page.locator('#viewport').screenshot({path:path.join(out,'inspector-phone.png')});
    const state=await page.evaluate(()=>window.inspectorState());
    metadata.push({view:'phone',state});
    await fs.writeFile(path.join(out,'inspector-evidence.json'),JSON.stringify({asset:id,revision:manifest.revision,sourceHash:manifest.delivery.sourceHash,sha256:manifest.delivery.sha256,origin,metadata,errors},null,2));
    if(errors.length)throw new Error(errors.join('\n'));
    await page.close();
  }
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
