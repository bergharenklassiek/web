import { expect, test } from './support/test';

test('a reservation can be cancelled from the link in the email', async ({ page }) => {
  const actions: string[] = [];
  await page.route('https://script.google.com/**', (route) => {
    const { action, code } = route.request().postDataJSON();
    expect(code).toBe('11111111-2222-4333-8444-555555555555');
    actions.push(action);
    return route.fulfill({
      json: { status: 'ok', details: { title: 'E2E testconcert', dateLabel: 'zo 22 november 2026', seats: 2 } },
      headers: { 'access-control-allow-origin': '*' },
    });
  });

  await page.goto('/annuleren/11111111-2222-4333-8444-555555555555');

  await expect(page.getByText('E2E testconcert')).toBeVisible();
  await expect(page.getByText('2 personen')).toBeVisible();
  expect(actions).toEqual(['lookup']);

  await page.getByRole('button', { name: 'Annuleer reservering' }).click();

  await expect(page.getByRole('status')).toContainText('Je reservering is geannuleerd');
  expect(actions).toEqual(['lookup', 'cancel']);
});
