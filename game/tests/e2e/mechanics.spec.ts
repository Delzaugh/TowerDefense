import { placeTower, openQueue, closeQueue } from './mapActions';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function screenPoint(page: Page, x: number, z: number) {
  const map = page.locator('.tower-map'); await map.scrollIntoViewIfNeeded();
  return map.evaluate((svg: SVGSVGElement, point) => {
    const transformed = new DOMPoint(point.x, point.z).matrixTransform(svg.getScreenCTM()!);
    return { x: transformed.x, y: transformed.y };
  }, { x, z });
}

test('selected settings and drag aiming affect one tower, with preview, cancellation and phase locks', async ({ page, isMobile }, testInfo) => {
  await page.goto('/'); await page.getByLabel('Advance automatically').uncheck();
  const first = await screenPoint(page, -5, 0);
  if (isMobile) await page.touchscreen.tap(first.x, first.y); else await page.mouse.click(first.x, first.y);
  await page.getByLabel('Tower coverage', { exact: true }).selectOption('cone');
  await page.getByLabel('Tower mode', { exact: true }).selectOption('defend');
  await page.getByLabel('Tower priority', { exact: true }).selectOption('first_spawned');
  await expect(page.getByTestId('compute')).toHaveText('270');
  const start = await screenPoint(page, -3.4, 0), end = await screenPoint(page, -5, 3);
  const cdp = isMobile ? await page.context().newCDPSession(page) : null;
  if (cdp) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [end] });
  } else { await page.mouse.move(start.x, start.y); await page.mouse.down(); await page.mouse.move(end.x, end.y, { steps: 6 }); }
  await expect(page.getByTestId('aim-direction')).toContainText('90° preview');
  await expect(page.getByTestId('selected-tower')).toContainText('Facing 0°');
  if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); else await page.mouse.up();
  await expect(page.getByTestId('selected-tower')).toContainText('Facing 90°');
  await expect(page.getByTestId('placed-tower')).toHaveCount(1);
  // A second gesture cancels without affecting the authoritative angle.
  const from = await screenPoint(page, -5, 1.6), to = await screenPoint(page, -8, 0);
  if (cdp) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [to] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  } else { await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(to.x, to.y, { steps: 4 }); await page.keyboard.press('Escape'); await page.mouse.up(); }
  await expect(page.getByTestId('selected-tower')).toContainText('Facing 90°');
  const body = await screenPoint(page, -5, 0), left = await screenPoint(page, -8, 0);
  if (cdp) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [body] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [left] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else { await page.mouse.move(body.x, body.y); await page.mouse.down(); await page.mouse.move(left.x, left.y, { steps: 4 }); await page.mouse.up(); }
  await expect(page.getByTestId('selected-tower')).toContainText('Facing 180°');
  await expect(page.getByTestId('placed-tower')).toHaveCount(1);
  await page.getByLabel('Selected tower facing').fill('359.9'); await page.getByRole('button', { name: 'Apply angle', exact: true }).click();
  await page.getByLabel('Tower coverage', { exact: true }).selectOption('area');
  await expect(page.getByTestId('aim-handle')).toHaveCount(0);
  await page.getByLabel('Tower coverage', { exact: true }).selectOption('cone');
  await expect(page.getByTestId('selected-tower')).toContainText('Facing 359.9°');
  await placeTower(page, 4, 0);
  await expect(page.getByLabel('Tower coverage', { exact: true })).toHaveValue('area');
  await expect(page.getByLabel('Tower mode', { exact: true })).toHaveValue('auto');
  await page.getByRole('button', { name: 'Tower 1', exact: true }).click();
  await expect(page.getByLabel('Tower mode', { exact: true })).toHaveValue('defend');
  await page.screenshot({ path: testInfo.outputPath('tower-mechanics.png'), fullPage: true });
  await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  await expect(page.getByLabel('Tower coverage', { exact: true })).toBeDisabled();
  await expect(page.getByLabel('Selected tower facing')).toBeDisabled();
  await expect(page.getByLabel('Tower priority', { exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Pause encounter', exact: true }).click();
  await expect(page.getByLabel('Tower mode', { exact: true })).toBeDisabled();
  await cdp?.detach();
});

test('queue edits stay drafts, apply with the defense, save custom content and repeat cleanly', async ({ page }, testInfo) => {
  await page.goto('/'); await placeTower(page);
  await openQueue(page);
  await page.getByLabel('Queue preset').selectOption('work');
  await page.getByLabel('Row 1 count', { exact: true }).fill('2');
  await expect(page.getByTestId('queue-dirty')).toHaveText('Unapplied draft');
  await page.getByRole('button', { name: 'Apply queue & prepare', exact: true }).click();
  await expect(page.getByTestId('compute')).toHaveText('270');
  await expect(page.getByTestId('placed-tower')).toHaveCount(1);
  await expect(page.getByTestId('queue-dirty')).toHaveText('Matches applied queue');
  await closeQueue(page);
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved locally');
  await page.reload(); await page.getByRole('button', { name: 'Load save', exact: true }).click();
  await openQueue(page);
  await expect(page.getByLabel('Row 1 count', { exact: true })).toHaveValue('2');
  await expect(page.getByRole('region', { name: 'Queue row 2', exact: true })).toHaveCount(0);
  await closeQueue(page);
  await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  await openQueue(page);
  await page.getByLabel('Row 1 count', { exact: true }).fill('9');
  await expect(page.getByRole('button', { name: 'Apply queue & prepare', exact: true })).toBeDisabled();
  await expect(page.getByText('Applied queue · 0 / 2 spawned', { exact: true })).toBeVisible();
  await closeQueue(page);
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Step 60 ticks', exact: true }).click();
  await expect(page.getByTestId('encounter-phase')).toHaveText('Wave drained');
  await expect(page.getByTestId('compute')).toHaveText('294');
  await page.getByRole('button', { name: 'Prepare same run again', exact: true }).click();
  await expect(page.getByTestId('compute')).toHaveText('270');
  await expect(page.getByTestId('encounter-tick')).toHaveText('0');
  await openQueue(page);
  await expect(page.getByLabel('Row 1 count', { exact: true })).toHaveValue('9');
  await page.getByLabel('Row 1 count', { exact: true }).fill('0');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apply queue & prepare', exact: true })).toBeDisabled();
  await page.getByLabel('Row 1 count', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Duplicate row 1', exact: true }).click();
  await page.getByLabel('Row 2 type', { exact: true }).selectOption('bug');
  await page.getByRole('button', { name: 'Move row 2 up', exact: true }).click();
  await expect(page.getByLabel('Row 1 type', { exact: true })).toHaveValue('bug');
  await page.getByRole('button', { name: 'Remove row 2', exact: true }).click();
  await page.getByRole('button', { name: 'Apply queue & prepare', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('wave-editor.png'), fullPage: true });
});

test('recipe JSON and health presets preserve applied queue and explicitly discard dirty drafts', async ({ page }) => {
  await page.goto('/');
  await openQueue(page);
  await page.getByLabel('Queue preset').selectOption('burst');
  await page.getByText('Import / export recipe JSON', { exact: true }).click();
  await page.getByRole('button', { name: 'Export recipe', exact: true }).click();
  const json = await page.getByLabel('Recipe JSON', { exact: true }).inputValue();
  await page.getByLabel('Recipe JSON', { exact: true }).fill('{invalid');
  await page.getByRole('button', { name: 'Import recipe', exact: true }).click();
  await expect(page.getByTestId('queue-summary')).toContainText('5 spawns');
  await page.getByLabel('Recipe JSON', { exact: true }).fill(json);
  await page.getByRole('button', { name: 'Import recipe', exact: true }).click();
  await page.getByRole('button', { name: 'Apply queue & prepare', exact: true }).click();
  await closeQueue(page);
  await page.getByLabel('Product preset').selectOption('fragile');
  await expect(page.getByTestId('product-health')).toHaveText('20 / 20');
  await openQueue(page);
  await expect(page.getByLabel('Row 1 count', { exact: true })).toHaveValue('5');
  await expect(page.getByLabel('Row 1 interval', { exact: true })).toHaveValue('0');
  await page.getByLabel('Row 1 count', { exact: true }).fill('2');
  await closeQueue(page);
  page.once('dialog', dialog => dialog.dismiss()); await page.getByLabel('Product preset').selectOption('standard');
  await expect(page.getByLabel('Product preset')).toHaveValue('fragile');
  await openQueue(page);
  await expect(page.getByLabel('Row 1 count', { exact: true })).toHaveValue('2');
  await closeQueue(page);
  page.once('dialog', dialog => dialog.accept()); await page.getByLabel('Product preset').selectOption('standard');
  await expect(page.getByLabel('Product preset')).toHaveValue('standard');
  await openQueue(page);
  await expect(page.getByLabel('Row 1 count', { exact: true })).toHaveValue('5');
});
