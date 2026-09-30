import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {createInspectorServer} from './server.mjs';
import {verifyPaletteParity,glbDocument} from '../asset-pipeline/palette-parity.mjs';
const require=createRequire(import.meta.url),{chromium}=require(path.resolve('game/node_modules/playwright'));
const policy=JSON.parse(await fs.readFile('docs/design/Problems_Palette.json'));
const out='docs/design/reviews/problems-palette-2026-09-27';
const server=createInspectorServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({channel:'msedge',headless:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
try{
 const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));
 for(const [id,bindings]of Object.entries(policy.bindings)){
  const folder=`blender/enemies/${id}/v01`,m=JSON.parse(await fs.readFile(folder+'/asset.json'));
  const colors=Object.fromEntries(Object.entries(bindings).map(([r,t])=>[r,policy.tokens[t]]));
  assert.deepEqual(Object.fromEntries(Object.keys(colors).map(r=>[r,m.palette.colors[r]])),colors);
  assert.deepEqual(Object.fromEntries(m.texturePalettes.flatMap(p=>Object.entries(p.roles).map(([r,s])=>[r,s.color]))),colors);
  const unique=new Set(Object.values(colors)).size;assert(unique<=(policy.maxUniqueBaseColorsByAsset?.[id]??Infinity));
  const bytes=await fs.readFile(m.runtime);assert.equal(hash(bytes),m.delivery.sha256);
  const result={id,revision:m.revision,sha256:m.delivery.sha256,uniqueBaseColors:unique};
  if(id!=='problem_bug'){
   const old=m.milestones.find(s=>s.label==='before_seven_colours')??m.milestones.find(s=>s.label==='before_problem_palette');
   const oldBytes=await fs.readFile(old.export);result.parity=verifyPaletteParity(oldBytes,bytes);
   const a=glbDocument(oldBytes).g,b=glbDocument(bytes).g;
   assert.deepEqual(a.samplers,b.samplers);assert.deepEqual(a.textures,b.textures);
   assert.deepEqual(a.materials,b.materials,'Only packed base image pixels may change');
   await fs.writeFile(folder+'/validation/problem_palette_parity.json',JSON.stringify(result,null,2));
  }
  await page.goto(`${origin}/?asset=${id}&version=v01`);
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  assert.equal((await page.evaluate(()=>window.inspectorState())).entries[0].revision,m.delivery.sha256);
  await page.locator('#review-open').click();
  await page.locator('summary').filter({hasText:'Palette · preview only'}).click();
  for(const spec of m.texturePalettes)for(const [role,swatch]of Object.entries(spec.roles)){
   assert.equal(swatch.color,colors[role]);
   await page.locator('#palette-select').selectOption(`texture:${spec.material}:${role}`);
   assert.equal(await page.locator('#palette-color').inputValue(),colors[role].toLowerCase());
  }
  await page.locator('#phone-toggle').check();await page.locator('#silhouette-button').click();await page.locator('#review-close').click();
  await page.locator('#viewport').screenshot({path:folder+'/validation/problem-palette-phone.png'});
  await page.locator('#clip-select').selectOption({label:'move'});await page.locator('#timeline').fill('0.5');
  await page.locator('#viewport').screenshot({path:folder+'/validation/problem-palette-move-phone.png'});
  results.push(result);
 }
 // A contact sheet contains actual guarded export evidence and Inspector captures.
 for(const [name,views]of [['close',['iso','rear']],['phone',['problem-palette-phone','problem-palette-move-phone']]]){
  const cards=[];
  for(const result of results){let images='';for(const view of views){const bytes=await fs.readFile(`blender/enemies/${result.id}/v01/validation/${view}.png`);images+=`<img src="data:image/png;base64,${bytes.toString('base64')}">`;}
   cards.push(`<article><h2>${result.id.replace('problem_','').replaceAll('_',' ')} · r${result.revision} · ${result.uniqueBaseColors} colours</h2>${images}</article>`);}
  await page.setViewportSize({width:1440,height:1050});await page.goto('about:blank');
  await page.setContent(`<style>body{margin:0;background:#101d29;color:white;font:15px system-ui}main{display:grid;grid-template-columns:1fr 1fr}article{padding:12px}h2{font-size:18px}img{width:49%;vertical-align:top}</style><main>${cards.join('')}</main>`);
  await page.screenshot({path:`${out}/${name}-review.png`,fullPage:true});
 }
 await page.goto(origin+'/problems-palette.html');assert.equal(await page.locator('article').count(),6);
 await page.locator('#after').click();
 for(const r of results)assert.equal(await page.locator(`.swatches[data-id=${r.id}] i`).count(),r.uniqueBaseColors);
 await page.locator('#gray').click();await page.screenshot({path:out+'/grayscale.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#gray').click();await page.screenshot({path:out+'/board-phone.png',fullPage:true});
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/verification.json',JSON.stringify({passed:true,results,errors},null,2));
 console.log('All six Problems: accepted palette mappings, explicit per-asset limits, export hashes, parity, preview counts and phone layout passed.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
