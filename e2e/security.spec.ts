import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import { allPaths } from './support/pages';
import { answerReservation, fakeConcert, useFakeConcert } from './support/fake-concert';

type WithViolations = Window & { violations: string[] };

async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    const violations: string[] = [];
    (window as unknown as WithViolations).violations = violations;
    document.addEventListener('securitypolicyviolation', (event) => violations.push(`${event.violatedDirective}: ${event.blockedURI}`));
  });
}

const violations = (page: Page) => page.evaluate(() => (window as unknown as WithViolations).violations);

test.beforeEach(({ page }) => recordViolations(page));

for (const path of allPaths) {
  test(`${path} causes no Content Security Policy violation`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    expect(await violations(page)).toEqual([]);
  });
}

test('playing the video causes no violation', async ({ page }) => {
  // Only the browser's permission to load it matters here, so the test doesn't depend on YouTube
  let requested = false;
  await page.route('https://www.youtube-nocookie.com/**', (route) => {
    requested = true;
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html>' });
  });
  await page.goto('/');

  await page.getByRole('button', { name: /Video afspelen/ }).click();

  await expect(page.locator('app-youtube-video iframe')).toBeVisible();
  await expect.poll(() => requested).toBe(true);
  expect(await violations(page)).toEqual([]);
});

test('sending a reservation causes no violation', async ({ page }) => {
  await useFakeConcert(page);
  await answerReservation(page);
  await page.goto('/');

  await page.getByRole('button', { name: 'Reserveer hier' }).click();
  await page.getByRole('dialog').getByRole('button', { name: fakeConcert.content.title }).click();
  await page.getByLabel('Naam').fill('Test Gast');
  await page.getByLabel('E-mailadres').fill('gast@example.com');
  await page.getByRole('button', { name: 'Reserveer', exact: true }).click();

  await expect(page.getByRole('status')).toContainText('Bedankt');
  expect(await violations(page)).toEqual([]);
});
