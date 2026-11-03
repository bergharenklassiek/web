import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { NEVER, of } from 'rxjs';
import { Event } from '../../../core/models/event';
import { Story } from '../../../core/models/story';
import { ContentService } from '../../../core/services/content.service';
import { eventListLoaded } from '../../../core/store/content.events';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  const story: Story<Event> = {
    id: '1',
    slug: 'concert',
    content: { title: 'Concert', date: '2999-01-01 16:00', images: [] } as unknown as Event,
  };
  const homePage = {
    content: {
      headerText: 'Lange welkomsttekst',
      headerTextShort: 'Korte tekst',
      aboutTeaser: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Over de stichting' }] }] },
    },
  };

  let fixture: ComponentFixture<HomePageComponent>;
  let element: HTMLElement;

  function setup(page$: unknown = of(homePage)) {
    TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: MatDialog, useValue: {} },
        { provide: ContentService, useValue: { homePage: () => page$ } },
      ],
    });
    fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    element = fixture.nativeElement;
  }

  const loadEvents = (events: Story<Event>[]) => {
    TestBed.inject(Dispatcher).dispatch(eventListLoaded({ events, past: false }));
    fixture.detectChanges();
  };

  it('should show the texts from Storyblok', () => {
    setup();

    expect(element.querySelector('.app-home-page__header')?.textContent).toContain('Lange welkomsttekst');
    expect(element.querySelector('.app-home-page__header-short')?.textContent).toContain('Korte tekst');
    expect(element.querySelector('.app-home-page__about')?.textContent).toContain('Over de stichting');
  });

  it('should show placeholders while loading', () => {
    setup(NEVER);

    expect(element.querySelectorAll('.app-home-page__skeleton-line').length).toBe(3);
    expect(element.querySelectorAll('.app-home-page__events-loading-card').length).toBe(3);
  });

  it('should show the upcoming concerts once loaded', () => {
    setup();

    loadEvents([story]);

    expect(element.querySelectorAll('app-event-card').length).toBe(1);
    expect(element.querySelector('.app-home-page__events-loading-card')).toBeNull();
  });

  it('should add a tile about next year when there is one upcoming concert', () => {
    setup();

    loadEvents([story]);

    expect(element.querySelector('app-back-next-year-tile')).not.toBeNull();
  });

  it('should not show the tile with several upcoming concerts', () => {
    setup();

    loadEvents([story, { ...story, id: '2', slug: 'concert-2' }]);

    expect(element.querySelector('app-back-next-year-tile')).toBeNull();
  });

  it('should not show the tile without upcoming concerts', () => {
    setup();

    loadEvents([]);

    expect(element.querySelector('app-back-next-year-tile')).toBeNull();
  });

  it('should explain when there are no upcoming concerts', () => {
    setup();

    loadEvents([]);

    expect(element.querySelector('.app-home-page__events__no-events')).not.toBeNull();
  });

  it('should set the page title and show the video', () => {
    setup();

    expect(document.title).toBe('Bergharen Klassiek');
    expect(element.querySelector('app-youtube-video')).not.toBeNull();
  });
});
