import { expect, test } from '@playwright/test';

test('inspection keeps qualitative capabilities and collections in both appearances', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?diagnostics');
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
  await page.getByRole('button', { name: 'Inspect Towers', exact: true }).click();
  await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  const dialog = page.getByRole('dialog', { name: 'Tower Codex' });
  const appearance = dialog.getByRole('combobox', { name: 'Appearance' });
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
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  const bounds = await dialog.locator('.codex-model-viewport').boundingBox();
  expect(bounds!.width).toBeGreaterThan(240);
  expect(bounds!.height).toBeGreaterThan(200);
  await expect(dialog.getByRole('button', { name: 'Back to Hub', exact: true })).toBeInViewport();
});
