import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';
import { EMPTY, NEVER, of } from 'rxjs';
import { ContentService } from '../services/content.service';
import { AboutPageComponent } from '../../ui/pages/about-page/about-page.component';
import { AgendaPageComponent } from '../../ui/pages/agenda-page/agenda-page.component';
import { ContactPageComponent } from '../../ui/pages/contact-page/contact-page.component';
import { ContentPageComponent } from '../../ui/pages/content-page/content-page.component';
import { EventPageComponent } from '../../ui/pages/event-page/event-page.component';
import { HomePageComponent } from '../../ui/pages/home-page/home-page.component';
import { NotFoundPageComponent } from '../../ui/pages/not-found-page/not-found-page.component';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';
import { RenderMode } from '@angular/ssr';

@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class HostComponent {}

describe('routes', () => {
  async function navigate(url: string) {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideRouter(routes),
        { provide: MatDialog, useValue: {} },
        {
          provide: ContentService,
          useValue: {
            homePage: () => NEVER,
            loadAboutPage: () => EMPTY,
            loadContentPage: () => EMPTY,
            loadEvent: () => EMPTY,
            loadEvents: () => of([]),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(HostComponent);
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    fixture.detectChanges();
    return { router, element: fixture.nativeElement as HTMLElement };
  }

  it.each([
    ['/', HomePageComponent, 'app-home-page'],
    ['/agenda', AgendaPageComponent, 'app-agenda-page'],
    ['/agenda/concert', EventPageComponent, 'app-event-page'],
    ['/contact', ContactPageComponent, 'app-contact-page'],
    ['/over-ons', AboutPageComponent, 'app-about-page'],
    ['/gebouw', ContentPageComponent, 'app-content-page'],
    ['/concerten-in-de-regio', ContentPageComponent, 'app-content-page'],
    ['/anbi', ContentPageComponent, 'app-content-page'],
    ['/bestaat-niet', NotFoundPageComponent, 'app-not-found-page'],
  ])('should render %s', async (url, _component, selector) => {
    const { element } = await navigate(url);

    expect(element.querySelector(selector)).not.toBeNull();
  });

  it('should redirect the old events URLs to the agenda', async () => {
    const { router } = await navigate('/events/concert');

    expect(router.url).toBe('/agenda/concert');
  });

  describe('server rendering', () => {
    const modeOf = (path: string) => serverRoutes.find((route) => route.path === path)?.renderMode;

    it('should define how every route is rendered', () => {
      const paths = routes.map((route) => route.path);

      expect(serverRoutes.map((route) => route.path).sort()).toEqual([...paths].sort());
    });

    it('should render concerts on request, because new ones appear without a deploy', () => {
      expect(modeOf('agenda/:event-slug')).toBe(RenderMode.Server);
      expect(modeOf('events/:event-slug')).toBe(RenderMode.Server);
    });

    it('should prerender the other pages', () => {
      expect(modeOf('')).toBe(RenderMode.Prerender);
      expect(modeOf('agenda')).toBe(RenderMode.Prerender);
    });
  });
});
