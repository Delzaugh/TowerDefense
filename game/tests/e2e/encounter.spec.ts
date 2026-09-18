import { expect, test } from '@playwright/test';

test('manual dual flow, snapshot restore and reset through the lab', async ({ page }) => {
  await page.goto('/?lab=encounter');
  await page.getByLabel('Advance automatically').uncheck();
  await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  await page.getByRole('button', { name: 'Step 60 ticks', exact: true }).click();
  await expect(page.getByTestId('encounter-tick')).toHaveText('60');
  await expect(page.getByTestId('traffic-entity')).toHaveCount(1);
  await page.getByRole('button', { name: 'Capture state', exact: true }).click();
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'Step 60 ticks', exact: true }).click();
  await expect(page.getByTestId('encounter-phase')).toHaveText('Wave drained');
  await expect(page.getByTestId('product-health')).toHaveText('70 / 100');
  await expect(page.getByTestId('debt')).toHaveText('2');
  await expect(page.getByTestId('compute')).toHaveText('300');
  await page.getByRole('button', { name: 'Restore capture', exact: true }).click();
  await expect(page.getByTestId('encounter-tick')).toHaveText('60');
  await expect(page.getByTestId('product-health')).toHaveText('100 / 100');
  await expect(page.getByTestId('debt')).toHaveText('0');
  await expect(page.locator('.event-log li')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset encounter', exact: true }).click();
  await expect(page.getByTestId('encounter-phase')).toHaveText('Preparation');
  await expect(page.getByRole('button', { name: 'Restore capture', exact: true })).toBeDisabled();
});

test('hard pause disables manual steps and speed, failure is terminal', async ({ page }) => {
  await page.goto('/?lab=encounter&fixture=fragile');
  await page.getByLabel('Advance automatically').uncheck();
  await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  await page.getByRole('button', { name: 'Pause encounter', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Step 1 tick', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '2× speed', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Resume encounter', exact: true }).click();
  for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Step 60 ticks', exact: true }).click();
  await expect(page.getByTestId('encounter-phase')).toHaveText('Product destroyed');
  await expect(page.getByTestId('product-health')).toHaveText('0 / 20');
  await expect(page.getByRole('button', { name: 'Step 60 ticks', exact: true })).toBeDisabled();
  await expect(page.getByTestId('encounter-tick')).toHaveText('480');
});

test('automatic clock runs and lab stays usable in narrow layouts', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Edit wave queue/ })).toBeVisible();
  await expect(page.getByRole('img')).toHaveCount(1);
  await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('encounter-tick').innerText())).toBeGreaterThan(5);
  await page.getByRole('button', { name: 'Pause encounter', exact: true }).click();
  const tick = await page.getByTestId('encounter-tick').innerText();
  await page.getByRole('button', { name: 'Capture state', exact: true }).click();
  await expect(page.getByTestId('encounter-tick')).toHaveText(tick);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('encounter.png'), fullPage: true });
  await page.goto('/?lab=foundation');
  await expect(page.getByRole('button', { name: 'Start encounter', exact: true })).toBeVisible();
  await expect(page.getByRole('img')).toHaveCount(1);
});
