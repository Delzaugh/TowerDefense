const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const output = path.join(__dirname, 'inspection-studio-captures');
const base = process.env.TOWER_REVIEW_URL || 'http://127.0.0.1:5191/';
fs.mkdirSync(output, { recursive: true });
let browser;

(async () => {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [], requests = [], layouts = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => requests.push({ url: request.url(), error: request.failure()?.errorText }));
  const ready = async screen => page.waitForFunction(id => document.querySelector(`[data-testid="${id}"]`)?.getAttribute('data-state') === 'ready', screen, { timeout: 60000 });
  await page.goto(`${base}?diagnostics`);
  await ready('home-screen');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, 'hub-light-desktop.png') });
  await page.locator('.home-canvas').screenshot({ path: path.join(output, 'campus-canvas.png') });
  // Pointer scan uses the same visible geometry hit test as real interaction.
  let hit = null;
  for (let y = 270; y <= 650 && !hit; y += 35) {
    for (let x = 550; x <= 1100 && !hit; x += 35) {
      await page.mouse.move(x, y);
      if (await page.locator('.home-building-hint').count()) hit = { x, y };
    }
  }
  if (!hit) throw new Error('Could not exercise the Lab hover highlight');
  await page.mouse.move(hit.x, hit.y);
  for (let frame = 0; frame < 3; frame++) {
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(output, `lab-hover-${frame}.png`) });
  }
  for (let click = 0; click < 14; click++) await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.mouse.move(794, 411);
  if (!await page.locator('.home-building-hint').count()) throw new Error('High zoom Lab hover was not exercised');
  for (let frame = 0; frame < 3; frame++) {
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(output, `lab-hover-close-${frame}.png`) });
  }
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect Towers', exact: true }).click();
  await ready('tower-showcase');
  await page.locator('[data-tower="developer"]').click();
  await ready('tower-showcase');
  for (const theme of ['light', 'dark']) {
    await page.locator('.codex-header').getByLabel('Appearance', { exact: true }).selectOption(theme);
    for (const size of [{ width: 1600, height: 900 }, { width: 1280, height: 800 }, { width: 1024, height: 685 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(size);
      await page.getByRole('button', { name: 'Reset preview', exact: true }).click();
      await page.waitForTimeout(100);
      await page.locator('.codex-workbench').evaluate(node => node.scrollTo(0, 0));
      await page.screenshot({ path: path.join(output, `inspection-${theme}-${size.width}.png`) });
      layouts.push(await page.evaluate(({ theme, size }) => {
        const rect = selector => {
          const box = document.querySelector(selector).getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom, right: box.right };
        };
        const stage = rect('.codex-stage'), roster = rect('.codex-collection'), stats = rect('.codex-stats');
        const header = document.querySelector('.codex-header');
        const labels = [...header.querySelectorAll('.ui-game-topbar__leading,.ui-game-topbar__context,.ui-game-topbar__trailing')].map(node => node.getBoundingClientRect());
        const headerOverlap = labels.slice(1).some((box, i) => box.left < labels[i].right - 1);
        return { theme, size, stage, roster, stats, headerOverlap,
          overflow: document.querySelector('.codex-dialog').scrollWidth > innerWidth,
          rosterSpansColumns: Math.abs(roster.x - stage.x) < 1 && Math.abs(roster.right - stats.right) < 1,
          model: rect('.codex-model-viewport') };
      }, { theme, size }));
    }
  }
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.locator('.codex-header').getByLabel('Appearance', { exact: true }).selectOption('light');
  await page.locator('.codex-workbench').evaluate(node => node.scrollTo(0, 0));
  await page.locator('.codex-model-viewport').hover();
  await page.mouse.wheel(0, -1500);
  await page.waitForTimeout(100);
  const zoom = await page.evaluate(() => window.__TOWER_DIAGNOSTICS__.showcase.sample().state.zoom);
  if (zoom < 4) throw new Error(`Close inspection zoom remained limited: ${zoom}`);
  await page.screenshot({ path: path.join(output, 'developer-close-inspection.png') });
  await page.getByRole('button', { name: 'Reset preview', exact: true }).click();
  await page.locator('[data-tower="tester"]').click();
  await ready('tower-showcase');
  await page.screenshot({ path: path.join(output, 'tester-inspection.png') });
  await page.getByRole('button', { name: 'In development', exact: true }).click();
  await page.locator('[data-tower="senior-developer"]').click();
  await ready('tower-showcase');
  await page.screenshot({ path: path.join(output, 'senior-inspection.png') });
  const failures = layouts.filter(item => item.overflow || item.headerOverlap || item.model.height < 210 || (item.size.width >= 1024 && !item.rosterSpansColumns));
  const report = { base, hit, zoom, errors, requests, layouts, failures };
  fs.writeFileSync(path.join(output, 'review.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ layouts: layouts.length, hit, zoom, errors, requests, failures }));
  await browser.close();
  if (errors.length || requests.length || failures.length) process.exitCode = 1;
})().catch(async error => { console.error(error); await browser?.close(); process.exitCode = 1; });
