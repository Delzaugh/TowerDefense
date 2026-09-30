import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { PerformanceReport, PerformanceStreamSummary } from '../../src/diagnostics/types';

async function ready(page: Page) {
  await page.goto('/#/stress');
  await expect(page.getByTestId('stress-screen')).toHaveAttribute('data-state', 'ready', { timeout: 30000 });
}
async function stream(page: Page): Promise<PerformanceStreamSummary> {
  return page.evaluate(() => window.__TOWER_PERFORMANCE__!.snapshot().streams.find(item => item.name === 'stress-map')!);
}
async function downloadReport(page: Page): Promise<PerformanceReport> {
  const promised = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download benchmark JSON' }).click();
  const download = await promised;
  const file = await download.path();
  if (!file) throw new Error('No benchmark download.');
  return JSON.parse(await readFile(file, 'utf8')) as PerformanceReport;
}

test.describe('performance stress fixture', () => {
  test.setTimeout(90000);

  test('optional tracking, loads, views, pause, reset and partial recording work', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await ready(page);
    await expect(page.getByTestId('performance-panel')).toHaveCount(0);
    await page.getByRole('checkbox', { name: 'Performance tracking', exact: true }).check();
    await expect.poll(async () => (await stream(page)).samples).toBeGreaterThan(1);
    for (const count of [50, 100, 200, 25]) {
      await page.getByRole('group', { name: 'Moving model count' }).getByRole('button', { name: String(count), exact: true }).click();
      await expect.poll(async () => ((await stream(page)).metrics.state as { movers: number }).movers).toBe(count);
    }
    await page.getByRole('button', { name: 'Top view', exact: true }).click();
    expect(((await stream(page)).metrics.state as { view: string }).view).toBe('top');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect.poll(async () => ((await stream(page)).metrics.state as { paused: boolean }).paused).toBe(true);
    await page.waitForTimeout(100);
    const samples = (await stream(page)).samples;
    await page.waitForTimeout(120);
    expect((await stream(page)).samples).toBe(samples);
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.getByRole('button', { name: 'Reset seed', exact: true }).click();
    await page.getByRole('button', { name: 'Run benchmark', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Cancel benchmark', exact: true })).toBeVisible();
    await expect.poll(async () => (await stream(page)).samples).toBeGreaterThan(samples);
    await page.getByRole('button', { name: 'Cancel benchmark', exact: true }).click();
    const partial = await downloadReport(page);
    expect(partial.status).toBe('cancelled');
    expect(partial.configuration.owner).toBe('stress-map');
    expect(partial.phases[0]?.name).toBe('warmup');
    expect(partial.streams.find(item => item.name === 'stress-map')?.samples).toBeGreaterThan(0);
    await page.screenshot({ path: info.outputPath('stress-map.png'), fullPage: true });
    await page.getByRole('link', { name: 'Campus', exact: true }).click();
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90000 });
    expect((await stream(page)).active).toBe(false);
    expect(errors).toEqual([]);
  });

  test('resize and context loss retain a partial benchmark', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Resize/context-loss coverage runs in one desktop workload.');
    await ready(page);
    await page.getByRole('button', { name: 'Run benchmark', exact: true }).click();
    await expect.poll(async () => (await stream(page)).samples).toBeGreaterThan(1);
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ width: viewport.width - 80, height: viewport.height });
    await expect(page.getByRole('button', { name: 'Download benchmark JSON' })).toBeVisible();
    expect((await downloadReport(page)).status).toBe('cancelled');
    await page.getByRole('button', { name: 'Run benchmark', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Cancel benchmark', exact: true })).toBeVisible();
    await page.locator('.stress-world canvas').evaluate((element: HTMLCanvasElement) => {
      const extension = element.getContext('webgl2')!.getExtension('WEBGL_lose_context')!;
      element.addEventListener('webglcontextlost', () => setTimeout(() => extension.restoreContext(), 100), { once: true });
      extension.loseContext();
    });
    await expect(page.getByTestId('stress-screen')).toHaveAttribute('data-state', 'error');
    const lost = await downloadReport(page);
    expect(lost.status).toBe('failed');
    expect(lost.phases.length).toBeGreaterThan(0);
    await expect.poll(() => page.locator('.stress-world canvas').evaluate((element: HTMLCanvasElement) => element.getContext('webgl2')!.isContextLost())).toBe(false);
    await page.getByRole('button', { name: 'Reload map', exact: true }).click();
    await expect(page.getByTestId('stress-screen')).toHaveAttribute('data-state', 'ready');
  });

  test('automatic benchmark completes all phases with renderer evidence', async ({ page, isMobile }, info) => {
    test.skip(isMobile, 'The timing benchmark runs once without another browser workload.');
    await ready(page);
    await page.getByRole('button', { name: 'Run benchmark', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Download benchmark JSON' })).toBeVisible({ timeout: 60000 });
    const report = await downloadReport(page);
    expect(report.status).toBe('completed');
    expect(report.phases.map(phase => phase.name)).toEqual(['warmup', 'baseline-25', 'load-50', 'load-100', 'load-200', 'recovery-25']);
    for (const phase of report.phases) {
      const measured = phase.streams.find(item => item.name === 'stress-map')!;
      expect(measured.samples).toBeGreaterThan(1);
      expect(measured.calls?.p50).toBeGreaterThan(0);
      expect(measured.triangles?.p50).toBeGreaterThan(0);
      expect(measured.cpuMs?.p95).toBeGreaterThan(0);
      expect(measured.stageCpuMs.animationAndMotion).toBeDefined();
    }
    await info.attach('stress-benchmark', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  });
});
