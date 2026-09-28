import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

type Sample = { calls: number; triangles: number; geometries: number; textures: number; pixelRatio: number; state: { zoom: number; position?: number[]; azimuth?: number } };
const sample = (page: Page, name: string) => page.evaluate(name => {
  const diagnostics = (window as unknown as { __TOWER_DIAGNOSTICS__: Record<string, { sample(): Sample }> }).__TOWER_DIAGNOSTICS__;
  return diagnostics[name]!.sample();
}, name);

test.describe('mobile gestures and recovery', () => {
  test.setTimeout(120_000);

  test('real touch pan/pinch, cancellation, orientation and renderer cleanup', async ({ page, context, isMobile }, info) => {
    test.skip(!isMobile, 'Real multi-touch runs in the phone project.');
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?diagnostics');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
    const cdp = await context.newCDPSession(page);
    const touch = async (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', points: { x: number; y: number; id: number }[]) => {
      await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
    };
    const box = (await page.getByTestId('campus-canvas').boundingBox())!;
    const x = Math.round(box.x + box.width / 2), y = Math.round(box.y + box.height / 2);
    const before = await sample(page, 'campus');
    await touch('touchStart', [{ x: x - 40, y, id: 1 }, { x: x + 40, y, id: 2 }]);
    await touch('touchMove', [{ x: x - 65, y: y + 15, id: 1 }, { x: x + 65, y: y + 15, id: 2 }]);
    await touch('touchEnd', []);
    const after = await sample(page, 'campus');
    expect(after.state.zoom).toBeGreaterThan(before.state.zoom);
    expect(after.state.position).not.toEqual(before.state.position);
    await expect(page.locator('dialog.codex-dialog')).not.toBeVisible();
    await touch('touchStart', [{ x, y, id: 1 }]);
    await touch('touchCancel', []);
    await page.getByRole('button', { name: 'Reset view', exact: true }).click();
    expect((await sample(page, 'campus')).state.zoom).toBe(1);
    await page.getByRole('button', { name: 'Inspect Towers', exact: true }).click();
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    const preview = page.locator('.codex-model-viewport');
    const bounds = (await preview.boundingBox())!;
    const px = Math.round(bounds.x + bounds.width / 2), py = Math.round(bounds.y + bounds.height / 2);
    const initial = await sample(page, 'showcase');
    await touch('touchStart', [{ x: px - 60, y: py, id: 1 }, { x: px + 60, y: py, id: 2 }]);
    await touch('touchMove', [{ x: px - 35, y: py, id: 1 }, { x: px + 35, y: py, id: 2 }]);
    await touch('touchEnd', []);
    await expect.poll(async () => (await sample(page, 'showcase')).state.zoom).toBeLessThan(initial.state.zoom);
    await touch('touchStart', [{ x: px, y: py, id: 1 }]);
    await touch('touchMove', [{ x: px + 40, y: py + 10, id: 1 }]);
    await touch('touchCancel', []);
    expect((await sample(page, 'showcase')).state.azimuth).not.toBe(initial.state.azimuth);
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await preview.focus();
      await preview.press('r');
      const controls = await page.locator('.codex-collections button, .codex-back').evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect(); return { width: rect.width, height: rect.height };
      }));
      expect(controls.every(rect => rect.width >= 44 && rect.height >= 44)).toBe(true);
      await expect(page.getByRole('button', { name: 'Back to Hub' })).toBeInViewport();
      await page.screenshot({ path: info.outputPath(`showcase-${viewport.width}.png`) });
    }
    const rendered = await sample(page, 'showcase');
    expect(rendered.calls).toBeGreaterThan(0); expect(rendered.triangles).toBeGreaterThan(0);
    const diagnostics = info.outputPath('renderer-diagnostics.json');
    await writeFile(diagnostics, JSON.stringify({ campus: after, showcase: rendered }, null, 2));
    await info.attach('renderer-diagnostics', { path: diagnostics, contentType: 'application/json' });
    await page.getByRole('button', { name: 'Back to Hub' }).click();
    expect(await page.evaluate(() => Object.keys((window as unknown as { __TOWER_DIAGNOSTICS__: object }).__TOWER_DIAGNOSTICS__))).toEqual(['campus']);
    expect(errors).toEqual([]);
  });

  test('failed showcase screen download recovers using Reload app', async ({ page }) => {
    let fail = true;
    await page.route('**/assets/TowerShowcase-*.js', route => fail ? route.abort() : route.continue());
    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
    await page.getByRole('button', { name: 'Inspect Towers' }).click();
    await expect(page.getByRole('heading', { name: 'The workbench couldn’t open.' })).toBeVisible();
    fail = false;
    await page.getByRole('button', { name: 'Reload app', exact: true }).click();
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
    await page.getByRole('button', { name: 'Inspect Towers' }).click();
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  });

  test('stalled model download exposes Retry preview and a fresh attempt succeeds', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
    let fail = true;
    const requests: import('@playwright/test').Route[] = [];
    await page.route('**/copilot_developer_v01.*.glb', route => { if (fail) requests.push(route); else return route.continue(); });
    await page.getByRole('button', { name: 'Inspect Towers' }).click();
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'error', { timeout: 30_000 });
    fail = false;
    for (const route of requests) await route.abort().catch(() => undefined);
    await page.getByRole('button', { name: 'Retry preview' }).click();
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  });

  test('failed showcase renderer chunk recovers with a new document', async ({ page }) => {
    let fail = true;
    await page.route('**/assets/createTowerShowcaseScene-*.js', route => fail ? route.abort() : route.continue());
    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
    await page.getByRole('button', { name: 'Inspect Towers' }).click();
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'error');
    fail = false;
    await page.getByRole('button', { name: 'Reload app', exact: true }).click();
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
    await page.getByRole('button', { name: 'Inspect Towers' }).click();
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  });
});
