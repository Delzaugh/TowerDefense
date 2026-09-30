import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { inspectPage, summarize } from '../../../.agents/skills/threejs-qa-release/scripts/inspect-threejs-canvas.mjs';
const require = createRequire(new URL('../../../game/package.json', import.meta.url));
const { chromium } = require('playwright');
const manifest = JSON.parse(await readFile(new URL('./evidence.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const toPath = url => url.pathname.replace(/^\/(\w:)/, '$1');
try {
  for (const capture of manifest.captures) {
    const mobile = capture.mode === 'mobile';
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    // Inspector setup drives the same DOM controls as a player. No simulation state is fabricated.
    await page.addInitScript(() => {
      const until = predicate => new Promise(resolve => { const poll = () => predicate() ? resolve() : requestAnimationFrame(poll); poll(); });
      window.__THREE_GAME_TEST_HOOKS__ = {
        async setState(name) {
          if (name !== 'active-play') throw new Error('Unsupported inspection state');
          await until(() => document.querySelector('[data-ref="main-button"]')?.disabled === false);
          document.querySelector('[data-action="suggested"]').click();
          document.querySelector('[data-ref="main-button"]').click();
          await until(() => window.__COURTYARD_DRAFT__.state().time >= 2);
          return { state: name };
        },
        setPausedForScreenshot(paused) {
          const phase = window.__COURTYARD_DRAFT__.state().phase;
          if ((paused && phase === 'active') || (!paused && phase === 'paused')) document.querySelector('[data-ref="main-button"]').click();
        },
      };
      Object.defineProperty(window, '__THREE_GAME_DIAGNOSTICS__', { get: () => ({ renderer: window.__COURTYARD_DRAFT__?.diagnostics() }) });
    });
    const reportPath = toPath(new URL('../' + capture.report, import.meta.url));
    const report = await inspectPage(page, { url: 'http://127.0.0.1:5189/', mobile, state: capture.state, runId: manifest.runId, screenshotPath: reportPath.replace(/\.json$/, '.png') });
    await mkdir(toPath(new URL('./canvas-final/', import.meta.url)), { recursive: true });
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(summarize(report, reportPath));
    if(!report.result.ok){console.log(await page.evaluate(()=>({state:window.__COURTYARD_DRAFT__?.state(),text:document.body.innerText})));await page.screenshot({path:reportPath.replace(/\.json$/, '-failed.png')});}
    assert.equal(report.result.ok, true); assert.equal(report.consoleErrorCount, 0); assert.equal(report.pageErrorCount, 0);
    assert.equal(report.result.renderBudget.withinBudget, true);
    await context.close();
  }
} finally { await browser.close(); }
