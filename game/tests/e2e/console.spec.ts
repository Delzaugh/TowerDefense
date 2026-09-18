import { placeTower, openDiagnostics } from './mapActions';
import { expect, test } from '@playwright/test';

test('manual start, hard pause and resume', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByTestId('encounter-phase')).toHaveText('Preparation');
  await expect(page.getByTestId('encounter-tick')).toHaveText('0');
  await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  await expect(page.getByTestId('encounter-tick')).not.toHaveText('0');
  await page.getByRole('button', { name: 'Pause encounter', exact: true }).click();
  await expect(page.getByTestId('encounter-phase')).toHaveText('Paused');
  const tick = await page.getByTestId('encounter-tick').textContent();
  // Deliberate observation window: proves the frozen clock does not advance.
  await page.waitForTimeout(250);
  await expect(page.getByTestId('encounter-tick')).toHaveText(tick!);
  await openDiagnostics(page);
  await expect(page.getByRole('button', { name: 'Place left' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save locally' })).toBeDisabled();
  await page.getByRole('button', { name: 'Resume encounter' }).click();
  await expect(page.getByTestId('encounter-tick')).not.toHaveText(tick!);
  expect(errors).toEqual([]);
});

test('local save restores after page reload', async ({ page }) => {
  await page.goto('/');
  await placeTower(page);
  await openDiagnostics(page); await page.getByRole('button', { name: 'Place left' }).click();
  await page.getByRole('button', { name: '2× speed' }).click();
  await page.getByRole('button', { name: 'Save locally' }).click();
  await expect(page.getByRole('status')).toContainText('Saved locally');
  await page.reload();
  await page.getByRole('button', { name: 'Load save' }).click();
  await expect(page.getByRole('status')).toContainText('Loaded local save');
  await expect(page.getByRole('button', { name: '2× speed' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('encounter-tick')).toHaveText('0');
  await expect(page.getByTestId('placed-tower')).toHaveCount(1);
  await expect(page.getByTestId('compute')).toHaveText('270');
  await expect(page.getByTestId('sight-marker')).toHaveCount(1);
  await expect(page.getByText('Clear sight', { exact: true })).toBeVisible();
});

test('rejects blocked pointer placement and supports touch-sized layout', async ({ page, isMobile }, testInfo) => {
  await page.goto('/');
  await openDiagnostics(page); await page.getByRole('button', { name: 'Place marker on map', exact: true }).click();
  const map = page.getByRole('img');
  await map.scrollIntoViewIfNeeded();
  const point = await map.evaluate(element => {
    const svg = element as SVGSVGElement;
    const position = new DOMPoint(-1.5, 0).matrixTransform(svg.getScreenCTM()!);
    return { x: position.x, y: position.y };
  });
  if (isMobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
  await expect(page.getByRole('status')).toContainText('Rejected: blocked');
  const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(size.scroll).toBeLessThanOrEqual(size.width);
  await page.screenshot({ path: testInfo.outputPath('console.png'), fullPage: true });
});

test('stale save from another tab does not overwrite newer data', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Save locally' }).click();
  await expect(page.getByRole('status')).toContainText('revision 1');
  const second = await context.newPage();
  await second.goto('/');
  await second.getByRole('button', { name: 'Load save' }).click();
  await expect(second.getByRole('status')).toContainText('revision 1');
  await openDiagnostics(page); await page.getByRole('button', { name: 'Place right' }).click();
  await page.getByRole('button', { name: 'Save locally' }).click();
  await expect(page.getByRole('status')).toContainText('revision 2');
  await second.getByRole('button', { name: 'Save locally' }).click();
  await expect(second.getByRole('status')).toContainText('changed in another session');
});
