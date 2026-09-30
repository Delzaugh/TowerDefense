import { expect, test } from '@playwright/test';

async function appearance(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  return page.getByRole('combobox', { name: 'Appearance', exact: true });
}

test('appearance persists and system responds to operating system changes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const picker = await appearance(page);
  await expect(picker).toHaveValue('light');
  await picker.selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const restoredPicker = await appearance(page);
  await expect(restoredPicker).toHaveValue('dark');
  await restoredPicker.selectOption('system');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('appearance survives blocked storage and remains usable for the visit', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.goto('/');
  const picker = await appearance(page);
  await picker.selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('dialog', { name: 'Campus settings' }).getByRole('status').filter({ hasText: 'Appearance will apply for this visit.' })).toBeVisible();
  await picker.selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('appearance changes synchronize across open tabs', async ({ page, context }) => {
  await page.goto('/');
  const other = await context.newPage();
  await other.goto('/');
  const picker = await appearance(page);
  await picker.selectOption('light');
  await expect(other.locator('html')).toHaveAttribute('data-theme', 'light');
  const otherPicker = await appearance(other);
  await expect(otherPicker).toHaveValue('light');
  await otherPicker.selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(picker).toHaveValue('dark');
});
