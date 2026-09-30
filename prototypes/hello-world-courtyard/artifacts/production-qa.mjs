import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../../../game/package.json', import.meta.url));
const { chromium } = require('playwright');
const out = new URL('./', import.meta.url);
const path = name => new URL(name, out).pathname.replace(/^\/(\w:)/, '$1');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [], failedRequests = [], checks = [];
function observe(p) {
  p.on('pageerror', e => errors.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('requestfailed', r => failedRequests.push(`${r.url()}: ${r.failure()?.errorText}`));
}
async function ready(p, url) {
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.querySelector('[data-ref="main-button"]')?.disabled === false);
}
try {
  const dev = await browser.newPage({ viewport: { width: 1280, height: 900 } }); observe(dev);
  await ready(dev, 'http://127.0.0.1:5189/');
  const visibility = await dev.evaluate(() => ({
    blocked: window.__COURTYARD_DRAFT__.coverage({ x: 4.6, z: -2.6 }, { x: .3, z: -.5 }),
    clear: window.__COURTYARD_DRAFT__.coverage({ x: 4.6, z: -2.6 }, { x: 0, z: -4 }),
  }));
  assert.deepEqual(visibility, { blocked: false, clear: true });
  await dev.locator('[data-action="place"]').click();
  const p = await dev.evaluate(() => window.__COURTYARD_DRAFT__.project({ x: 4.6, z: -2.6 }));
  await dev.mouse.click(p.x, p.y);
  await dev.locator('[data-view="top"]').click();
  await dev.screenshot({ path: path('08-server-coverage.png') });
  checks.push('In-range sight across the Server is blocked; sight beside it remains clear');
  await dev.close();

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } }); observe(desktop);
  await ready(desktop, 'http://127.0.0.1:5190/');
  assert.equal(await desktop.evaluate(() => window.__COURTYARD_DRAFT__), undefined);
  await desktop.screenshot({ path: path('09-final-planning.png') });
  await desktop.locator('[data-action="suggested"]').click();
  await desktop.locator('[data-speed="2"]').click();
  await desktop.locator('[data-ref="main-button"]').click();
  await desktop.waitForTimeout(650);
  await desktop.locator('[data-ref="main-button"]').click();
  assert.equal(await desktop.locator('[data-speed="1"]').isDisabled(), true);
  assert.equal(await desktop.locator('[data-speed="2"]').isDisabled(), true);
  await desktop.locator('[data-ref="main-button"]').click();
  for (let round = 1; round <= 3; round++) {
    await desktop.locator('.draft-ui').waitFor();
    await desktop.waitForFunction(() => ['cleared', 'complete', 'failed', 'paused'].includes(document.querySelector('.draft-ui').dataset.phase), { timeout: 45000 });
    assert.equal(await desktop.locator('.draft-ui').getAttribute('data-phase'), round === 3 ? 'complete' : 'cleared');
    console.log(`Production round ${round}: cleared`);
    if (round < 3) { await desktop.locator('[data-ref="main-button"]').click(); await desktop.locator('[data-ref="main-button"]').click(); }
  }
  const outcomes = {
    work: await desktop.locator('[data-ref="completed"]').textContent(),
    bugs: await desktop.locator('[data-ref="resolved"]').textContent(),
    missed: await desktop.locator('[data-ref="missed"]').textContent(),
    health: await desktop.locator('[data-ref="health"]').textContent(),
  };
  assert.deepEqual(outcomes, { work: '8', bugs: '7', missed: '0', health: '100 / 100' });
  await desktop.screenshot({ path: path('10-final-complete.png') });
  checks.push('Built app has no development controller hook; suggested three-Base team clears all rounds through UI input');
  checks.push('Paused speed buttons are disabled');

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }); observe(phone);
  await ready(phone, 'http://127.0.0.1:5190/');
  await phone.locator('[data-action="suggested"]').tap();
  const canvas = phone.locator('canvas[aria-label="Hello World Courtyard 3D map"]');
  const before = await canvas.screenshot();
  await phone.locator('[data-zoom="in"]').tap();
  await phone.waitForTimeout(250);
  const zoomed = await canvas.screenshot();
  assert.equal(before.equals(zoomed), false);
  await phone.locator('[data-zoom="fit"]').tap();
  await phone.waitForTimeout(250);
  assert.equal(before.equals(await canvas.screenshot()), true);
  await phone.locator('[data-action="toggle-tools"]').tap();
  await phone.screenshot({ path: path('11-final-phone.png') });
  for (const size of [{ width: 320, height: 568 }, { width: 667, height: 375 }, { width: 740, height: 375 }]) {
    await phone.setViewportSize(size);
    await phone.waitForTimeout(150);
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const box = await canvas.boundingBox(); assert.ok(box.width > 100 && box.height > 120);
  }
  checks.push('Touch zoom changes the rendered canvas; Fit restores it; 320px phone and two landscape sizes remain usable');
  assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);

  const broken = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await broken.route('**/*.glb', r => r.abort('failed'));
  await broken.goto('http://127.0.0.1:5190/', { waitUntil: 'networkidle' });
  await broken.waitForTimeout(1200);
  assert.match(await broken.locator('[data-ref="loading"]').textContent(), /models could not load.*Reload/);
  assert.equal(await broken.locator('[data-ref="main-button"]').isDisabled(), true);
  checks.push('Deliberately failed asset load preserves a clear reload message and disables play');
  const evidence = { checks, outcomes, errors, failedRequests, intentionalAssetFailure: 'Handled with persistent reload feedback' };
  await writeFile(new URL('production-evidence.json', out), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) { console.log(JSON.stringify({ errors, failedRequests }, null, 2)); throw error; }
finally { await browser.close(); }
