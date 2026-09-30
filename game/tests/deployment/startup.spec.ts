import { expect, test } from '@playwright/test';

test('the subpath build opens home, preserves route navigation and fits landscape', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Meet your Copilots.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('home-landscape-subpath.png'), fullPage: true });
  await page.evaluate(() => { location.hash = '/lab'; });
  await expect(page.getByRole('button', { name: 'Start encounter', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Campus home', exact: true }).click();
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready');
  expect(new URL(page.url()).pathname).toBe('/TowerDefense/');
  expect(errors).toEqual([]);
});

test('the Tower workbench loads its models under the deployment subpath and fits landscape', async ({ page }, info) => {
  const errors: string[] = [];
  const models: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (new URL(request.url()).pathname.endsWith('.glb')) models.push(new URL(request.url()).pathname); });
  await page.goto('./');
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Inspect Towers', exact: true }).click();
  const workbench = page.getByTestId('tower-showcase');
  await expect(workbench).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Security', exact: true }).click();
  await expect(workbench).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  await expect(workbench).toHaveAttribute('data-animation', 'idle');
  await expect(page.locator('.codex-stats')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Animation selection' })).toHaveCount(0);
  expect(models.some(path => path.startsWith('/TowerDefense/assets/runtime/environment/showcase_workbench_v01.'))).toBe(true);
  expect(models.every(path => path.startsWith('/TowerDefense/'))).toBe(true);
  const back = page.getByRole('button', { name: 'Back to Hub', exact: true });
  await expect(back).toBeInViewport();
  expect(await workbench.evaluate(element => element.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('tower-workbench-landscape-subpath.png'), fullPage: true });
  await back.click();
  await expect(page.getByRole('button', { name: 'Inspect Towers', exact: true })).toBeFocused();
  expect(errors).toEqual([]);
});

test('failed initial JavaScript download leaves a working reload action', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  let failed = false;
  await page.route('**/assets/index-*.js', async route => {
    if (!failed) { failed = true; await route.abort(); } else await route.continue();
  });
  await page.goto('./');
  await expect(page.locator('#startup-recovery')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(246, 248, 250)');
  await page.getByRole('button', { name: 'Reload app' }).click();
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
});

test('startup respects a saved dark preference before the app downloads', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tower.ui.appearance.v1', 'dark'));
  await page.route('**/assets/index-*.js', route => route.abort());
  await page.goto('./');
  await expect(page.locator('#startup-recovery')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(13, 17, 23)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0d1117');
});

test('failed renderer chunk offers reload and recovers with a new document', async ({ page }) => {
  let failed = false;
  await page.route('**/assets/createCampusScene-*.js', async route => {
    if (!failed) { failed = true; await route.abort(); } else await route.continue();
  });
  await page.goto('./');
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'error');
  await page.getByRole('button', { name: 'Reload app' }).click();
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
});
