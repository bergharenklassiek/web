/**
 * Registers Swiper's custom elements in the browser. The server doesn't run them, and it renders the slides as they are.
 * Called while loading a route, so the elements are defined before the page renders.
 */
export async function loadSwiper(): Promise<void> {
  if (typeof customElements === 'undefined') {
    return;
  }
  const { register } = await import('swiper/element/bundle');
  register();
}
