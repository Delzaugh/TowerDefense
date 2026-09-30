import { expect, test } from '@playwright/test';

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`Analyst's delivered static model loads and switches cleanly (${reducedMotion})`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion });
    await page.goto('/?diagnostics');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
    await page.getByRole('button', { name: 'Inspect Towers', exact: true }).click();
    const showcase = page.getByTestId('tower-showcase');
    await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    const analyst = page.getByRole('button', { name: 'Analyst', exact: true });
    await expect(analyst).toHaveAttribute('data-preview', 'available');
    await expect(analyst.locator('img')).toBeVisible();
    const loaded = page.waitForResponse(response => response.url().includes('copilot_analyst_v01.') && response.url().endsWith('.glb'));
    await analyst.click();
    expect((await loaded).ok()).toBe(true);
    await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await expect(showcase).toHaveAttribute('data-animation', 'rest');
    await expect(page.getByRole('heading', { name: 'Model preview coming soon' })).toHaveCount(0);
    await expect(page.locator('.codex-stats')).toContainText('Opportunity Discovery');
    await expect(page.locator('.codex-stats')).toContainText('Clear Briefing');
    const preview = page.getByRole('group', { name: 'Analyst model preview' });
    const state = () => page.evaluate(() => (window.__TOWER_DIAGNOSTICS__!.showcase!.sample().state as { tower: string; zoom: number; azimuth: number }));
    const original = await state();
    expect(original.tower).toBe('analyst');
    await preview.press('+');
    expect((await state()).zoom).toBeGreaterThan(original.zoom);
    await preview.press('ArrowRight');
    expect((await state()).azimuth).not.toBe(original.azimuth);
    await preview.press('r');
    await page.screenshot({ path: info.outputPath('analyst-inspection.png') });
    await page.getByRole('button', { name: 'Developer', exact: true }).click();
    await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    expect((await state()).tower).toBe('developer');
    await analyst.click();
    await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await expect(showcase).toHaveAttribute('data-animation', 'rest');
    expect((await state()).tower).toBe('analyst');
    expect(errors).toEqual([]);
  });
}
