import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../../../game/package.json', import.meta.url));
const { chromium } = require('playwright');
const out = new URL('./', import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [], failedRequests = [], checks = [];
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
function observe(p) {
  p.on('pageerror', e => errors.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('requestfailed', r => failedRequests.push(`${r.url()}: ${r.failure()?.errorText}`));
}
observe(page);
const state = () => page.evaluate(() => window.__COURTYARD_DRAFT__.state());
const button = s => page.locator(s);
async function clickPoint(point, height = 0) {
  const p = await page.evaluate(({ point, height }) => window.__COURTYARD_DRAFT__.project(point, height), { point, height });
  await page.mouse.click(p.x, p.y);
}
async function shot(name) { await page.screenshot({ path: new URL(name, out).pathname.replace(/^\/(\w:)/, '$1') }); }
try {
  await page.goto('http://127.0.0.1:5189/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('[data-ref="main-button"]')?.disabled === false);
  await shot('01-planning-desktop.png');
  assert.equal((await state()).health, 100);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  checks.push('Desktop loads registered models without horizontal overflow');
  await button('[data-action="place"]').click();
  await clickPoint({ x: -10, z: -8 });
  assert.equal((await state()).towers.length, 0);
  assert.equal((await state()).compute, 100);
  await clickPoint({ x: 2.5, z: 0 });
  assert.equal((await state()).towers.length, 0);
  await button('[data-action="cancel"]').click();
  checks.push('Road and Server reject real pointer placement without spending Compute');
  await button('[data-action="place"]').click();
  await clickPoint({ x: -11, z: -4 });
  assert.equal((await state()).towers.length, 1);
  await button('[data-persona="developer"]').click();
  assert.equal((await state()).towers[0].persona, 'developer');
  await button('[data-mode="build"]').click();
  assert.equal((await state()).towers[0].mode, 'build');
  await button('[data-mode="auto"]').click();
  await button('[data-action="place"]').click();
  await clickPoint({ x: -3.5, z: 0 });
  await button('[data-persona="tester"]').click();
  assert.equal((await state()).towers[1].persona, 'tester');
  assert.equal((await state()).compute, 0);
  checks.push('Pointer placement, mutually exclusive personas and focus controls spend the expected budget');
  await button('[data-view="top"]').click();
  await shot('02-team-top.png');
  await button('[data-view="iso"]').click();
  await button('[data-ref="main-button"]').click();
  await page.waitForFunction(() => window.__COURTYARD_DRAFT__.state().time > .5);
  await button('[data-ref="main-button"]').click();
  const paused = await state();
  assert.equal(paused.phase, 'paused');
  await page.waitForTimeout(900);
  assert.deepEqual(await state(), paused);
  assert.equal(await button('[data-action="place"]').isDisabled(), true);
  checks.push('Pause freezes the simulation and tactical edits');
  await button('[data-ref="main-button"]').click();
  await button('[data-speed="2"]').click();
  await page.waitForTimeout(1300);
  await shot('03-active-desktop.png');
  const partial = await state();
  for (const e of partial.entities) assert.equal(e.progress, 1 - e.remaining / e.maximum);
  for (let round = 1; round <= 3; round++) {
    await page.waitForFunction(() => ['cleared', 'complete', 'failed', 'paused'].includes(window.__COURTYARD_DRAFT__.state().phase), { timeout: 45000 });
    const result = await state();
    assert.equal(result.phase, round === 3 ? 'complete' : 'cleared', `Round ${round}: ${JSON.stringify(result)}`);
    console.log(`Browser round ${round}: ${result.completed} Work / ${result.resolved} Bugs / health ${result.health}`);
    if (round < 3) {
      const compute = result.compute;
      await button('[data-ref="main-button"]').click();
      assert.equal((await state()).compute, compute);
      assert.equal((await state()).towers.length, 2);
      await button('[data-ref="main-button"]').click();
    }
  }
  const finalState = await state();
  assert.equal(finalState.completed, 8); assert.equal(finalState.resolved, 7);
  assert.equal(finalState.missed, 0); assert.equal(finalState.health, 100);
  await shot('04-complete-desktop.png');
  checks.push('Two-specialist opening clears all three real-time rounds, carries budget/team, completes 8 Work and fixes 7 Bugs');
  const metrics = await page.evaluate(() => window.__COURTYARD_DRAFT__.diagnostics());
  await button('[data-ref="main-button"]').click();
  assert.equal((await state()).compute, 100); assert.equal((await state()).towers.length, 0);
  checks.push('Play again restores a fresh budget and team');

  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const phone = await phoneContext.newPage(); observe(phone);
  await phone.goto('http://127.0.0.1:5189/', { waitUntil: 'networkidle' });
  await phone.waitForFunction(() => document.querySelector('[data-ref="main-button"]')?.disabled === false);
  await phone.locator('[data-action="suggested"]').tap();
  assert.equal(await phone.evaluate(() => window.__COURTYARD_DRAFT__.state().towers.length), 3);
  await phone.locator('[data-action="toggle-tools"]').tap();
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await phone.screenshot({ path: new URL('05-phone-map.png', out).pathname.replace(/^\/(\w:)/, '$1') });
  const pick = await phone.evaluate(() => window.__COURTYARD_DRAFT__.project({ x: -11, z: -4 }, .9));
  await phone.touchscreen.tap(pick.x, pick.y);
  await phone.locator('[data-action="toggle-tools"]').tap();
  assert.match(await phone.locator('[data-ref="selected-name"]').textContent(), /Copilot #1/);
  await phone.locator('[data-view="top"]').tap();
  await phone.locator('[data-ref="main-button"]').tap();
  await phone.waitForFunction(() => window.__COURTYARD_DRAFT__.state().time > .5);
  await phone.locator('[data-ref="main-button"]').tap();
  assert.equal(await phone.evaluate(() => window.__COURTYARD_DRAFT__.state().phase), 'paused');
  await phone.screenshot({ path: new URL('06-phone-controls.png', out).pathname.replace(/^\/(\w:)/, '$1') });
  await phone.setViewportSize({ width: 844, height: 390 });
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await phone.screenshot({ path: new URL('07-phone-landscape.png', out).pathname.replace(/^\/(\w:)/, '$1') });
  checks.push('Phone touch supports suggested placement, map selection, camera, start/pause and collapsible controls; portrait/landscape have no horizontal overflow');
  assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
  const evidence = { checks, finalState, metrics, errors, failedRequests };
  await writeFile(new URL('browser-evidence.json', out), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.log(JSON.stringify({ errors, failedRequests, url: page.url(), body: await page.locator('body').innerText() }, null, 2));
  await shot('browser-failure.png');
  throw error;
} finally { await browser.close(); }
