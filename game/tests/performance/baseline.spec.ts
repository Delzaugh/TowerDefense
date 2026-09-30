import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import type { PerformanceReport } from '../../src/diagnostics/types';

test('repeatable 3D stress baseline with downloadable phases and warmed recovery', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/stress');
  await expect(page.getByTestId('stress-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
  await page.getByRole('button', { name: 'Run benchmark', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Download benchmark JSON', exact: true })).toBeVisible({ timeout: 70_000 });
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download benchmark JSON', exact: true }).click();
  const download = await downloading;
  const reportPath = info.outputPath('report.json'); await download.saveAs(reportPath);
  const report = JSON.parse(await readFile(reportPath, 'utf8')) as PerformanceReport;
  expect(report.status).toBe('completed');
  expect(report.phases.map(phase => phase.name)).toEqual(['warmup', 'baseline-25', 'load-50', 'load-100', 'load-200', 'recovery-25']);
  expect(report.environment.build).not.toBeNull();
  expect(report.events.filter(event => event.type === 'error')).toEqual([]);
  const phases = report.phases.map(phase => ({ name: phase.name, stream: phase.streams.find(stream => stream.name === 'stress-map')! }));
  expect(phases.every(phase => phase.stream.samples >= 10)).toBe(true);
  expect(phases.every(phase => phase.stream.metrics.calls! > 0 && phase.stream.metrics.triangles! > 0)).toBe(true);
  const baseline = phases[1]!.stream, recovery = phases.at(-1)!.stream;
  expect(recovery.metrics.geometries).toBe(baseline.metrics.geometries);
  expect(recovery.metrics.textures).toBe(baseline.metrics.textures);
  const summary = {
    profile: info.project.name, headless: !process.env.TOWER_PERF_HEADED,
    physicalDevice: false, release: report.environment.build,
    phases: phases.map(({ name, stream }) => ({ name, samples: stream.samples, fps: stream.fps,
      frameP95: stream.frameIntervalMs?.p95, cpuP95: stream.cpuMs?.p95, callsP95: stream.calls?.p95,
      trianglesP95: stream.triangles?.p95, geometries: stream.metrics.geometries, textures: stream.metrics.textures })),
    errors,
  };
  const summaryPath = info.outputPath('summary.json'); await writeFile(summaryPath, JSON.stringify(summary, null, 2));
  await info.attach('performance-report', { path: reportPath, contentType: 'application/json' });
  await info.attach('performance-summary', { path: summaryPath, contentType: 'application/json' });
  await page.getByRole('group', { name: 'Moving model count' }).getByRole('button', { name: '200', exact: true }).click();
  await page.waitForTimeout(150);
  const canvas = page.locator('.stress-world canvas');
  const motionA = await canvas.screenshot({ path: info.outputPath('motion-a.png') });
  await page.waitForTimeout(500);
  const motionB = await canvas.screenshot({ path: info.outputPath('motion-b.png') });
  expect(motionA.equals(motionB)).toBe(false);
  await page.screenshot({ path: info.outputPath('stress-200.png'), fullPage: true });
  expect(errors).toEqual([]);
});
