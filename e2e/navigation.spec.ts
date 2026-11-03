import { expect, test } from './support/test';
import { concertWithPhotos, menuPages } from './support/pages';

test.describe('menu pages', () => {
  for (const { menu, path, title, content } of menuPages) {
    test(`${menu} opens by direct URL`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveTitle(title);
      await expect(page.locator(content)).toBeVisible();
    });

    test(`${menu} opens through the menu`, async ({ page }) => {
      await page.goto(path === '/contact' ? '/' : '/contact');
      await page.getByRole('button', { name: 'Menu openen' }).click();
      await page.locator('.app-header__menu__content').getByRole('link', { name: menu, exact: true }).click();

      await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/' : path}/?$`));
      await expect(page).toHaveTitle(title);
      await expect(page.locator(content)).toBeVisible();
    });
  }
});

test('an old concert link redirects to the agenda', async ({ page }) => {
  await page.goto(`/events/${concertWithPhotos.path.split('/').pop()}`);

  await expect(page).toHaveURL(new RegExp(`${concertWithPhotos.path}/?$`));
  await expect(page.getByRole('heading', { name: concertWithPhotos.title })).toBeVisible();
});

test('an unknown URL returns status 404 with the site\'s own page', async ({ page, siteErrors }) => {
  siteErrors.ignore(/status of 404/);

  const response = await page.goto('/bestaat-niet');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Deze pagina bestaat niet' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'agenda' })).toBeVisible();
});
