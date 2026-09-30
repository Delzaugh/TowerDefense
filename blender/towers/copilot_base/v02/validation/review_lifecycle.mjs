import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createInspectorServer} from '../../../../../tools/asset-inspector/server.mjs';
import {playwrightRuntime} from '../../../../../tools/asset-pipeline/validate.mjs';
import {findAsset, projectRoot, hash} from '../../../../../tools/asset-pipeline/contracts.mjs';

const {data:manifest} = await findAsset('copilot_base', 'v02');
const require = createRequire(import.meta.url);
const {PNG} = require(require.resolve('pngjs',{paths:[process.env.PLAYWRIGHT_MODULE_PATH||projectRoot]}));
const folder = path.join(projectRoot, 'blender/towers/copilot_base/v02/validation/lifecycle_review');
await mkdir(folder, {recursive:true});
const server = createInspectorServer();
await new Promise(resolve=>server.listen(0, '127.0.0.1', resolve));
const {chromium} = playwrightRuntime();
const browser = await chromium.launch({channel:'msedge', headless:true});
try {
  const page = await browser.newPage({viewport:{width:1280,height:1060}});
  const errors = [];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(['error','warning'].includes(message.type())) errors.push(message.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/?asset=copilot_base&version=v02`);
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  await page.locator('#grid-button').click();
  const state = ()=>page.evaluate(()=>window.inspectorState());
  const initial = await state();
  assert.equal(initial.entries[0].revision, manifest.delivery.sha256);
  assert.deepEqual(initial.entries[0].clips.map(c=>c.name).sort(), manifest.clips.map(c=>c.name).sort());
  const duration = initial.entries[0].clips.find(c=>c.name==='resolve').duration;
  assert.equal(duration, 1.25);
  assert.equal(initial.entries[0].clips.find(c=>c.name==='place').duration, duration);
  const frames = [];
  async function capture(label, context={}) {
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const file=label+'.png', data=await page.locator('#viewport').screenshot({path:path.join(folder,file)});
    const s=await state();
    const frame={file,sha256:hash(data),clip:s.entries[0].clip,time:s.entries[0].time,effect:s.resolveEffects[0],...context};
    frames.push(frame);
    return frame;
  }
  async function scrub(progress) {
    await page.locator('#timeline').fill(String(Number((duration*progress).toFixed(4))));
    await page.locator('#timeline').dispatchEvent('input');
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
  }
  async function differingPixels(a,b) {
    const left=PNG.sync.read(await readFile(path.join(folder,a.file)));
    const right=PNG.sync.read(await readFile(path.join(folder,b.file)));
    assert.equal(left.width,right.width);assert.equal(left.height,right.height);
    let changed=0;
    for(let i=0;i<left.data.length;i+=4)
      if(Math.max(...[0,1,2].map(j=>Math.abs(left.data[i+j]-right.data[i+j])))>2)changed++;
    return changed;
  }
  const rest=await capture('rest');
  const samples=[0,.16,.32,.48,.64,.8,1];
  const directions={};
  for(const clip of ['resolve','place']) {
    await page.locator('#clip-select').selectOption({label:clip});
    await page.locator('#play-button').click();
    directions[clip]=[];
    for(const progress of samples) {
      await scrub(progress);
      const frame=await capture(`${clip}-${String(Math.round(progress*100)).padStart(3,'0')}`,{progress});
      assert.equal(frame.effect.type,'digital_blocks');
      assert(frame.effect.fragments<=40);
      assert((await state()).resolveBudget.used<=256);
      assert.deepEqual((await state()).entries[0].root,[0,0,0]);
      directions[clip].push(frame);
    }
  }
  assert.equal(directions.resolve[0].effect.progress,0);
  assert.equal(directions.resolve.at(-1).effect.fragments,0);
  assert.equal(directions.place[0].effect.fragments,0);
  assert.equal(directions.place.at(-1).effect.progress,0);
  assert(directions.resolve.some(f=>f.effect.fragments>0));
  for(const frame of directions.place) {
    const opposite=directions.resolve.find(f=>Math.abs(f.progress-(1-frame.progress))<1e-9);
    if(opposite) assert.equal(frame.effect.fragments,opposite.effect.fragments);
  }
  await page.locator('#clip-select').selectOption({label:'idle'});
  await page.locator('#play-button').click();
  await scrub(0);
  const idle=await capture('idle-ready');
  assert((await differingPixels(directions.place.at(-1),idle))<=2,'Place endpoint differs from Idle ready appearance');
  await page.locator('#clip-select').selectOption({label:'resolve'});
  await page.locator('#play-button').click();
  await scrub(1);
  await page.locator('#effects-toggle').uncheck();
  const noEffect=await capture('resolve-effect-off');
  assert.notEqual(noEffect.sha256,directions.resolve.at(-1).sha256,'Disabled effect did not reveal full-size body');
  await page.locator('#effects-toggle').check();
  await page.locator('#rest-button').click();
  const reset=await capture('rest-reset');
  assert((await state()).entries[0].clip===null && reset.effect.clip===null,'Rest did not reset clip/effect state');
  assert((await differingPixels(rest,reset))<=2,'Rest reset changed appearance');
  await page.locator('#clip-select').selectOption({label:'resolve'});
  await page.locator('#play-button').click();
  await scrub(.48);
  const first=await capture('resolve-repeat-a');
  await scrub(.16);await scrub(.48);
  const second=await capture('resolve-repeat-b');
  assert((await differingPixels(first,second))<=2,'Resolve seeking is not deterministic');
  await page.locator('#review-open').click();
  await page.locator('#phone-toggle').check();
  await page.locator('#ground-toggle').check();
  await page.locator('#review-close').click();
  await scrub(.48);
  await capture('phone-resolve-mid',{progress:.48,view:'phone, ground shadows'});
  await page.locator('#clip-select').selectOption({label:'place'});
  await page.locator('#play-button').click();
  await scrub(.52);
  await capture('phone-place-mid',{progress:.52,view:'phone, ground shadows'});
  const fallback=await page.evaluate(async()=>{
    const THREE=await import('/vendor/three.module.js');
    const {GLTFLoader}=await import('/vendor/GLTFLoader.js');
    const {createDigitalResolve,createResolveBudget}=await import('/presentation/digital-resolve.js');
    const gltf=await new GLTFLoader().loadAsync('/runtime/towers/copilot_base_v02.glb');
    const budget=createResolveBudget(0),effect=createDigitalResolve(THREE,gltf.scene,{budget});
    effect.prepare();effect.setState('resolve',.6,1.25);
    const diagnostics=effect.diagnostics();effect.dispose();
    return {diagnostics,budgetAfterDispose:budget.used};
  });
  assert.equal(fallback.diagnostics.fragments,0);
  assert.equal(fallback.diagnostics.leased,0);
  assert.equal(fallback.budgetAfterDispose,0);
  assert.deepEqual(errors,[]);
  const result={asset:'copilot_base',version:'v02',revision:manifest.revision,sha256:manifest.delivery.sha256,
    sourceHash:manifest.delivery.sourceHash,rendererSha256:hash(await readFile(path.join(projectRoot,'tools/asset-presentation/digital-resolve.js'))),
    lifecycleRendererSha256:hash(await readFile(path.join(projectRoot,'tools/asset-presentation/lifecycle.js'))),
    reviewedAt:new Date().toISOString(),frames,fallback,
    checks:['Inspector loads current export','Place/Resolve use matched 1.25-second timelines','full-size body with effect disabled','Place ends at Idle ready','Resolve ends invisible','Rest Pose reset','seek/replay deterministic','phone-scale view with ground shadows','40-fragment asset cap and zero-budget fallback','stationary root','no browser errors']};
  await writeFile(path.join(folder,'review.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({passed:true,frames:frames.length,maxFragments:Math.max(...frames.map(f=>f.effect?.fragments||0)),folder},null,2));
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
