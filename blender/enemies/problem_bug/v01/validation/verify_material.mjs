import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createInspectorServer} from '../../../../../tools/asset-inspector/server.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(path.resolve('game/node_modules/playwright'));
const folder='blender/enemies/problem_bug/v01';
const manifest=JSON.parse(await fs.readFile(folder+'/asset.json'));
const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],states=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/?asset=problem_bug&version=v01`);
 await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
 assert.equal((await page.evaluate(()=>window.inspectorState())).entries[0].revision,manifest.delivery.sha256);
 await page.locator('#review-open').click();
 await page.locator('summary').filter({hasText:'Palette · preview only'}).click();
 assert.equal(await page.locator('#palette-select option').count(),7);
 for(const [role,color] of Object.entries(manifest.texturePalettes[0].roles)){
  await page.locator('#palette-select').selectOption('texture:bug_palette:'+role);
  assert.equal(await page.locator('#palette-color').inputValue(),color.color.toLowerCase());
 }
 await page.locator('#phone-toggle').check();await page.locator('#silhouette-button').click();
 await page.locator('#review-close').click();
 for(const [clip,time,name] of [['move',.75,'phone-move'],['spawn',.625,'phone-spawn'],['resolve',.625,'phone-resolve'],['resolve',1.25,'phone-resolve-end']]){
  await page.locator('#clip-select').selectOption({label:clip});await page.locator('#timeline').fill(String(time));
  await page.locator('#viewport').screenshot({path:`${folder}/validation/material/${name}.png`});
  states.push(await page.evaluate(()=>window.inspectorState()));
 }
 await page.locator('#rest-button').click();
 await page.locator('#review-open').click();await page.locator('#background-select').selectOption('light');await page.locator('#lighting-select').selectOption('gameplay');await page.locator('#review-close').click();
 await page.locator('#viewport').screenshot({path:`${folder}/validation/material/phone-light-rest.png`});
 await page.locator('#review-open').click();await page.locator('#phone-toggle').uncheck();await page.locator('#review-close').click();
 await page.locator('[data-view="rear"]').click();await page.locator('#frame-button').click();
 await page.locator('#viewport').screenshot({path:`${folder}/validation/material/rear-gameplay.png`});
 assert.deepEqual(errors,[]);
 await fs.writeFile(`${folder}/validation/material/inspector-report.json`,JSON.stringify({passed:true,sha256:manifest.delivery.sha256,sourceHash:manifest.delivery.sourceHash,errors,states,checks:'Current exported hash; all seven swatches unchanged; actual small phone move, Spawn, Resolve, terminal frame, Rest reset; gameplay-like reverse view'},null,2));
 console.log('Final Bug material Inspector checks passed.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
