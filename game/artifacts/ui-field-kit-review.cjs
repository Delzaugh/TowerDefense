const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const output = path.join(__dirname, 'ui-field-kit-captures');
fs.mkdirSync(output, { recursive: true });
const base = process.env.TOWER_REVIEW_URL || 'http://127.0.0.1:5191/TowerDefense/';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  const checks = [];
  for (const theme of ['dark', 'light']) {
    for (const size of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(size);
      await page.goto(base);
      await page.evaluate(value => localStorage.setItem('tower.ui.appearance.v1', value), theme);
      await page.reload();
      await page.getByTestId('home-screen').waitFor();
      await page.waitForFunction(() => document.querySelector('[data-testid="home-screen"]')?.getAttribute('data-state') === 'ready');
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(output, `hub-${theme}-${size.width}.png`), fullPage: true });
      await page.getByRole('button', { name: 'Inspect Towers', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="tower-showcase"]')?.getAttribute('data-state') === 'ready');
      await page.locator('[data-tower="developer"]').click();
      await page.waitForFunction(() => document.querySelector('[data-testid="tower-showcase"]')?.getAttribute('data-state') === 'ready');
      await page.screenshot({ path: path.join(output, `inspection-${theme}-${size.width}.png`), fullPage: true });
      checks.push(await page.evaluate(({ theme, size }) => ({
        theme, size, resolved: document.documentElement.dataset.theme,
        overflow: document.documentElement.scrollWidth > innerWidth,
        dialogOverflow: document.querySelector('.codex-dialog').scrollWidth > innerWidth,
        modelWidth: document.querySelector('.codex-model-viewport').getBoundingClientRect().width,
        modelHeight: document.querySelector('.codex-model-viewport').getBoundingClientRect().height,
        statsHaveDigits: /\d/.test(document.querySelector('.codex-stats').innerText),
      }), { theme, size }));
      await page.goto(`${base}#/lab`);
      await page.getByRole('button', { name: 'Start encounter', exact: true }).waitFor();
      await page.getByLabel('Advance automatically').uncheck();
      const map = page.locator('.tower-map');
      await map.focus(); await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
      await page.getByRole('button', { name: 'Step 60 ticks', exact: true }).click();
      await page.screenshot({ path: path.join(output, `encounter-${theme}-${size.width}.png`), fullPage: true });
      checks.push(await page.evaluate(({ theme, size }) => ({
        theme, size, screen: 'active encounter', resolved: document.documentElement.dataset.theme,
        overflow: document.documentElement.scrollWidth > innerWidth,
        phase: document.querySelector('[data-testid="encounter-phase"]').textContent,
        tick: document.querySelector('[data-testid="encounter-tick"]').textContent,
        towers: document.querySelectorAll('[data-testid="placed-tower"]').length,
      }), { theme, size }));
    }
  }
  const failures = checks.filter(check => check.overflow || check.dialogOverflow || check.statsHaveDigits || check.resolved !== check.theme || (check.screen && (!check.towers || Number(check.tick) < 60)));
  fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify({ base, errors, failedRequests, checks, failures }, null, 2));
  console.log(JSON.stringify({ layouts: checks.length, errors, failedRequests, failures }));
  await browser.close();
  if (failures.length || errors.length || failedRequests.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
