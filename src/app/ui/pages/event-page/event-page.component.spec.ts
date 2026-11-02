import { DOCUMENT, RESPONSE_INIT } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Event } from '../../../core/models/event';
import { Story } from '../../../core/models/story';
import { ContentService } from '../../../core/services/content.service';
import { EventPageComponent } from './event-page.component';

describe('EventPageComponent', () => {
  const story = (slug: string, date: string, title = slug): Story<Event> => ({
    id: `id-${slug}`,
    slug,
    content: {
      component: 'Event',
      title,
      summary: 'Samenvatting',
      date,
      location: 'Protestantse Kerk Bergharen',
      artists: [],
      images: [{ filename: 'https://a.storyblok.com/f/1/foto.jpg', alt: 'Foto' }],
      description: { type: 'doc', content: [] },
    } as unknown as Event,
  });
  const upcoming = story('nieuw', '2999-01-01 16:00', 'Nieuw concert');
  const past = story('oud', '2000-01-01 16:00', 'Oud concert');
  const stories: Record<string, Story<Event>> = { nieuw: upcoming, oud: past };

  let fixture: ComponentFixture<EventPageComponent>;
  let element: HTMLElement;
  let params: BehaviorSubject<ParamMap>;
  let responseInit: { status?: number; headers?: HeadersInit };
  let open: ReturnType<typeof vi.fn>;
  let document: Document;

  async function render(slug: string, loadEvent = (s: string) => of(stories[s])) {
    params = new BehaviorSubject(convertToParamMap({ 'event-slug': slug }));
    responseInit = {};
    open = vi.fn();
    TestBed.configureTestingModule({
      imports: [EventPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        { provide: RESPONSE_INIT, useValue: responseInit },
        { provide: MatDialog, useValue: { open } },
        { provide: ContentService, useValue: { loadEvent, loadEarlierEventsByArtists: () => of([]) } },
      ],
    });
    document = TestBed.inject(DOCUMENT);
    fixture = TestBed.createComponent(EventPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    element = fixture.nativeElement;
  }

  const cdnHeader = () => new Headers(responseInit.headers).get('Netlify-CDN-Cache-Control');

  it('should show the concert with its reservation button and links', async () => {
    await render('nieuw');

    expect(element.querySelector('h2')?.textContent).toContain('Nieuw concert');
    expect(element.querySelector('.app-event-page__title__reservation-button')).not.toBeNull();
    expect(element.querySelector('app-concert-links')).not.toBeNull();
  });

  it('should not offer reserving or links for a past concert', async () => {
    await render('oud');

    expect(element.querySelector('h2')?.textContent).toContain('Oud concert');
    expect(element.querySelector('.app-event-page__title__reservation-button')).toBeNull();
    expect(element.querySelector('app-concert-links')).toBeNull();
  });

  it('should set the page title and allow CDN caching for a loaded concert', async () => {
    await render('nieuw');

    expect(document.title).toBe('Nieuw concert | Bergharen Klassiek');
    expect(responseInit.status).toBeUndefined();
    expect(cdnHeader()).toContain('s-maxage=300');
  });

  it('should answer 404 without CDN caching for an unknown concert', async () => {
    await render('onbekend', () => throwError(() => new HttpErrorResponse({ status: 404 })));

    expect(element.querySelector('.app-event-page__not-found')).not.toBeNull();
    expect(document.title).toBe('Concert niet gevonden | Bergharen Klassiek');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
    expect(responseInit.status).toBe(404);
    expect(cdnHeader()).toBeNull();
  });

  it('should not cache or report a 404 when Storyblok fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await render('nieuw', () => throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(responseInit.status).toBeUndefined();
    expect(cdnHeader()).toBeNull();
    expect(element.querySelector('.app-event-page__not-found')).toBeNull();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('should follow slug changes when the component is reused', async () => {
    await render('nieuw');

    params.next(convertToParamMap({ 'event-slug': 'oud' }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelector('h2')?.textContent).toContain('Oud concert');
    expect(document.title).toBe('Oud concert | Bergharen Klassiek');
  });

  it('should open the reservation dialog for this concert', async () => {
    await render('nieuw');

    element.querySelector<HTMLButtonElement>('.app-event-page__title__reservation-button')!.click();

    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][1].data.event).toEqual({
      id: 'id-nieuw',
      slug: 'nieuw',
      title: 'Nieuw concert',
      date: '2999-01-01 16:00',
      location: 'Protestantse Kerk Bergharen',
    });
  });
});
