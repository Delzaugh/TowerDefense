import { expect, test } from '@playwright/test';

test('the Field kit Hub keeps its world and real controls usable across themes and viewport sizes', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
  const sizes = [
    { width: 1280, height: 800 },
    { width: 736, height: 414 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ];
  for (const theme of ['dark', 'light']) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const settings = page.getByRole('dialog', { name: 'Campus settings' });
    await settings.getByLabel('Appearance').selectOption(theme);
    await settings.getByRole('button', { name: 'Done', exact: true }).click();
    for (const size of sizes) {
      await page.setViewportSize(size);
      const layout = await page.evaluate(() => {
        const rect = (selector: string) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`Missing ${selector}`);
          const bounds = element.getBoundingClientRect();
          return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, area: bounds.width * bounds.height };
        };
        return {
          stage: rect('.home-stage'), card: rect('.home-lab-card'), camera: rect('.home-camera'), zoom: rect('.home-zoom'),
          width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          controls: Array.from(document.querySelectorAll<HTMLButtonElement>('.home-screen button')).filter(button => button.getClientRects().length > 0).map(button => {
            const bounds = button.getBoundingClientRect();
            return { name: button.getAttribute('aria-label') ?? button.textContent, left: bounds.left, right: bounds.right, width: bounds.width, height: bounds.height };
          }),
        };
      });
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
      expect(layout.stage.area).toBeGreaterThan(layout.card.area * 1.5);
      const overlaps = (first: typeof layout.card, second: typeof layout.card) => first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
      expect(overlaps(layout.card, layout.camera)).toBe(false);
      expect(overlaps(layout.card, layout.zoom)).toBe(false);
      for (const control of layout.controls) {
        expect(control.left, `${control.name} left edge`).toBeGreaterThanOrEqual(0);
        expect(control.right, `${control.name} right edge`).toBeLessThanOrEqual(layout.width);
        expect(control.height, `${control.name} touch target`).toBeGreaterThanOrEqual(testInfo.project.name === 'touch-edge' ? 44 : 42);
      }
      await expect(page.getByRole('button', { name: 'Inspect Towers', exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`hub-${theme}-${size.width}x${size.height}.png`), fullPage: true });
    }
  }
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Top', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reset view', exact: true })).not.toHaveText('100%');
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reset view', exact: true })).toHaveText('100%');
});
