import { expect, test } from '@playwright/test';
import { openDiagnostics, placeTower, tapMap } from './mapActions';

test('map clicks place towers immediately and keep placement ready until selecting a tower', async ({ page, isMobile }) => {
  await page.goto('/?lab=encounter');
  await tapMap(page, -5, 0, isMobile); await tapMap(page, 4, 0, isMobile);
  await expect(page.getByTestId('placed-tower')).toHaveCount(2); await expect(page.getByTestId('compute')).toHaveText('240');
  await tapMap(page, -6, 2, isMobile); await expect(page.getByRole('status')).toContainText('Rejected: path_blocked');
  await expect(page.getByTestId('placed-tower')).toHaveCount(2); await expect(page.getByTestId('compute')).toHaveText('240');
  await tapMap(page, -1.5, 0, isMobile); await expect(page.getByRole('status')).toContainText('Rejected: blocked');
  await tapMap(page, -5, 0, isMobile); await expect(page.getByTestId('selected-tower')).toContainText('Selected tower 1');
  await tapMap(page, 7, 0, isMobile); await expect(page.getByTestId('placed-tower')).toHaveCount(2);
  await page.getByRole('button', { name: 'Place on map', exact: true }).click(); await tapMap(page, 7, 0, isMobile);
  await expect(page.getByTestId('placed-tower')).toHaveCount(3); await expect(page.getByTestId('compute')).toHaveText('210');
  await page.getByLabel('Advance automatically').uncheck(); await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  await page.getByRole('button', { name: 'Pause encounter', exact: true }).click(); await tapMap(page, -8, 0, isMobile);
  await expect(page.getByTestId('placed-tower')).toHaveCount(3);
});

test('place, inspect partial work, restore, and finish a defended encounter', async ({ page }, testInfo) => {
  await page.goto('/'); await page.getByLabel('Advance automatically').uncheck(); await placeTower(page);
  await page.getByRole('button', { name: 'Tower 1', exact: true }).click();
  await expect(page.getByTestId('compute')).toHaveText('270');
  await page.getByLabel('Tower mode').selectOption('build'); await page.getByLabel('Tower priority').selectOption('first_spawned'); await page.getByLabel('Tower mode').selectOption('auto');
  await page.getByRole('button', { name: 'Start encounter', exact: true }).click(); await page.getByRole('button', { name: 'Step 1 tick', exact: true }).click();
  await openDiagnostics(page); await expect(page.locator('.live-targets')).toContainText('remaining 5');
  await expect(page.getByTestId('selected-tower')).toContainText('cooldown 30 ticks');
  await page.getByRole('button', { name: 'Capture state', exact: true }).click(); await page.getByRole('button', { name: 'Step 60 ticks', exact: true }).click();
  await expect(page.getByTestId('product-progress')).toHaveText('1'); await page.getByRole('button', { name: 'Restore capture', exact: true }).click();
  await expect(page.getByTestId('encounter-tick')).toHaveText('1'); await page.getByRole('button', { name: 'Tower 1', exact: true }).click();
  await page.getByRole('button', { name: 'Pause encounter', exact: true }).click(); await expect(page.getByLabel('Tower mode')).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath('tower-lab.png'), fullPage: true });
  await page.getByRole('button', { name: 'Resume encounter', exact: true }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Step 60 ticks', exact: true }).click();
  await expect(page.getByTestId('encounter-phase')).toHaveText('Wave drained'); await expect(page.getByTestId('product-health')).toHaveText('100 / 100');
  await expect(page.getByTestId('compute')).toHaveText('304'); await expect(page.getByTestId('debt')).toHaveText('0');
  await expect(page.getByTestId('product-progress')).toHaveText('2'); await page.getByRole('button', { name: 'Reset encounter', exact: true }).click();
  await expect(page.getByTestId('placed-tower')).toHaveCount(0);
});

test('blocker feedback, cone rotation and map placement work with mouse and touch', async ({ page, isMobile }, testInfo) => {
  await page.goto('/?lab=encounter&fixture=blocker'); await tapMap(page, -1.5, 0, isMobile);
  await expect(page.getByRole('status')).toContainText('Rejected: blocked'); await expect(page.getByTestId('compute')).toHaveText('300');
  await tapMap(page, -4, 0, isMobile); await page.getByLabel('Tower coverage').selectOption('cone');
  await page.getByRole('button', { name: 'Rotate 90°', exact: true }).click(); await expect(page.getByTestId('selected-tower')).toContainText('Facing 90°');
  await page.getByRole('button', { name: 'Place on map', exact: true }).click(); await tapMap(page, 4, 0, isMobile);
  await expect(page.getByTestId('placed-tower')).toHaveCount(2); await expect(page.getByTestId('compute')).toHaveText('240');
  await page.getByRole('button', { name: 'Tower 1', exact: true }).click(); await expect(page.getByTestId('selected-tower')).toContainText('Facing 90°');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('blocker-lab.png'), fullPage: true });
});
