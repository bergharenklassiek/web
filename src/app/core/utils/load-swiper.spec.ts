import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { routes } from '../routing/app.routes';
import { ContentService } from '../services/content.service';

@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class HostComponent {}

// In its own file, because custom elements stay registered for everything else in the same file
describe('loadSwiper', () => {
  it('should register Swiper for pages with a carousel, not for other pages', async () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideRouter(routes),
        { provide: MatDialog, useValue: {} },
        { provide: ContentService, useValue: { loadEvents: () => of([]), loadEvent: () => EMPTY } },
      ],
    });
    TestBed.createComponent(HostComponent);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/agenda');
    expect(customElements.get('swiper-container')).toBeUndefined();

    await router.navigateByUrl('/agenda/concert');
    expect(customElements.get('swiper-container')).toBeDefined();
  });
});
