import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createInspectorServer } from './server.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(path.resolve('game/node_modules/playwright'));
const server = createInspectorServer();
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({channel:'msedge',headless:true});
const out = 'docs/design/reviews/palette-2026-09-26';
try {
  const page = await browser.newPage({viewport:{width:1400,height:1000}}), errors = [], states = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const id of ['copilot_developer','copilot_linter','copilot_security']) {
    const folder = `blender/towers/${id}/v01/validation`;
    const manifest = JSON.parse(await fs.readFile(`blender/towers/${id}/v01/asset.json`));
    await page.goto(`${origin}/?asset=${id}&version=v01`);
    await page.waitForFunction(() => window.inspectorState?.().entries.length === 1 && !window.inspectorState().loading);
    assert.equal((await page.evaluate(() => window.inspectorState())).entries[0].revision, manifest.delivery.sha256);
    await page.locator('#review-open').click();
    await page.locator('summary').filter({hasText:'Palette · preview only'}).click();
    for (const p of manifest.texturePalettes) for (const role of ['screen','cyan']) {
      await page.locator('#palette-select').selectOption(`texture:${p.material}:${role}`);
      assert.equal(await page.locator('#palette-color').inputValue(), role === 'screen' ? '#041d2a' : '#00e5ef');
    }
    await page.locator('#phone-toggle').check();
    await page.locator('#silhouette-button').click();
    await page.locator('#review-close').click();
    await page.locator('#viewport').screenshot({path:`${folder}/shared-palette-phone.png`});
    await page.locator('#clip-select').selectOption({label:'work'});
    await page.locator('#timeline').fill('0.5');
    await page.locator('#viewport').screenshot({path:`${folder}/shared-palette-work-phone.png`});
    states.push(await page.evaluate(() => window.inspectorState()));
  }
  await page.goto(`${origin}/roster-palette.html`);
  assert.equal(await page.locator('article').count(),21);
  await page.locator('#current').click();
  const before = await page.locator('.asset-image').first().getAttribute('src');
  await page.locator('#candidate').click();
  assert.notEqual(await page.locator('.asset-image').first().getAttribute('src'),before);
  assert.match(await page.locator('#state').innerText(),/read-only/);
  await page.screenshot({path:`${out}/board-final.png`,fullPage:true});
  for (const text of ['Copilot family','Problems','Work and character towers','Campus references']) {
    await page.getByRole('heading',{name:text,exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:`${out}/section-${text.toLowerCase().replaceAll(' ','-')}.png`});
  }
  await page.locator('#gray').click();
  assert(await page.locator('body').evaluate(e=>e.classList.contains('gray')));
  await page.getByRole('heading',{name:'Same scale, same light',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:`${out}/grayscale.png`});
  await page.setViewportSize({width:390,height:844});
  await page.locator('#gray').click();
  await page.evaluate(()=>scrollTo(0,0));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`${out}/board-phone.png`});
  assert.deepEqual(errors,[]);
  await fs.writeFile(`${out}/verification.json`,JSON.stringify({passed:true,errors,states,checks:'Current GLB hashes, source-authored screen/cyan swatches on both materials, phone rest/work captures, before/refined control, grayscale toggle, 390px layout without page overflow'},null,2));
  console.log('Palette board and final Inspector checks passed.');
} finally {await browser.close(); await new Promise(r=>server.close(r));}
