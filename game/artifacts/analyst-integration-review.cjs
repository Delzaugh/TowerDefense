const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOWER_REVIEW_URL || 'http://127.0.0.1:5191/';
const output = path.join(__dirname, 'analyst-integration-captures');
fs.mkdirSync(output, { recursive: true });
let browser;
(async () => {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [], requests = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => requests.push(request.url()));
  await page.goto(`${base}?diagnostics`);
  await page.waitForFunction(() => document.querySelector('[data-testid="home-screen"]')?.getAttribute('data-state') === 'ready', null, { timeout: 60000 });
  await page.getByRole('button', { name: 'Inspect Towers', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="tower-showcase"]')?.getAttribute('data-state') === 'ready');
  await page.getByRole('button', { name: 'Analyst', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="tower-showcase"]')?.getAttribute('data-state') === 'ready');
  for (const theme of ['light', 'dark']) {
    await page.locator('.codex-dialog').getByLabel('Appearance', { exact: true }).selectOption(theme);
    for (const size of [{ width: 1600, height: 1000 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(size);
      await page.locator('.codex-workbench').evaluate(node => node.scrollTo(0, 0));
      await page.screenshot({ path: path.join(output, `${theme}-${size.width}.png`) });
      const result = await page.evaluate(() => {
        const preview = document.querySelector('.codex-model-viewport').getBoundingClientRect();
        const stage = document.querySelector('.codex-stage').getBoundingClientRect();
        const panel = document.querySelector('.codex-stats').getBoundingClientRect();
        const portrait = document.querySelector('[data-tower="analyst"] img');
        const sample = window.__TOWER_DIAGNOSTICS__.showcase.sample();
        return { tower: sample.state.tower, animation: document.querySelector('[data-testid="tower-showcase"]').getAttribute('data-animation'),
          portrait: portrait.complete && portrait.naturalWidth > 0, fullCard: Math.abs(preview.height - stage.height + 2) < 1,
          stablePanel: panel.x <= stage.x || Math.abs(panel.height - stage.height) < 1,
          overflow: document.querySelector('.codex-dialog').scrollWidth > innerWidth, triangles: sample.triangles };
      });
      checks.push({ theme, size, ...result });
    }
  }
  const failures = checks.filter(check => check.tower !== 'analyst' || check.animation !== 'rest' || !check.portrait || !check.fullCard || !check.stablePanel || check.overflow || check.triangles <= 0);
  const report = { base, checks, errors, requests, failures };
  fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await browser.close();
  if (failures.length || errors.length || requests.length) process.exitCode = 1;
})().catch(async error => { console.error(error); await browser?.close(); process.exitCode = 1; });
