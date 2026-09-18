import { expect, test } from '@playwright/test';
import { tapMap } from './mapActions';

test('QA upgrades, external effects, rewards, local saves and repeat work in the test map', async ({ page, isMobile }, testInfo) => {
  await page.goto('/'); await page.getByLabel('Advance automatically').uncheck();
  await page.getByLabel('Tower type', { exact: true }).selectOption('tester_probe');
  await tapMap(page, -5, 0, isMobile); await page.getByRole('button', { name: 'Tower 1', exact: true }).click();
  await expect(page.getByTestId('qa-aura')).toContainText('Enemies 10% slower');
  await page.getByLabel('Tower mode').selectOption('build');
  await page.getByRole('button', { name: 'QA enhancement (test) · 20 Compute', exact: true }).click();
  await expect(page.getByTestId('qa-aura')).toContainText('Enemies 15% slower · +3 Compute');
  await page.getByText('External effect testing', { exact: true }).click();
  await page.getByRole('button', { name: 'Test QA boost (+5%, 5s)', exact: true }).click();
  await expect(page.getByTestId('qa-aura')).toContainText('Enemies 20% slower');
  await page.getByRole('button', { name: 'Save locally', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Saved locally');
  await page.reload(); await page.getByRole('button', { name: 'Load save', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Loaded local save');
  await page.getByRole('button', { name: 'Tower 1', exact: true }).click();
  await expect(page.getByLabel('Tower mode')).toHaveValue('build'); await expect(page.getByTestId('qa-aura')).toContainText('Enemies 20% slower');
  await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  await page.getByRole('button', { name: 'Step 60 ticks', exact: true }).click(); await page.getByRole('button', { name: 'Step 60 ticks', exact: true }).click();
  await expect(page.getByTestId('product-progress')).toHaveText('1'); await expect(page.getByTestId('compute')).toHaveText('265');
  await page.getByRole('button', { name: 'Pause encounter', exact: true }).click();
  await expect(page.getByLabel('Tower mode')).toBeDisabled();
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Prepare same run again', exact: true }).click();
  await page.getByRole('button', { name: 'Tower 1', exact: true }).click();
  await expect(page.getByTestId('qa-aura')).toContainText('Enemies 15% slower'); await expect(page.getByTestId('active-effect')).toHaveCount(0);
  await expect(page.getByTestId('compute')).toHaveText('250');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('qa-aura.png'), fullPage: true });
});

test('passive Towers expose only applicable controls and do not perform a main action', async ({ page, isMobile }) => {
  await page.goto('/'); await page.getByLabel('Advance automatically').uncheck();
  await page.getByLabel('Tower type', { exact: true }).selectOption('support_probe'); await tapMap(page, -5, 0, isMobile);
  await page.getByRole('button', { name: 'Tower 1', exact: true }).click();
  await expect(page.getByTestId('qa-aura')).toContainText('Enemies 10% slower');
  await expect(page.getByLabel('Tower mode')).toHaveCount(0); await expect(page.getByLabel('Tower priority')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start encounter', exact: true }).click(); await page.getByRole('button', { name: 'Step 60 ticks', exact: true }).click();
  await expect(page.getByTestId('product-progress')).toHaveText('0'); await expect(page.getByTestId('compute')).toHaveText('270');
});
