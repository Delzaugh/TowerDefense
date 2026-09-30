import { expect, test } from '@playwright/test';

test('inspection keeps qualitative capabilities and collections in both appearances', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?diagnostics');
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
  await page.getByRole('button', { name: 'Inspect Towers', exact: true }).click();
  await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  const dialog = page.getByRole('dialog', { name: 'Tower Codex' });
  const appearance = dialog.getByRole('combobox', { name: 'Appearance' });
  const camera = () => page.evaluate(() => (window.__TOWER_DIAGNOSTICS__!.showcase!.sample().state as { zoom: number }));
  const initial = await camera();
  const zoom = dialog.getByRole('group', { name: 'Preview zoom' });
  await zoom.getByRole('button', { name: 'Zoom in', exact: true }).click();
  expect((await camera()).zoom).toBeGreaterThan(initial.zoom);
  await zoom.getByRole('button', { name: 'Zoom out', exact: true }).click();
  expect((await camera()).zoom).toBeCloseTo(initial.zoom);
  await zoom.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await zoom.getByRole('button', { name: 'Reset preview', exact: true }).click();
  expect((await camera()).zoom).toBe(initial.zoom);
  await expect(dialog.locator('.codex-room-shade')).toHaveCount(0);
  for (const theme of ['light', 'dark']) {
    await appearance.selectOption(theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    expect(await dialog.locator('.codex-stats').innerText()).not.toMatch(/\d/);
    for (const gauge of await dialog.getByRole('meter').all()) {
      await expect(gauge.locator(':scope > span')).toHaveCount(8);
      await expect(gauge).toHaveAttribute('aria-valuetext', /.+/);
    }
    const surface = await dialog.locator('.codex-stats').evaluate(element => getComputedStyle(element).backgroundColor);
    expect(surface).toMatch(/^rgb\(/);
  }
  await dialog.getByRole('button', { name: 'In development', exact: true }).click();
  await expect(dialog.getByRole('group', { name: 'Choose a Tower' }).locator('button')).toHaveCount(2);
  await dialog.getByRole('button', { name: 'Personas', exact: true }).click();
  await expect(dialog.getByRole('group', { name: 'Choose a Tower' }).locator('button')).toHaveCount(7);
  await page.setViewportSize({ width: 1600, height: 1000 });
  const cards = await dialog.locator('.codex-portrait').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
  expect(Math.max(...cards) - Math.min(...cards)).toBeLessThan(1);
  const stage = await dialog.locator('.codex-stage').boundingBox();
  const panel = await dialog.locator('.codex-stats').boundingBox();
  const roster = await dialog.locator('.codex-collection').boundingBox();
  expect(roster!.x).toBe(stage!.x);
  expect(roster!.x + roster!.width).toBeCloseTo(panel!.x + panel!.width, 0);
  expect(roster!.y).toBeGreaterThan(stage!.y + stage!.height);
  expect(roster!.y).toBeGreaterThan(panel!.y + panel!.height);
  expect(panel!.height).toBeLessThan(stage!.height);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  const bounds = await dialog.locator('.codex-model-viewport').boundingBox();
  expect(bounds!.width).toBeGreaterThan(240);
  expect(bounds!.height).toBeGreaterThan(200);
  await expect(dialog.getByRole('button', { name: 'Back to Hub', exact: true })).toBeInViewport();
});
