import { expect, test } from './support/test';
import { allPaths } from './support/pages';
import { useFakeConcert } from './support/fake-concert';

interface LayoutShift {
  value: number;
  hadRecentInput: boolean;
  startTime: number;
  sources: { node?: Element; previousRect: DOMRect; currentRect: DOMRect }[];
}

// Google's limit for a good score
const maxLayoutShift = 0.1;

test.describe('layout shift', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Only Chromium reports layout shifts');

  for (const path of allPaths) {
    test(`${path} doesn't shift while loading`, async ({ page }) => {
      await page.addInitScript(() => {
        const shifts = { total: 0, details: [] as string[] };
        (window as unknown as { shifts: typeof shifts }).shifts = shifts;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as LayoutShift[]) {
            if (!entry.hadRecentInput) {
              shifts.total += entry.value;
              const moved = entry.sources.map(({ node, previousRect: from, currentRect: to }) =>
                `${node?.nodeName}.${node?.className ?? ''} from ${from.x},${from.y} ${from.width}x${from.height} to ${to.x},${to.y} ${to.width}x${to.height}`);
              shifts.details.push(`${entry.value.toFixed(3)} at ${Math.round(entry.startTime)} ms: ${moved.join('; ')}`);
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });

      // Like a slow phone. Some shifts only happen when the browser gets to paint while Angular takes over the page.
      const devTools = await page.context().newCDPSession(page);
      await devTools.send('Emulation.setCPUThrottlingRate', { rate: 8 });

      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const { total, details } = await page.evaluate(() => (window as unknown as { shifts: { total: number; details: string[] } }).shifts);
      expect(total, `Layout shifts:\n${details.join('\n')}`).toBeLessThan(maxLayoutShift);
    });
  }
});

test('one concert and the tile are centred on the home page', async ({ page }) => {
  await useFakeConcert(page);
  await page.goto('/');

  const tile = page.locator('app-back-next-year-tile');
  await expect(tile).toBeVisible();

  const card = (await page.locator('app-event-card').boundingBox())!;
  const box = (await tile.boundingBox())!;
  const middle = (card.x + box.x + box.width) / 2;
  expect(Math.abs(middle - page.viewportSize()!.width / 2)).toBeLessThan(1);
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
    const list = page.getByTestId('event-list');
    await list.evaluate((el) => { el.scrollLeft = -1000; });
    expect((await card.boundingBox())!.x).toBeGreaterThanOrEqual(0);

    await list.evaluate((el) => { el.scrollLeft = 10_000; });
    const box = (await tile.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});
