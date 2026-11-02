// Swiper is large, so it's only loaded when a page has a carousel. register() does nothing the second time.
export async function loadSwiper(): Promise<void> {
  const { register } = await import('swiper/element/bundle');
  register();
}
