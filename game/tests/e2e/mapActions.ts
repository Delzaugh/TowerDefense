import type { Page } from '@playwright/test';

export async function tapMap(page: Page, x: number, z: number, touch = false) {
  const map = page.locator('.tower-map'); await map.scrollIntoViewIfNeeded();
  const point = await map.evaluate((svg: SVGSVGElement, p) => {
    const screen = new DOMPoint(p.x, p.z).matrixTransform(svg.getScreenCTM()!);
    return { x: screen.x, y: screen.y };
  }, { x, z });
  if (touch) await page.touchscreen.tap(point.x, point.y); else await page.mouse.click(point.x, point.y);
}
export async function placeTower(page: Page, x = -5, z = 0) {
  const enable = page.getByRole('button', { name: 'Place on map', exact: true });
  if (await enable.isVisible()) await enable.click();
  await tapMap(page, x, z);
}
export async function openDiagnostics(page: Page) {
  const details = page.locator('.map-diagnostics');
  if (!(await details.evaluate(element => (element as HTMLDetailsElement).open))) await details.locator('summary').click();
}
export async function openQueue(page: Page) { await page.getByRole('button', { name: /^Edit wave queue/ }).click(); }
export async function closeQueue(page: Page) { await page.getByRole('button', { name: 'Close wave queue', exact: true }).click(); }
