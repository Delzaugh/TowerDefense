import { expect, test } from '@playwright/test';

test.describe('Tower inspection usability', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/?diagnostics');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
    await page.getByRole('button', { name: 'Inspect Towers' }).click();
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  });

  test('keyboard browsing reveals the selected portrait and explains stats without numeric readouts', async ({ page }) => {
    const roster = page.getByRole('group', { name: 'Choose a Tower' });
    await expect(roster.locator('button[tabindex="0"]')).toHaveCount(1);
    await roster.getByRole('button', { name: 'Developer', exact: true }).press('End');
    const linter = roster.getByRole('button', { name: 'Linter Agent', exact: true });
    await expect(linter).toBeFocused();
    await expect(linter).toBeInViewport();
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready');
    await expect(page.locator('.codex-stats')).toContainText('connecting projectile');
    await expect(page.locator('.codex-stats button, .codex-stats .octicon-info')).toHaveCount(0);
    expect(await page.locator('.codex-stats').innerText()).not.toMatch(/\d/);
    await linter.press('Home');
    await expect(roster.getByRole('button', { name: 'Base Copilot', exact: true })).toBeFocused();
    await expect(page.locator('.codex-stats')).toContainText('An affordable starting Tower');
    await expect(roster.getByRole('button', { name: 'Tester', exact: true })).toHaveAccessibleDescription('Model preview coming soon. Role and stats are available.');
  });

  test('keyboard camera controls keep a large preview and stats remain visible across layouts', async ({ page }, testInfo) => {
    const preview = page.getByRole('group', { name: 'Developer model preview' });
    const before = await preview.boundingBox();
    const camera = () => page.evaluate(() => (window.__TOWER_DIAGNOSTICS__!.showcase!.sample().state as { azimuth: number; zoom: number }));
    const initial = await camera();
    await expect(page.getByRole('group', { name: 'Model camera controls' })).toHaveCount(0);
    await preview.focus();
    await preview.press('ArrowRight');
    expect((await camera()).azimuth).not.toBe(initial.azimuth);
    expect(await preview.boundingBox()).toEqual(before);
    await preview.press('r');
    expect((await camera()).azimuth).toBe(initial.azimuth);
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.screenshot({ path: testInfo.outputPath('showcase-desktop.png') });
    for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1024, height: 600 }]) {
      await page.setViewportSize(size);
      await expect(page.locator('.codex-stats')).toBeVisible();
      await expect(page.getByRole('group', { name: 'Animation selection' })).toHaveCount(0);
      await preview.focus();
      await preview.press('+');
      expect((await camera()).zoom).toBeGreaterThan(initial.zoom);
      await preview.press('r');
      expect((await camera()).zoom).toBe(initial.zoom);
      const bounds = await preview.boundingBox();
      expect(bounds!.width).toBeGreaterThan(240);
      expect(bounds!.height).toBeGreaterThan(size.height < 500 ? 160 : 200);
      if (size.width > 900) {
        const panel = await page.locator('.codex-stats').boundingBox();
        expect(panel!.x).toBeGreaterThan(bounds!.x + bounds!.width);
        expect(panel!.height).toBeGreaterThan(size.height * .7);
      }
      const dialog = page.locator('.codex-dialog');
      expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      await expect(page.getByRole('button', { name: 'Back to Hub', exact: true })).toBeInViewport();
    }
  });
});
