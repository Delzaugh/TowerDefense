import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { playwrightRuntime } from '../../../../../tools/asset-pipeline/validate.mjs';
import { hash } from '../../../../../tools/asset-pipeline/contracts.mjs';

const folder=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(await readFile(path.join(folder,'../asset.json'),'utf8'));
const base=process.argv[2];
if(!base) throw Error('Pass actual shared Inspector URL');
const out=path.join(folder,'inspector');
await mkdir(out,{recursive:true});
const browser=await playwrightRuntime().chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});
const errors=[],evidence=[];
page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto(base);
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  const state=await page.evaluate(()=>window.inspectorState());
  assert.equal(state.entries[0].path,'environment/campus_visitor_man_v01.glb');
  assert.equal(state.entries[0].revision,manifest.delivery.sha256);
  assert.equal(state.entries[0].meshes,1);
  assert.equal(state.entries[0].materials,1);
  assert.equal(state.entries[0].clips.length,0);
  // The viewer itself checks payload hash; record its displayed identity as well.
  const identity=await page.locator('#revision-status').innerText();
  await page.locator('#grid-button').click();
  async function shot(name){
    await page.waitForTimeout(180);
    const data=await page.locator('#viewport').screenshot({path:path.join(out,name+'.png')});
    evidence.push({path:'blender/environment/campus_visitor_man/v01/validation/inspector/'+name+'.png',sha256:hash(data),view:name,camera:await page.evaluate(()=>window.inspectorState())});
  }
  for(const view of ['front','left','rear','iso']){
    await page.locator(`[data-view="${view}"]`).click();
    await shot(view);
  }
  for(const view of ['front','iso']){
    await page.locator(`[data-view="${view}"]`).click();
    await page.locator('#zoom-in-button').click({clickCount:3,delay:80});
    const box=await page.locator('#viewport').boundingBox();
    const x=box.x+box.width/2,y=box.y+box.height/2;
    await page.mouse.move(x,y);
    await page.mouse.down({button:'right'});
    await page.mouse.move(x,y+box.height*.27,{steps:12});
    await page.mouse.up({button:'right'});
    await shot(view+'-upper-detail');
  }
  await page.locator('[data-view="iso"]').click();
  await page.locator('#review-open').click();
  await page.locator('summary').filter({hasText:'Palette · preview only'}).click();
  const roles=await page.locator('#palette-select option').count();
  assert.equal(roles,Object.keys(manifest.texturePalettes[0].roles).length);
  await page.locator('#lighting-select').selectOption('gameplay');
  await page.locator('#phone-toggle').check();
  await page.locator('#review-close').click();
  await shot('phone-gameplay');
  await page.locator('#review-open').click();
  await page.locator('#silhouette-button').click();
  await page.locator('#review-close').click();
  await shot('small-silhouette');
  assert.deepEqual(errors,[]);
  await writeFile(path.join(out,'evidence.json'),JSON.stringify({identity,revision:manifest.revision,sha256:manifest.delivery.sha256,roles,errors,evidence},null,2));
  console.log(JSON.stringify({passed:true,identity,roles,evidence:evidence.map(e=>e.path)},null,2));
} finally {await browser.close();}

