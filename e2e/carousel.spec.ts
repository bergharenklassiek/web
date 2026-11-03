import { Locator, Page } from '@playwright/test';
import { expect, test } from './support/test';
import { concertWithPhotos } from './support/pages';

const activeIndex = (carousel: Locator) => carousel.evaluate((el: HTMLElement & { swiper: { activeIndex: number } }) => el.swiper.activeIndex);

async function expectWorkingCarousel(page: Page) {
  const carousel = page.locator('swiper-container[data-started]');
  await expect(carousel).toBeVisible();

  // All photos, each with a dot
  const photos = carousel.locator('swiper-slide img');
  const count = await photos.count();
  expect(count).toBeGreaterThan(1);
  const dots = carousel.locator('.swiper-pagination-bullet');
  await expect(dots).toHaveCount(count);
  await expect.poll(() => photos.first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  // Autoplay moves on after 5 seconds by itself
  await page.mouse.move(0, 0);
  await expect.poll(() => activeIndex(carousel), { timeout: 8_000 }).toBeGreaterThan(0);

  // A dot shows its photo
  await dots.first().click();
  await expect.poll(() => activeIndex(carousel)).toBe(0);
  await expect(photos.first()).toBeInViewport();
}

test('the carousel works on a concert page by direct URL', async ({ page }) => {
  await page.goto(concertWithPhotos.path);

  await expectWorkingCarousel(page);
});

test('the carousel works on a concert page reached through the agenda', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu openen' }).click();
  await page.locator('.app-header__menu__content').getByRole('link', { name: 'Agenda', exact: true }).click();
  await page.getByRole('button', { name: 'Eerder' }).click();
  await page.getByRole('link', { name: concertWithPhotos.title }).click();

  await expect(page.getByRole('heading', { name: concertWithPhotos.title })).toBeVisible();
  await expectWorkingCarousel(page);
});

test('the carousel works on Gebouw by direct URL', async ({ page }) => {
  await page.goto('/gebouw');

  await expectWorkingCarousel(page);
});

test('the carousel works on Gebouw reached through the menu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu openen' }).click();
  await page.locator('.app-header__menu__content').getByRole('link', { name: 'Gebouw', exact: true }).click();

  await expectWorkingCarousel(page);
});
