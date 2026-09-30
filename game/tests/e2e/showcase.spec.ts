import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const campusReadyTimeout = 90_000;

async function openFromCard(page: Page) {
  await page.getByRole('button', { name: 'Inspect Towers' }).click();
  const dialog = page.locator('dialog.codex-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('tower-showcase')).toBeVisible();
  return dialog;
}

test.describe('Hub Tower browser', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: campusReadyTimeout });
  });

  test('the accessible entry preserves the Hub camera, ambience, selection, and focus on return', async ({ page }) => {
    await page.getByRole('button', { name: 'Top', exact: true }).click();
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.getByRole('button', { name: 'Pause ambience' }).click();
    const zoom = await page.getByRole('button', { name: 'Reset view' }).innerText();
    const dialog = await openFromCard(page);
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-browser-open', 'true');
    await expect(dialog.getByRole('heading', { name: 'Developer', exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Security', exact: true }).click();
    await expect(dialog.getByRole('heading', { name: 'Security', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Inspect Towers' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Top', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Reset view' })).toHaveText(zoom);
    await expect(page.getByRole('button', { name: 'Resume ambience' })).toBeVisible();
    await openFromCard(page);
    await expect(dialog.getByRole('heading', { name: 'Security', exact: true })).toBeVisible();
  });

  test('entry pushes the campus camera toward the Lab and restores it on close', async ({ page }) => {
    const reset = page.getByRole('button', { name: 'Reset view' });
    const initialZoom = Number((await reset.innerText()).replace('%', ''));
    await page.getByRole('button', { name: 'Inspect Towers' }).click();
    const home = page.getByTestId('home-screen');
    await expect(home).toHaveAttribute('data-browser-entering', 'true');
    await expect(page.locator('.home-reveal')).toBeVisible();
    await expect(reset).toHaveText(`${initialZoom}%`);
    const dialog = page.locator('dialog.codex-dialog');
    await expect(dialog).toBeVisible();
    await expect(home).toHaveAttribute('data-browser-entering', 'false');
    await dialog.getByRole('button', { name: 'Back to Hub' }).click();
    await expect(home).toHaveAttribute('data-browser-returning', 'true');
    await expect(home).toHaveAttribute('inert', '');
    await expect(page.locator('.home-reveal-return')).toBeVisible();
    await expect(dialog).not.toBeVisible();
    await expect(home).toHaveAttribute('data-browser-returning', 'false');
    await expect(reset).toHaveText(`${initialZoom}%`);
    await expect(page.getByRole('button', { name: 'Inspect Towers' })).toBeFocused();
  });

  test('hiding the page during return restores the Hub and unlocks it on visibility', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'touch-edge', 'Visibility cancellation is covered on desktop.');
    const initialZoom = await page.getByRole('button', { name: 'Reset view' }).innerText();
    const dialog = await openFromCard(page);
    await dialog.getByRole('button', { name: 'Back to Hub' }).click();
    const home = page.getByTestId('home-screen');
    await expect(home).toHaveAttribute('data-browser-returning', 'true');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(home).toHaveAttribute('data-browser-returning', 'false');
    await expect(page.getByRole('button', { name: 'Reset view' })).toHaveText(initialZoom);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await openFromCard(page);
  });

  test('enabling reduced motion during return finishes immediately', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'touch-edge', 'Mid-return motion changes are covered on desktop.');
    const initialZoom = await page.getByRole('button', { name: 'Reset view' }).innerText();
    const dialog = await openFromCard(page);
    await dialog.getByRole('button', { name: 'Back to Hub' }).click();
    const home = page.getByTestId('home-screen');
    await expect(home).toHaveAttribute('data-browser-returning', 'true');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(home).toHaveAttribute('data-browser-returning', 'false');
    await expect(page.locator('.home-reveal-return')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reset view' })).toHaveText(initialZoom);
  });

  test('Escape during return snaps home and permits another opening', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'touch-edge', 'Keyboard return cancellation is covered on desktop.');
    const initialZoom = await page.getByRole('button', { name: 'Reset view' }).innerText();
    const dialog = await openFromCard(page);
    await dialog.getByRole('button', { name: 'Back to Hub' }).click();
    const home = page.getByTestId('home-screen');
    await expect(home).toHaveAttribute('data-browser-returning', 'true');
    await page.keyboard.press('Escape');
    await expect(home).toHaveAttribute('data-browser-returning', 'false');
    await expect(page.getByRole('button', { name: 'Reset view' })).toHaveText(initialZoom);
    await expect(page.getByRole('button', { name: 'Inspect Towers' })).toBeFocused();
    await openFromCard(page);
  });

  test('Escape cancels entry and allows another clean opening', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'touch-edge', 'Keyboard cancellation is covered on desktop.');
    const initialZoom = await page.getByRole('button', { name: 'Reset view' }).innerText();
    await page.getByRole('button', { name: 'Inspect Towers' }).click();
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-browser-entering', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-browser-entering', 'false');
    await expect(page.locator('dialog.codex-dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset view' })).toHaveText(initialZoom);
    await openFromCard(page);
  });

  test('enabling reduced motion during entry finishes cleanly', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'touch-edge', 'The mid-entry setting change is covered on desktop.');
    const initialZoom = await page.getByRole('button', { name: 'Reset view' }).innerText();
    await page.getByRole('button', { name: 'Inspect Towers' }).click();
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-browser-entering', 'true');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const dialog = page.locator('dialog.codex-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-browser-entering', 'false');
    await dialog.getByRole('button', { name: 'Back to Hub' }).click();
    await expect(page.getByRole('button', { name: 'Reset view' })).toHaveText(initialZoom);
  });

  test('dragging the actual Lab pans while a stationary click opens the browser', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'touch-edge', 'The real canvas hover path uses a mouse.');
    const errors: string[] = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const canvas = page.getByTestId('campus-canvas');
    const bounds = await canvas.boundingBox();
    if (!bounds) throw new Error('The campus canvas has no visible bounds.');
    const hint = page.locator('.home-building-hint');
    let hit: { x: number; y: number } | null = null;
    for (const [x, y] of [[.496, .457], [.5, .43], [.48, .46]] as const) {
      const point = { x: bounds.x + bounds.width * x, y: bounds.y + bounds.height * y };
      await page.mouse.move(point.x, point.y);
      if (await hint.isVisible()) { hit = point; break; }
    }
    if (!hit) throw new Error('The visible Copilot Lab could not be hovered in the canvas.');
    await expect(hint).toHaveText('Inspect Towers');
    await page.mouse.click(hit.x, hit.y);
    const dialog = page.locator('dialog.codex-dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Back to Hub' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-browser-returning', 'false');
    await page.mouse.move(hit.x, hit.y);
    await page.mouse.down();
    await page.mouse.move(hit.x + 8, hit.y + 8, { steps: 3 });
    await page.mouse.up();
    await expect(dialog).not.toBeVisible();
    expect(errors).toEqual([]);
  });

  test('delivered Analyst and Architect load with qualitative stats', async ({ page }, testInfo) => {
    const dialog = await openFromCard(page);
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await expect(dialog.getByRole('group', { name: 'Animation selection' })).toHaveCount(0);
    await expect(dialog.locator('.codex-stats button, .codex-stats .octicon-info')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Tester', exact: true }).click();
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await expect(dialog.getByRole('heading', { name: 'Model preview coming soon' })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Tester', exact: true })).toHaveAttribute('data-preview', 'available');
    await expect(dialog.getByRole('button', { name: 'Tester', exact: true }).locator('img')).toBeVisible();
    await expect(dialog.locator('.codex-stats')).toContainText('QA Aura');
    await dialog.getByRole('button', { name: 'Analyst', exact: true }).click();
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-animation', 'rest');
    await expect(dialog.getByRole('heading', { name: 'Model preview coming soon' })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Analyst', exact: true })).toHaveAttribute('data-preview', 'available');
    await expect(dialog.getByRole('button', { name: 'Analyst', exact: true }).locator('img')).toBeVisible();
    await expect(dialog.locator('.codex-stats')).toContainText('PASSIVE SUPPORT');
    const labels = await dialog.locator('.codex-stats .codex-gauge-label').allTextContents();
    expect(labels.join(' ')).not.toMatch(/Damage|Work/);
    expect(await dialog.locator('.codex-stats').innerText()).not.toMatch(/\d/);
    await page.screenshot({ path: testInfo.outputPath('analyst-inspector.png'), fullPage: true });
    await dialog.getByRole('button', { name: 'Architect', exact: true }).click();
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await expect(page.getByTestId('tower-showcase')).toHaveAttribute('data-animation', 'rest');
    await expect(dialog.getByRole('heading', { name: 'Model preview coming soon' })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Architect', exact: true })).toHaveAttribute('data-preview', 'available');
    await expect(dialog.getByRole('button', { name: 'Architect', exact: true }).locator('img')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('architect-inspector.png'), fullPage: true });
  });

  test('phone layout keeps stats visible without animation tabs', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'touch-edge', 'Phone detail layout.');
    const dialog = await openFromCard(page);
    await expect(dialog.locator('.codex-stats')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Animations', exact: true })).toHaveCount(0);
    await expect(dialog.getByRole('group', { name: 'Tower details' })).toHaveCount(0);
  });

  test('reduced motion starts at Rest and changes Towers without automatic clips', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const dialog = await openFromCard(page);
    const showcase = page.getByTestId('tower-showcase');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-browser-entering', 'false');
    await expect(page.locator('.home-reveal')).toHaveCount(0);
    await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await expect(showcase).toHaveAttribute('data-animation', 'rest');
    await dialog.getByRole('button', { name: 'Security', exact: true }).click();
    await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await expect(showcase).toHaveAttribute('data-animation', 'rest');
  });
});
