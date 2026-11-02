import { loadSwiper } from './load-swiper';

describe('loadSwiper', () => {
  it('should register the carousel elements, also when called twice', async () => {
    expect(customElements.get('swiper-container')).toBeUndefined();

    await loadSwiper();
    await loadSwiper();

    expect(customElements.get('swiper-container')).toBeDefined();
  });
});
