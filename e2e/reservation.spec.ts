import { expect, test } from './support/test';
import { answerReservation, fakeConcert, useFakeConcert } from './support/fake-concert';

test.beforeEach(async ({ page }) => {
  await useFakeConcert(page);
  await page.goto('/');
  await expect(page.locator('app-event-card')).toContainText(fakeConcert.content.title);
});

test('a full reservation works, from the button to the thanks message', async ({ page }) => {
  const reservation = await answerReservation(page);

  await page.getByRole('button', { name: 'Reserveer hier' }).click();
  await page.getByRole('dialog').getByRole('button', { name: fakeConcert.content.title }).click();
  await page.getByLabel('Naam').fill('Test Gast');
  await page.getByLabel('E-mailadres').fill('gast@example.com');
  await page.getByLabel('Aantal personen').selectOption('2');
  await page.getByRole('button', { name: 'Reserveer', exact: true }).click();

  const thanks = page.getByRole('status');
  await expect(thanks).toContainText('Bedankt voor je reservering');
  await expect(thanks).toContainText('2 personen');
  await expect(thanks).toContainText('gast@example.com');
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Route plannen' })).toBeVisible();

  expect(reservation.sent()).toMatchObject({
    id: String(fakeConcert.id),
    slug: fakeConcert.slug,
    name: 'Test Gast',
    email: 'gast@example.com',
    seats: 2,
    website: '',
  });
});

test('the honeypot field stays out of sight and out of reach', async ({ page }) => {
  await page.getByRole('button', { name: 'Reserveer hier' }).click();
  await page.getByRole('dialog').getByRole('button', { name: fakeConcert.content.title }).click();

  const honeypot = page.locator('.reservation-form__honeypot input');
  await expect(honeypot).toBeAttached();
  await expect(honeypot).not.toBeInViewport();

  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    await expect(honeypot).not.toBeFocused();
  }
});

test('the dialog keeps focus inside, closes with Escape, and returns focus', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Reserveer hier' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Sluiten' })).toBeFocused();

  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    // The focus trap passes focus on through its anchor elements, so give it a moment
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('mat-dialog-container')), `focus after ${i + 1} tabs`).toBe(true);
  }

  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(button).toBeFocused();
});
