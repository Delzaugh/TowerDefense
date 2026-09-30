import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function openStory(page: Page, id: string, theme = 'light', motion = 'system') {
  const query = new URLSearchParams({ id, viewMode: 'story', globals: `theme:${theme};motion:${motion}` });
  await page.goto(`/iframe.html?${query}`);
  await expect(page.locator('.workshop')).toBeVisible();
}

const stories = ['overview--field-kit', 'buttons--states', 'forms--states', 'selection--interactive', 'feedback--capabilities', 'gametopbar--inspection', 'gametopbar--world', 'atmosphere--page'];
for (const theme of ['light', 'dark']) {
  for (const story of stories) {
    test(`${story}: ${theme} accessibility and responsive layout`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await openStory(page, `field-kit-${story}`, theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      for (const [width, height] of [[320, 568], [844, 390], [1600, 1000]] as const) {
        await page.setViewportSize({ width, height });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        const shortControls = await page.locator('.ui-button, .ui-segments button, .ui-input, .workshop-check').evaluateAll(elements => elements.filter(element => element.getBoundingClientRect().height < 44).length);
        expect(shortControls).toBe(0);
        if (width !== 844) {
          const results = await new AxeBuilder({ page }).include('.workshop').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
          expect(results.violations).toEqual([]);
        }
      }
      if (story === 'buttons--states') {
        for (const name of ['Abandon run', 'Deploy', 'Inspect towers']) {
          const button = page.getByRole('button', { name, exact: true }).first();
          await button.hover();
          const results = await new AxeBuilder({ page }).include('.workshop').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
          expect(results.violations).toEqual([]);
        }
      }
      expect(errors).toEqual([]);
    });
  }
}

test('buttons and choices respond to the keyboard and preserve disabled states', async ({ page }) => {
  await openStory(page, 'field-kit-buttons--states');
  const toggle = page.getByRole('button', { name: 'Auto preview' });
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toHaveText('Auto preview on');
  await expect(page.getByRole('button', { name: 'Unavailable', exact: true })).toBeDisabled();
  expect(await toggle.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
  await openStory(page, 'field-kit-selection--interactive');
  const top = page.getByRole('button', { name: 'Top', exact: true });
  await top.focus();
  await page.keyboard.press('Enter');
  await expect(top).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Orbit', exact: true })).toBeDisabled();
});

test('form controls remain labeled and the appearance picker uses the real provider', async ({ page }) => {
  await openStory(page, 'field-kit-forms--states');
  await page.getByLabel('Squad name').fill('QA squad');
  await expect(page.getByRole('status')).toHaveText('Squad: QA squad');
  await page.getByLabel('Ambient sound').uncheck();
  await expect(page.getByLabel('Ambient sound')).not.toBeChecked();
  await page.getByLabel('Appearance').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('tower.ui.appearance.v1'))).toBe('dark');
  await expect(page.getByLabel('Import code')).toHaveAttribute('aria-describedby', /.+-error$/);
});

test('System appearance follows OS changes without changing the preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openStory(page, 'field-kit-overview--field-kit', 'system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByLabel('Appearance')).toHaveValue('system');
});

for (const source of ['game', 'OS']) {
  test(`${source} reduced motion stops decorative animations and preserves input transparency`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: source === 'OS' ? 'reduce' : 'no-preference' });
    await openStory(page, 'field-kit-atmosphere--page', 'light', source === 'game' ? 'reduce' : 'system');
    const activeAnimations = await page.locator('.ui-page-atmosphere *, .ui-model-backdrop *').evaluateAll(elements => elements.filter(element => getComputedStyle(element).animationName !== 'none').length);
    expect(activeAnimations).toBe(0);
    for (const selector of ['.ui-page-atmosphere', '.ui-model-backdrop']) {
      expect(await page.locator(selector).evaluate(element => getComputedStyle(element).pointerEvents)).toBe('none');
      await expect(page.locator(selector)).toHaveAttribute('aria-hidden', 'true');
    }
  });
}

test('Storybook manager exposes documentation and review tools', async ({ page }) => {
  await page.goto('/?path=/story/field-kit-overview--field-kit');
  await expect(page.getByRole('button', { name: /Appearance|Light/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /System motion|Motion/ }).first()).toBeVisible();
  await expect(page.locator('#storybook-preview-iframe')).toBeVisible();
  await page.goto('/?path=/docs/field-kit-buttons--docs');
  await expect(page.frameLocator('#storybook-preview-iframe').getByText('Native button attributes and refs pass through.', { exact: false }).first()).toBeVisible();
});
