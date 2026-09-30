const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOWER_REVIEW_URL || 'http://127.0.0.1:5191/';
const output = path.join(__dirname, 'inspection-ambient-captures');
fs.mkdirSync(output, { recursive: true });
let browser;
(async () => {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  const errors = [], requests = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => requests.push(request.url()));
  await page.goto(`${base}?diagnostics`);
  await page.waitForFunction(() => document.querySelector('[data-testid="home-screen"]')?.getAttribute('data-state') === 'ready', null, { timeout: 60000 });
  await page.getByRole('button', { name: 'Inspect Towers', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="tower-showcase"]')?.getAttribute('data-state') === 'ready');
  const dialog = page.locator('.codex-dialog');
  for (const theme of ['light', 'dark']) {
    await dialog.getByLabel('Appearance', { exact: true }).selectOption(theme);
    for (const size of [{ width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      await page.locator('.codex-workbench').evaluate(node => node.scrollTo(0, 0));
      await page.getByRole('button', { name: 'Reset preview', exact: true }).click();
      await page.screenshot({ path: path.join(output, `${theme}-${size.width}-default.png`) });
      const preview = page.locator('.codex-model-viewport');
      await preview.focus();
      for (let index = 0; index < 8; index++) await preview.press('+');
      await page.screenshot({ path: path.join(output, `${theme}-${size.width}-closeup.png`) });
      const result = await page.evaluate(() => {
        const stage = document.querySelector('.codex-stage').getBoundingClientRect();
        const canvas = document.querySelector('.codex-scene').getBoundingClientRect();
        const heading = document.querySelector('.codex-model-heading').getBoundingClientRect();
        const ambience = document.querySelector('.ui-page-atmosphere').getBoundingClientRect();
        return { fullCard: Math.abs(canvas.y - stage.y - 1) < 1 && Math.abs(canvas.height - stage.height + 2) < 1,
          overlayVisible: heading.y >= stage.y && heading.bottom < stage.bottom,
          ambientFullPage: ambience.width === innerWidth && ambience.height === innerHeight,
          zoom: window.__TOWER_DIAGNOSTICS__.showcase.sample().state.zoom };
      });
      checks.push({ theme, size, ...result });
    }
  }
  const light = page.locator('.ui-page-atmosphere__light--blue');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const transform = () => light.evaluate(node => getComputedStyle(node).transform);
  const before = await transform();
  await page.waitForTimeout(700);
  const after = await transform();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await light.evaluate(node => getComputedStyle(node).animationName);
  const failures = checks.filter(check => !check.fullCard || !check.overlayVisible || !check.ambientFullPage || check.zoom < 4);
  if (before === after || reduced !== 'none') failures.push({ motion: { before, after, reduced } });
  const report = { base, checks, motion: { before, after, reduced }, errors, requests, failures };
  fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await browser.close();
  if (failures.length || errors.length || requests.length) process.exitCode = 1;
})().catch(async error => { console.error(error); await browser?.close(); process.exitCode = 1; });
