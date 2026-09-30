import { expect, test } from '@playwright/test';

test('tracking inventory and the stress map work under a static-host subdirectory', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = page.getByRole('dialog', { name: 'Campus settings' });
  const inventory = page.waitForResponse(response => response.url().endsWith('/performance-build.json'));
  await settings.getByRole('checkbox', { name: /Performance tracking/ }).check();
  const response = await inventory;
  expect(response.ok()).toBe(true);
  expect(response.url()).toBe(new URL('performance-build.json', baseURL!).href);
  expect((await response.json() as { release: string }).release).toMatch(/^[0-9a-f]{16}$/);
  await settings.getByRole('link', { name: /Open stress test map/ }).click();
  await expect(page).toHaveURL(new URL('#/stress', baseURL!).href);
  await expect(page.getByTestId('stress-screen')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => window.__TOWER_PERFORMANCE__!.snapshot().streams.find(stream => stream.name === 'stress-map')?.triangles?.p95 ?? 0)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
