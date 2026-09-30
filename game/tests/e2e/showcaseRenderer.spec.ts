import { expect, test } from '@playwright/test';

test.describe('Tower showcase renderer lifecycle', () => {
  test.setTimeout(120_000);

  test('keeps the latest model through rapid changes and survives repeated close/reopen', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
    for (let visit = 0; visit < 3; visit++) {
      await page.getByRole('button', { name: 'Inspect Towers' }).click();
      const showcase = page.getByTestId('tower-showcase');
      if (visit === 0) {
        await expect(showcase).toHaveAttribute('data-state', 'placing', { timeout: 30_000 });
        await expect(showcase).toHaveAttribute('data-animation', 'place');
      }
      await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
      await showcase.evaluate(node => {
        node.setAttribute('data-phase-history', node.getAttribute('data-state') ?? '');
        new MutationObserver(() => node.setAttribute('data-phase-history', `${node.getAttribute('data-phase-history')},${node.getAttribute('data-state')}`))
          .observe(node, { attributes: true, attributeFilter: ['data-state'] });
      });
      await page.locator('[data-tower="tester"]').click();
      await expect(showcase).toHaveAttribute('data-state', 'placing', { timeout: 30_000 });
      await expect(showcase).toHaveAttribute('data-animation', 'place');
      await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
      await expect(showcase).toHaveAttribute('data-animation', 'idle');
      await page.locator('[data-tower="security"]').click();
      await page.locator('[data-tower="base"]').click();
      await page.locator('[data-tower="linter"]').click();
      await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
      await expect(page.locator('[data-tower="linter"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(showcase).toHaveAttribute('data-animation', 'idle');
      await expect(showcase).toHaveAttribute('data-phase-history', /resolving.*placing.*ready/);
      await expect(showcase.locator('canvas.codex-scene')).toHaveCount(1);
      await page.getByRole('button', { name: 'Back to Hub' }).click();
      await expect(page.locator('dialog.codex-dialog')).not.toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('skips automatic Resolve and Place under reduced motion and settles on Rest', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
    await page.getByRole('button', { name: 'Inspect Towers' }).click();
    const showcase = page.getByTestId('tower-showcase');
    await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await expect(showcase).toHaveAttribute('data-animation', 'rest');
    await showcase.evaluate(node => {
      node.setAttribute('data-phase-history', node.getAttribute('data-state') ?? '');
      new MutationObserver(() => node.setAttribute('data-phase-history', `${node.getAttribute('data-phase-history')},${node.getAttribute('data-state')}`))
        .observe(node, { attributes: true, attributeFilter: ['data-state'] });
    });
    await page.locator('[data-tower="security"]').click();
    await expect(showcase).toHaveAttribute('data-phase-history', /loading.*ready/, { timeout: 30_000 });
    await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    await expect(showcase).toHaveAttribute('data-animation', 'rest');
    const history = await showcase.getAttribute('data-phase-history');
    expect(history).not.toMatch(/resolving|placing/);
  });

  test('keeps the preview region stationary when Tower availability text changes', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', { timeout: 90_000 });
    await page.getByRole('button', { name: 'Inspect Towers' }).click();
    const showcase = page.getByTestId('tower-showcase');
    await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    const viewport = page.locator('.codex-model-viewport');
    const original = await viewport.boundingBox();
    for (const id of ['linter', 'security', 'base']) {
      await page.locator(`[data-tower="${id}"]`).click();
      await expect(showcase).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
      expect(await viewport.boundingBox()).toEqual(original);
    }
  });
});
