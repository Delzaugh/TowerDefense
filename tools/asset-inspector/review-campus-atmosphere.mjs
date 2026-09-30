// Verify the built home, including shader output and the shared motion controls.
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(path.resolve('game/node_modules/playwright'));
const { PNG } = require(path.resolve('game/node_modules/playwright-core/lib/utilsBundle.js'));
function changes(first, second, backgroundOnly = false) {
  const a = PNG.sync.read(first), b = PNG.sync.read(second);
  let changed = 0;
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
    // This upper-left region is clear of terrain in the default desktop view.
    if (backgroundOnly && (x > a.width * .3 || y > a.height * .35)) continue;
    const i = (y * a.width + x) * 4;
    if ([0, 1, 2].some(c => Math.abs(a.data[i + c] - b.data[i + c]) > 2)) changed++;
  }
  return changed;
}
const directory = 'output/campus-atmosphere';
await fs.mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(process.env.CAMPUS_REVIEW_URL ?? 'http://127.0.0.1:5173/');
  await page.waitForFunction(() => document.querySelector('[data-testid="home-screen"]')?.dataset.state === 'ready');
  const canvas = page.getByTestId('campus-canvas');
  const first = await canvas.screenshot({ path: `${directory}/moving-first.png` });
  await page.waitForTimeout(2000);
  const second = await canvas.screenshot({ path: `${directory}/moving-second.png` });
  const report = { movingPixels: changes(first, second), currentPixels: changes(first, second, true) };
  if (report.movingPixels < 1000 || report.currentPixels < 25) throw new Error(`Motion missing: ${JSON.stringify(report)}`);
  await page.getByRole('button', { name: 'Pause ambience', exact: true }).click();
  await page.waitForTimeout(250);
  const paused = await canvas.screenshot();
  await page.waitForTimeout(700);
  report.pausedPixels = changes(paused, await canvas.screenshot());
  if (report.pausedPixels > 5) throw new Error('Paused scene changed.');
  await page.getByRole('button', { name: 'Resume ambience', exact: true }).click();
  await page.waitForTimeout(1000);
  report.resumedPixels = changes(paused, await canvas.screenshot());
  if (report.resumedPixels < 1000) throw new Error('Scene did not resume.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByText('Motion is reduced by your settings.', { exact: true }).waitFor();
  const reduced = await canvas.screenshot();
  await page.waitForTimeout(700);
  report.reducedPixels = changes(reduced, await canvas.screenshot());
  if (report.reducedPixels > 5) throw new Error('Reduced-motion scene changed.');
  report.errors = errors;
  await fs.writeFile(`${directory}/verification.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (errors.length) process.exitCode = 1;
} finally { await browser.close(); }
