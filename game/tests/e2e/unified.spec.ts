import { placeTower, openDiagnostics } from './mapActions';
import { expect, test } from '@playwright/test';

test('one map combines towers and geometry, with separate preset saves and untouched legacy data', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('tower-foundation-v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('saves');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, transaction = db.transaction('saves', 'readwrite');
        transaction.objectStore('saves').put({ revision: 42, envelope: { legacy: 'preserve_me' } }, 'probe');
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
      };
    });
  });
  await expect(page.getByRole('img')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Development labs' })).toHaveCount(0);
  await placeTower(page);
  await openDiagnostics(page); await page.getByRole('button', { name: 'Place left', exact: true }).click();
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved locally');
  await page.getByLabel('Product preset').selectOption('fragile');
  await expect(page.getByTestId('product-health')).toHaveText('20 / 20');
  await expect(page.getByTestId('placed-tower')).toHaveCount(0);
  await expect(page.getByRole('img')).toHaveCount(1);
  await page.getByRole('button', { name: 'Load save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('No local test-map save');
  await openDiagnostics(page); await page.getByRole('button', { name: 'Place right', exact: true }).click();
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved locally');
  await page.getByLabel('Product preset').selectOption('standard');
  await page.getByRole('button', { name: 'Load save', exact: true }).click();
  await expect(page.getByTestId('placed-tower')).toHaveCount(1);
  await expect(page.getByTestId('sight-marker')).toHaveCount(1);
  await expect(page.getByTestId('compute')).toHaveText('270');
  await openDiagnostics(page); await page.getByRole('button', { name: 'Place marker on map', exact: true }).click();
  await page.getByRole('button', { name: 'Tower 1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Place marker on map', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('selected-tower')).toContainText('Selected tower 1');
  await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  await page.getByRole('button', { name: 'Step 1 tick', exact: true }).click();
  await page.getByRole('button', { name: 'Pause encounter', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save locally', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Place left', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Product preset')).toBeDisabled();
  await expect(page.getByTestId('clock-probe')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('unified-map.png'), fullPage: true });
  const legacy = await page.evaluate(async () => new Promise<unknown>((resolve, reject) => {
    const request = indexedDB.open('tower-foundation-v1', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, read = db.transaction('saves', 'readonly').objectStore('saves').get('probe');
      read.onsuccess = () => { db.close(); resolve(read.result); };
      read.onerror = () => { db.close(); reject(read.error); };
    };
  }));
  expect(legacy).toEqual({ revision: 42, envelope: { legacy: 'preserve_me' } });
});
