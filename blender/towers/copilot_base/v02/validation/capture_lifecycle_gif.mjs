// Capture the delivered animation in the shared Inspector for GIF assembly.
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {createInspectorServer} from '../../../../../tools/asset-inspector/server.mjs';
import {playwrightRuntime} from '../../../../../tools/asset-pipeline/validate.mjs';
import {findAsset} from '../../../../../tools/asset-pipeline/contracts.mjs';

const {data:manifest}=await findAsset('copilot_base','v02');
const folder=await mkdtemp(path.join(os.tmpdir(),'tower-copilot-v02-gif-'));
const server=createInspectorServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {chromium}=playwrightRuntime();
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:1060}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(['error','warning'].includes(message.type()))errors.push(message.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/?asset=copilot_base&version=v02`);
  await page.waitForFunction(()=>window.inspectorState?.().entries.length===1&&!window.inspectorState().loading);
  const state=()=>page.evaluate(()=>window.inspectorState());
  assert.equal((await state()).entries[0].revision,manifest.delivery.sha256);
  await page.locator('#grid-button').click();
  const frames=[];
  async function stage(clip,count,seconds){
    await page.locator('#clip-select').selectOption({label:clip});
    if((await state()).entries[0].playing)await page.locator('#play-button').click();
    assert.equal((await state()).entries[0].clip,clip);
    for(let i=0;i<count;i++){
      const t=seconds*(i/(count-1));
      await page.locator('#timeline').fill(String(Number(t.toFixed(3))));
      await page.locator('#timeline').dispatchEvent('input');
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const file=String(frames.length).padStart(3,'0')+'.png';
      await page.locator('#viewport').screenshot({path:path.join(folder,file)});
      const s=await state();
      frames.push({file,clip,time:s.entries[0].time,progress:s.resolveEffects[0].timelineProgress,fragments:s.resolveEffects[0].fragments});
    }
  }
  await stage('place',16,1.25);
  await stage('idle',30,2.5);
  await stage('resolve',16,1.25);
  assert.equal(frames[0].fragments,0);
  assert.equal(frames.at(-1).fragments,0);
  assert.equal(frames.at(-1).progress,1);
  assert.deepEqual(errors,[]);
  const metadata={asset:'copilot_base',version:'v02',revision:manifest.revision,sha256:manifest.delivery.sha256,
    folder,frames,frameRate:12,sequence:['place','idle','resolve']};
  await writeFile(path.join(folder,'frames.json'),JSON.stringify(metadata,null,2)+'\n');
  console.log(JSON.stringify({folder,frames:frames.length,sha256:manifest.delivery.sha256,errors},null,2));
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
