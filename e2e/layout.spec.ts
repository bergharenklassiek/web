import { expect, test } from './support/test';
import { allPaths } from './support/pages';
import { useFakeConcert } from './support/fake-concert';

// Google's limit for a good score
const maxLayoutShift = 0.1;

test.describe('layout shift', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Only Chromium reports layout shifts');

  for (const path of allPaths) {
    test(`${path} doesn't shift while loading`, async ({ page }) => {
      await page.addInitScript(() => {
        const shifts = { total: 0 };
        (window as unknown as { shifts: typeof shifts }).shifts = shifts;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
            if (!entry.hadRecentInput) {
              shifts.total += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });

      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const total = await page.evaluate(() => (window as unknown as { shifts: { total: number } }).shifts.total);
      expect(total).toBeLessThan(maxLayoutShift);
    });
  }
});

test.describe('at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of allPaths) {
    test(`${path} doesn't scroll sideways`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, window: window.innerWidth }));
      expect(widths.page).toBeLessThanOrEqual(widths.window);
    });
  }

  test('both cards on the home page can be reached by swiping', async ({ page }) => {
    await useFakeConcert(page);
    await page.goto('/');

    const card = page.locator('app-event-card');
    const tile = page.locator('app-back-next-year-tile');
    await expect(tile).toBeVisible();
    await expect(page.locator('app-event-card')).toHaveCount(1);

    // The first card starts at the left edge, and scrolling can't go further left than that
    const list = page.locator('.app-home-page__events');
    await list.evaluate((el) => { el.scrollLeft = -1000; });
    expect((await card.boundingBox())!.x).toBeGreaterThanOrEqual(0);

    await list.evaluate((el) => { el.scrollLeft = 10_000; });
    const box = (await tile.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});
