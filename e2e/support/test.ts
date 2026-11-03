import { expect, test as base } from '@playwright/test';

interface SiteErrors {
  // For errors a test expects, such as the browser logging the 404 status of a page
  ignore(pattern: RegExp): void;
}

// Every test fails on errors in the browser's console or uncaught exceptions, and on a reservation request that the test
// didn't answer, so a test can never reach the real Sheet.
export const test = base.extend<{ siteErrors: SiteErrors; guardSheet: void }>({
  siteErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      const ignored: RegExp[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          errors.push(`${message.text()} (${page.url()})`);
        }
      });
      page.on('pageerror', (error) => errors.push(`${error.message} (${page.url()})`));

      await use({ ignore: (pattern) => ignored.push(pattern) });

      expect(errors.filter((error) => !ignored.some((pattern) => pattern.test(error)))).toEqual([]);
    },
    { auto: true },
  ],
  guardSheet: [
    async ({ page }, use) => {
      const unanswered: string[] = [];
      await page.route('https://script.google.com/**', async (route) => {
        unanswered.push(route.request().url());
        await route.abort();
      });

      await use();

      expect(unanswered, 'Reservation requests that the test did not answer').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
