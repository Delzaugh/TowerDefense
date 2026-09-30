import { expect, test } from '@playwright/test';

test('excluded build has no stress route, settings link, chunk or exclusive assets', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('link', { name: /Open stress test map/ })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: /Performance tracking/ })).toBeVisible();
  const response = await request.get('/performance-build.json'); expect(response.ok()).toBe(true);
  const build = await response.json() as { files: { path: string }[] };
  expect(build.files.some(file => /StressScreen|problem_lag_spike|problem_vague_spec|problem_dead_code|work_coding_task/.test(file.path))).toBe(false);
  await page.goto('/#/stress');
  await expect(page.getByRole('heading', { name: 'This place isn’t on the map.' })).toBeVisible();
  await expect(page.getByTestId('stress-screen')).toHaveCount(0);
});
