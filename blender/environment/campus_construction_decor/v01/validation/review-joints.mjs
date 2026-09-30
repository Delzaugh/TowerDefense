import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(path.resolve('game/node_modules/playwright'));
const out = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1700, height: 1250 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:4175/?asset=campus_construction_decor&version=v01');
  await page.waitForFunction(() => window.inspectorState?.().entries.length === 1 && !window.inspectorState().loading);
  await page.locator('#grid-button').click();
  const cameras = [];
  for (const view of ['iso', 'rear']) {
    await page.locator(`[data-view="${view}"]`).click();
    const canvas = await page.locator('#viewport').boundingBox();
    if (view === 'rear') {
      await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
      await page.mouse.down();
      await page.mouse.move(canvas.x + canvas.width / 2 + 80, canvas.y + canvas.height / 2 - 60, { steps: 8 });
      await page.mouse.up();
    }
    const pan = await page.evaluate(async () => {
      const THREE = await import('/vendor/three.module.js');
      const state = window.inspectorState();
      const c = new THREE.PerspectiveCamera(45, 1, .01, 1000);
      c.position.fromArray(state.camera); c.lookAt(new THREE.Vector3(...state.target)); c.updateMatrixWorld();
      const delta = new THREE.Vector3(-5.4, 2.4, 1).sub(new THREE.Vector3(...state.target));
      const scale = 2 * state.distance * Math.tan(Math.PI / 8) / document.getElementById('viewport').clientHeight;
      return { x: -delta.dot(new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 0)) / scale,
        y: delta.dot(new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 1)) / scale };
    });
    const start = { x: canvas.x + canvas.width / 2, y: canvas.y + canvas.height / 2 };
    await page.mouse.move(start.x, start.y); await page.mouse.down({ button: 'right' });
    await page.mouse.move(start.x + pan.x, start.y + pan.y, { steps: 8 }); await page.mouse.up({ button: 'right' });
    for (let i = 0; i < (view === 'rear' ? 3 : 4); i++) await page.locator('#zoom-in-button').click();
    await page.locator('#viewport').screenshot({ path: path.join(out, `joint-${view}.png`) });
    cameras.push({ view, state: await page.evaluate(() => window.inspectorState()) });
  }
  await page.locator('[data-view="iso"]').click();
  await page.locator('#review-open').click();
  await page.locator('#phone-toggle').check();
  await page.locator('#review-close').click();
  await page.locator('#frame-button').click();
  await page.locator('#viewport').screenshot({ path: path.join(out, 'joint-phone.png') });
  await fs.writeFile(path.join(out, 'joint-camera-evidence.json'), JSON.stringify({ cameras, errors }, null, 2));
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Captured construction joints in Inspector close, reverse and phone views.');
} finally { await browser.close(); }
