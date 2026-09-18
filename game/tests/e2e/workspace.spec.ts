import { expect, test } from '@playwright/test';
import { closeQueue, openQueue, tapMap } from './mapActions';

test('map-first workspace places ten towers, enforces the cap and restores them', async ({ page, isMobile }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'New tower defaults' })).toHaveCount(0);
  await expect(page.getByLabel('Tower definition')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Queue preset')).not.toBeVisible();
  const before = await page.locator('.tower-map').boundingBox();
  if (!isMobile) {
    const viewport = page.viewportSize()!;
    expect(before!.width).toBeGreaterThan(viewport.width * .65);
    expect(before!.height).toBeGreaterThan(viewport.height * .5);
    expect(before!.y).toBeLessThan(160);
  }
  for (const z of [-4, 4]) for (const x of [-8, -4, 0, 4, 8]) await tapMap(page, x, z, isMobile);
  await expect(page.getByTestId('placed-tower')).toHaveCount(10);
  await expect(page.getByTestId('tower-count')).toHaveText('10 / 10 towers');
  await expect(page.getByTestId('compute')).toHaveText('0');
  await tapMap(page, 0, 0, isMobile);
  await expect(page.getByRole('status')).toContainText('Rejected: tower_limit');
  await expect(page.getByTestId('placed-tower')).toHaveCount(10);
  await page.getByRole('button', { name: 'Tower 10', exact: true }).click();
  await page.getByLabel('Tower coverage').selectOption('cone');
  await expect(page.getByTestId('selected-tower')).toContainText('Selected tower 10');
  if (!isMobile) {
    const after = await page.locator('.tower-map').boundingBox();
    expect(after!.height).toBeGreaterThan(before!.height - 50);
  }
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved locally');
  await page.reload(); await page.getByRole('button', { name: 'Load save', exact: true }).click();
  await expect(page.getByTestId('placed-tower')).toHaveCount(10);
  await page.getByRole('button', { name: 'Tower 10', exact: true }).click();
  await expect(page.getByLabel('Tower coverage')).toHaveValue('cone');
  if (!isMobile) await expect(page.getByTestId('selected-tower')).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('workspace.png'), fullPage: true });
});

test('wave dialog retains drafts, traps focus, closes with Escape and keyboard placement remains available', async ({ page }, testInfo) => {
  await page.goto('/');
  const map = page.locator('.tower-map'); await map.focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter');
  await expect(page.getByTestId('placed-tower')).toHaveCount(1);
  await expect(page.getByTestId('compute')).toHaveText('270');
  await openQueue(page); const dialog = page.getByRole('dialog', { name: 'Wave queue settings' });
  await expect(dialog).toBeVisible(); await expect(page.getByRole('button', { name: 'Close wave queue' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.getByLabel('Queue preset').selectOption('burst'); await page.getByLabel('Row 1 count').fill('7');
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: /^Edit wave queue/ })).toBeFocused();
  await openQueue(page); await expect(page.getByLabel('Row 1 count')).toHaveValue('7');
  await expect(page.getByTestId('queue-dirty')).toHaveText('Unapplied draft');
  await page.getByRole('button', { name: 'Apply queue & prepare', exact: true }).click();
  await expect(page.getByTestId('queue-dirty')).toHaveText('Matches applied queue');
  await page.screenshot({ path: testInfo.outputPath('wave-dialog.png'), fullPage: true });
  await closeQueue(page); await expect(page.getByTestId('placed-tower')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
