const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'inspection-depth-captures');
const base = process.env.TOWER_REVIEW_URL || 'http://127.0.0.1:5191/';
fs.mkdirSync(output, { recursive: true });
let browser;
(async () => {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [], requests = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => requests.push(request.url()));
  const ready = () => page.waitForFunction(() => document.querySelector('[data-testid="tower-showcase"]')?.getAttribute('data-state') === 'ready', null, { timeout: 30000 });
  await page.goto(`${base}?diagnostics`);
  await page.waitForFunction(() => document.querySelector('[data-testid="home-screen"]')?.getAttribute('data-state') === 'ready', null, { timeout: 60000 });
  await page.getByRole('button', { name: 'Inspect Towers', exact: true }).click();
  await ready();
  await page.evaluate(() => document.fonts.ready);
  const dialog = page.locator('.codex-dialog');
  for (const theme of ['light', 'dark']) {
    await dialog.getByLabel('Appearance', { exact: true }).selectOption(theme);
    for (const size of [{ width: 1600, height: 1000 }, { width: 1280, height: 800 }, { width: 1024, height: 600 }, { width: 844, height: 390 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(size);
      await dialog.getByRole('button', { name: 'Personas', exact: true }).click();
      await dialog.locator('[data-tower="developer"]').click();
      await ready();
      await dialog.locator('.codex-workbench').evaluate(node => node.scrollTo(0, 0));
      const measure = () => page.evaluate(() => {
        const panel = document.querySelector('.codex-stats').getBoundingClientRect();
        const stage = document.querySelector('.codex-stage').getBoundingClientRect();
        const body = document.querySelector('.codex-stats-body');
        return { panelHeight: panel.height, panelWidth: panel.width, stageHeight: stage.height,
          sideBySide: panel.x > stage.x, overflow: document.querySelector('.codex-dialog').scrollWidth > innerWidth,
          modelHeight: document.querySelector('.codex-model-viewport').getBoundingClientRect().height,
          scrollable: body.scrollHeight > body.clientHeight };
      });
      const initial = await measure();
      await page.screenshot({ path: path.join(output, `${theme}-${size.width}.png`) });
      const heights = {};
      for (const id of ['tester', 'analyst']) {
        await dialog.locator(`[data-tower="${id}"]`).click();
        if (id !== 'analyst') await ready();
        heights[id] = (await measure()).panelHeight;
      }
      await dialog.getByRole('button', { name: 'In development', exact: true }).click();
      await ready();
      heights.senior = (await measure()).panelHeight;
      checks.push({ theme, size, ...initial, heights });
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await dialog.getByRole('button', { name: 'Personas', exact: true }).click();
  await ready();
  await dialog.locator('.codex-workbench').evaluate(node => node.scrollTo(0, 0));
  const flow = dialog.locator('.ui-model-backdrop__flow');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const offset = () => flow.evaluate(node => getComputedStyle(node).strokeDashoffset);
  const before = await offset();
  await page.screenshot({ path: path.join(output, 'motion-start.png') });
  await page.waitForTimeout(500);
  const after = await offset();
  await page.screenshot({ path: path.join(output, 'motion-after.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await flow.evaluate(node => getComputedStyle(node).animationName);
  const failures = checks.filter(row => row.overflow || row.modelHeight < 210 || (row.sideBySide && Math.abs(row.panelHeight - row.stageHeight) > 1) || Object.values(row.heights).some(height => Math.abs(height - row.panelHeight) > 1));
  if (before === after || reduced !== 'none') failures.push({ motion: { before, after, reduced } });
  fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify({ base, errors, requests, checks, motion: { before, after, reduced }, failures }, null, 2));
  console.log(JSON.stringify({ layouts: checks.length, errors, requests, motion: { before, after, reduced }, failures }));
  await browser.close();
  if (errors.length || requests.length || failures.length) process.exitCode = 1;
})().catch(async error => { console.error(error); await browser?.close(); process.exitCode = 1; });
