import { expect, test } from '@playwright/test';

const campusReadyTimeout = 90_000;

async function expectCampusReady(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'ready', {
    timeout: campusReadyTimeout,
  });
}

test.describe('campus home', () => {
  test.setTimeout(120_000);

  test('the production entry opens the campus, its camera controls work, and the diagnostic route stays lazy', async ({ page }, testInfo) => {
    const scriptRequests: string[] = [];
    const modelRequests: string[] = [];
    const pageErrors: string[] = [];
    page.on('request', request => {
      if (request.resourceType() === 'script') scriptRequests.push(new URL(request.url()).pathname);
      if (new URL(request.url()).pathname.endsWith('.glb')) modelRequests.push(new URL(request.url()).pathname);
    });
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');
    await expectCampusReady(page);
    for (const district of ['civic', 'canyon', 'construction', 'utility']) {
      expect(modelRequests.some(path => path.includes(`campus_tile_${district}_v01`))).toBe(true);
      expect(modelRequests.some(path => path.includes(`campus_${district}_decor_v01`))).toBe(true);
    }
    for (const character of ['copilot_developer', 'github_octocat_classic_lowpoly', 'copilot_rubber_duck']) {
      expect(modelRequests.some(path => path.includes(`${character}_v01`))).toBe(true);
    }
    for (const asset of ['campus_tile_forest', 'campus_tree_pine_bare', 'campus_tree_spreading_bare', 'campus_tree_autumn_bare']) {
      expect(modelRequests.some(path => path.includes(`${asset}_v01`))).toBe(true);
    }

    await expect(page.getByRole('heading', { name: 'Your campus, one corner at a time.' })).toHaveCount(0);
    await expect(page.locator('.home-footer, .home-below')).toHaveCount(0);
    await expect(page.getByTestId('campus-canvas')).toHaveAttribute('role', 'img');
    await expect(page.getByRole('img', { name: 'Interactive 3D campus with the Copilot Lab and Copilot' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start encounter', exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Advance automatically')).toHaveCount(0);
    expect(scriptRequests.some(path => /LabScreen/i.test(path))).toBe(false);

    const resetView = page.getByRole('button', { name: 'Reset view' });
    const readZoom = async () => Number((await resetView.innerText()).replace('%', ''));
    const initialZoom = await readZoom();
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect.poll(readZoom).toBeGreaterThan(initialZoom);
    await page.getByRole('button', { name: 'Zoom out' }).click();
    await expect.poll(readZoom).toBe(initialZoom);
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.getByRole('button', { name: 'Reset view' }).click();
    await expect.poll(readZoom).toBe(initialZoom);

    const cameraOptions = page.getByRole('group', { name: 'Camera angle' });
    await expect(cameraOptions.getByRole('button')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Home', exact: true })).toHaveAttribute('aria-pressed', 'true');
    for (const angle of ['Top', 'Home']) {
      const control = page.getByRole('button', { name: angle, exact: true });
      await control.click();
      await expect(control).toHaveAttribute('aria-pressed', 'true');
      await expect(cameraOptions.locator('[aria-pressed="true"]')).toHaveCount(1);
      await expect(cameraOptions).toBeVisible();
    }
    await page.getByRole('button', { name: 'Top', exact: true }).press('Enter');
    await expect(page.getByRole('button', { name: 'Top', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Home', exact: true }).press('Space');
    await expect(page.getByRole('button', { name: 'Home', exact: true })).toHaveAttribute('aria-pressed', 'true');

    const viewport = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width);
    const screenshotName = testInfo.project.name === 'touch-edge' ? 'campus-home-mobile.png' : 'campus-home-desktop.png';
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByText('Motion is reduced by your settings.', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(screenshotName), fullPage: true });
    expect(pageErrors).toEqual([]);
  });

  test('motion and ambience preferences persist after reload', async ({ page }) => {
    await page.goto('/');
    await expectCampusReady(page);

    const settingsButton = page.getByRole('button', { name: 'Settings' });
    await settingsButton.click();
    const dialog = page.getByRole('dialog', { name: 'Campus settings' });
    await expect(dialog).toBeVisible();
    const ambience = dialog.getByRole('checkbox', { name: /Campus ambience/ });
    const reducedMotion = dialog.getByRole('checkbox', { name: /Reduce motion/ });
    if (await ambience.isChecked()) await ambience.uncheck();
    if (!(await reducedMotion.isChecked())) await reducedMotion.check();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(settingsButton).toBeFocused();
    await expect(page.getByText('Motion is reduced by your settings.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resume ambience' })).toBeVisible();
    await page.getByRole('button', { name: 'Resume ambience' }).click();
    await expect(page.getByRole('button', { name: 'Pause ambience' })).toBeVisible();
    await page.getByRole('button', { name: 'Pause ambience' }).click();
    await expect(page.getByRole('button', { name: 'Resume ambience' })).toBeVisible();

    await page.reload();
    await expectCampusReady(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    const savedDialog = page.getByRole('dialog', { name: 'Campus settings' });
    await expect(savedDialog.getByRole('checkbox', { name: /Campus ambience/ })).not.toBeChecked();
    await expect(savedDialog.getByRole('checkbox', { name: /Reduce motion/ })).toBeChecked();
  });

  test('OS reduced-motion preference is explained in settings and respected without changing the saved choice', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expectCampusReady(page);

    await page.getByRole('button', { name: 'Settings' }).click();
    const dialog = page.getByRole('dialog', { name: 'Campus settings' });
    await expect(dialog).toContainText('Your device requests reduced motion. The campus stays still while that setting is on, even if you allow motion here.');
    await expect(dialog.getByRole('checkbox', { name: /Reduce motion/ })).not.toBeChecked();
    await expect(page.getByText('Motion is reduced by your settings.', { exact: true })).toBeVisible();
  });

  test('unavailable browser storage keeps home and settings usable for this visit', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() { throw new DOMException('Storage denied by browser policy', 'SecurityError'); },
      });
    });

    await page.goto('/');
    await expectCampusReady(page);
    const sessionNotice = page.getByRole('status').filter({ hasText: 'Settings will apply for this visit.' }).first();
    await expect(sessionNotice).toBeVisible();

    await page.getByRole('button', { name: 'Settings' }).click();
    const dialog = page.getByRole('dialog', { name: 'Campus settings' });
    const reducedMotion = dialog.getByRole('checkbox', { name: /Reduce motion/ });
    await reducedMotion.check();
    await expect(reducedMotion).toBeChecked();
    await expect(sessionNotice).toBeVisible();
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText('Motion is reduced by your settings.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('a failed campus model can be retried successfully', async ({ page }, testInfo) => {
    let rejectedFirstModel = false;
    await page.route('**/*.glb', async route => {
      if (!rejectedFirstModel) {
        rejectedFirstModel = true;
        await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Temporary model fetch failure' });
        return;
      }
      await route.continue();
    });

    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'error', { timeout: campusReadyTimeout });
    expect(rejectedFirstModel).toBe(true);
    await expect(page.getByRole('heading', { name: 'The campus could not open' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('campus-home-error.png'), fullPage: true });
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expectCampusReady(page);
    await page.screenshot({ path: testInfo.outputPath('campus-home-retried.png'), fullPage: true });
  });

  test('a lost WebGL context recovers on a replacement canvas', async ({ page }) => {
    await page.goto('/');
    await expectCampusReady(page);

    const oldCanvas = await page.getByTestId('campus-canvas').elementHandle();
    if (!oldCanvas) throw new Error('The ready campus canvas was not attached.');
    const hasLossExtension = await oldCanvas.evaluate(element => {
      const context = (element as HTMLCanvasElement).getContext('webgl2');
      return Boolean(context?.getExtension('WEBGL_lose_context'));
    });
    if (!hasLossExtension) {
      await oldCanvas.dispose();
      test.skip(true, 'This browser does not expose WEBGL_lose_context.');
      return;
    }

    await oldCanvas.evaluate(element => {
      const context = (element as HTMLCanvasElement).getContext('webgl2');
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    });
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'error', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expectCampusReady(page);
    await expect.poll(() => oldCanvas.evaluate(element => element.isConnected)).toBe(false);
    await oldCanvas.dispose();
  });

  test('unavailable WebGL offers a useful home without 3D', async ({ page }) => {
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        configurable: true,
        value(contextId: string, ...args: unknown[]) {
          if (contextId.startsWith('webgl') || contextId === 'experimental-webgl') return null;
          return Reflect.apply(originalGetContext, this, [contextId, ...args]);
        },
      });
    });

    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'error', { timeout: campusReadyTimeout });
    await expect(page.getByRole('button', { name: 'Continue without 3D' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue without 3D' }).click();
    await expect(page.getByTestId('home-screen')).toHaveAttribute('data-state', 'fallback');
    await expect(page.getByRole('heading', { name: 'Campus view unavailable' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('hash navigation returns from the diagnostic lab and keeps the legacy alias', async ({ page }) => {
    await page.goto('/');
    await expectCampusReady(page);
    await page.evaluate(() => { window.location.hash = '/lab'; });
    await expect(page.getByRole('button', { name: 'Start encounter', exact: true })).toBeVisible();

    await page.getByRole('link', { name: '← Campus home' }).click();
    await expectCampusReady(page);
    await expect(page.getByRole('button', { name: 'Start encounter', exact: true })).toHaveCount(0);

    await page.goto('/?lab=encounter');
    await expect(page.getByRole('button', { name: 'Start encounter', exact: true })).toBeVisible();
  });
});
