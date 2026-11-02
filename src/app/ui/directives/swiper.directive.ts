import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { SwiperOptions } from 'swiper/types';
import { loadSwiper } from '../../core/utils/load-swiper';

export const carouselAutoplay: SwiperOptions['autoplay'] = {
  delay: 5000,
  disableOnInteraction: true,
  pauseOnMouseEnter: true,
};

type SwiperElement = HTMLElement & SwiperOptions & { initialize?: () => void };

/**
 * Loads Swiper and starts a carousel with these options. Swiper reads most options only when it starts, so the element
 * needs init="false" to wait for them. This also works for a carousel that appears later, when its photos have loaded.
 *
 * Swiper is registered right before starting: once registered, the element shows nothing until it has started. Until
 * then, the rendered first photo stays in place (see swiper-container in styles.scss).
 */
@Directive({
  selector: 'swiper-container[appSwiper]',
})
export class SwiperDirective {
  options = input.required<SwiperOptions>({ alias: 'appSwiper' });

  constructor() {
    const element = inject<ElementRef<SwiperElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    // Only runs in the browser
    afterNextRender(async () => {
      await loadSwiper();
      if (destroyRef.destroyed) {
        return;
      }
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      Object.assign(element, this.options(), reducedMotion ? { autoplay: false } : {});
      element.initialize?.();
      element.setAttribute('data-started', '');
    });
  }
}
