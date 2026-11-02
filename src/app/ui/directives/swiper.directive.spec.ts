import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwiperOptions } from 'swiper/types';
import { SwiperDirective } from './swiper.directive';

class FakeSwiperElement extends HTMLElement {
  autoplay?: unknown;
  navigation?: unknown;
  // What was set at the moment the carousel started
  startedWith?: { autoplay: unknown; navigation: unknown };
  initialize() {
    this.startedWith = { autoplay: this.autoplay, navigation: this.navigation };
  }
}
customElements.define('swiper-container', FakeSwiperElement);

@Component({
  imports: [SwiperDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <swiper-container init="false" [appSwiper]="options"></swiper-container>
    }
  `,
})
class HostComponent {
  show = signal(true);
  options: SwiperOptions = { autoplay: true, navigation: true };
}

describe('SwiperDirective', () => {
  const carousel = (fixture: { nativeElement: HTMLElement }) =>
    fixture.nativeElement.querySelector('swiper-container') as FakeSwiperElement;

  function mockReducedMotion(matches: boolean) {
    window.matchMedia = vi.fn().mockReturnValue({ matches });
  }

  beforeEach(() => mockReducedMotion(false));

  it('should set the options before starting the carousel', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    await vi.waitFor(() => expect(carousel(fixture).startedWith).toEqual({ autoplay: true, navigation: true }));
    expect(carousel(fixture).hasAttribute('data-started')).toBe(true);
  });

  it('should start a carousel that appears later, when its photos have loaded', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(carousel(fixture)).toBeNull();

    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    await vi.waitFor(() => expect(carousel(fixture).startedWith).toEqual({ autoplay: true, navigation: true }));
  });

  it('should not autoplay for people who prefer reduced motion', async () => {
    mockReducedMotion(true);

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    await vi.waitFor(() => expect(carousel(fixture).startedWith).toEqual({ autoplay: false, navigation: true }));
  });

  it('should not start a carousel that was removed while Swiper was loading', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const element = carousel(fixture);

    fixture.destroy();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(element.startedWith).toBeUndefined();
  });
});
