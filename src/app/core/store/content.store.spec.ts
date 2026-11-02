import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Dispatcher } from '@ngrx/signals/events';
import { of, throwError } from 'rxjs';
import { Event } from '../models/event';
import { Story } from '../models/story';
import { ContentService } from '../services/content.service';
import { displayPastEvents, eventListLoaded, eventLoaded, eventNotFound, loadAboutPage, loadContactItems, loadContentPage, loadEvent, loadEvents } from './content.events';
import { ContentStore } from './content.store';

describe('ContentStore', () => {
  const FUTURE = '2999-01-01 16:00';
  const LATER = '2999-06-01 16:00';
  const PAST = '2000-01-01 16:00';
  const story = (id: string, date = FUTURE, artists: string[] = [], title = id): Story<Event> => ({
    id,
    slug: `event-${id}`,
    content: { component: 'Event', title, date, artists } as unknown as Event,
  });

  let contentService: { [key: string]: jest.Mock };
  let store: InstanceType<typeof ContentStore>;
  let dispatcher: Dispatcher;

  beforeEach(() => {
    contentService = {
      homePage: jest.fn(),
      loadAboutPage: jest.fn(() => of({ id: 'a', slug: 'about', content: { title: 'Over ons' } })),
      loadContentPage: jest.fn((slug: string) => of({ id: slug, slug, content: { title: slug } })),
      loadContactItems: jest.fn(() => of([{ id: 'c', slug: 'c', content: {} }])),
      loadEvents: jest.fn(() => of([story('1')])),
      loadEvent: jest.fn((slug: string) => of(story(slug.replace('event-', '')))),
      loadEarlierEventsByArtists: jest.fn(() => of([])),
    };
    TestBed.configureTestingModule({ providers: [{ provide: ContentService, useValue: contentService }] });
    store = TestBed.inject(ContentStore);
    dispatcher = TestBed.inject(Dispatcher);
  });

  describe('state', () => {
    it('should replace an event already in the store', () => {
      dispatcher.dispatch(eventLoaded({ event: story('1', FUTURE, [], 'old') }));
      dispatcher.dispatch(eventLoaded({ event: story('1', FUTURE, [], 'new') }));

      expect(store.events().map((e) => e.content.title)).toEqual(['new']);
    });

    it('should add a new event', () => {
      dispatcher.dispatch(eventLoaded({ event: story('1') }));
      dispatcher.dispatch(eventLoaded({ event: story('2') }));

      expect(store.events().map((e) => e.id)).toEqual(['1', '2']);
    });

    it('should prefer the version from a fresh list, without adding it twice', () => {
      dispatcher.dispatch(eventLoaded({ event: story('1', FUTURE, [], 'stored') }));
      dispatcher.dispatch(eventListLoaded({ events: [story('1', FUTURE, [], 'fresh'), story('2')], past: false }));

      expect(store.events().map((e) => e.content.title)).toEqual(['fresh', '2']);
      expect(store.eventsLoaded()).toEqual({ past: false, upcoming: true });
    });

    it('should drop upcoming events that are no longer in a fresh upcoming list', () => {
      dispatcher.dispatch(eventListLoaded({ events: [story('removed'), story('kept')], past: false }));
      dispatcher.dispatch(eventListLoaded({ events: [story('kept')], past: false }));

      expect(store.upcomingEvents().map((e) => e.id)).toEqual(['kept']);
    });

    it('should keep past events when a fresh upcoming list arrives', () => {
      dispatcher.dispatch(eventListLoaded({ events: [story('old', PAST)], past: true }));
      dispatcher.dispatch(eventListLoaded({ events: [story('soon')], past: false }));

      expect(store.pastEvents().map((e) => e.id)).toEqual(['old']);
    });

    it('should keep upcoming events when a list of past events arrives', () => {
      dispatcher.dispatch(eventListLoaded({ events: [story('soon')], past: false }));
      dispatcher.dispatch(eventListLoaded({ events: [story('old', PAST)], past: true }));

      expect(store.upcomingEvents().map((e) => e.id)).toEqual(['soon']);
    });

    it('should only offer upcoming events once the list has loaded', () => {
      expect(store.upcomingEventsWhenLoaded()).toBeUndefined();

      dispatcher.dispatch(eventListLoaded({ events: [], past: false }));

      expect(store.upcomingEventsWhenLoaded()).toEqual([]);
    });

    it('should sort upcoming events soonest first and past events newest first', () => {
      dispatcher.dispatch(eventListLoaded({
        events: [story('later', LATER), story('soon', FUTURE), story('old', '1999-01-01 16:00'), story('recent', PAST)],
        past: false,
      }));

      expect(store.upcomingEvents().map((e) => e.id)).toEqual(['soon', 'later']);
      expect(store.pastEvents().map((e) => e.id)).toEqual(['recent', 'old']);
    });

    it('should remember whether to display past events', () => {
      dispatcher.dispatch(displayPastEvents({ display: true }));

      expect(store.displayPastEvents()).toBe(true);
    });

    it('should remember a missing slug once', () => {
      dispatcher.dispatch(eventNotFound({ slug: 'missing' }));
      dispatcher.dispatch(eventNotFound({ slug: 'missing' }));

      expect(store.missingEventSlugs()).toEqual(['missing']);
      expect(store.isEventMissing('missing')).toBe(true);
      expect(store.isEventMissing('other')).toBe(false);
    });

    it('should find earlier events by the same artists', () => {
      dispatcher.dispatch(eventListLoaded({
        events: [story('new', FUTURE, ['a']), story('same', PAST, ['a']), story('other', PAST, ['b']), story('later', LATER, ['a'])],
        past: false,
      }));

      expect(store.earlierEventsOf(store.eventBySlug('event-new')!.content).map((e) => e.id)).toEqual(['same']);
      expect(store.earlierEventsOf(story('none', FUTURE, []).content)).toEqual([]);
    });
  });

  describe('loading', () => {
    it('should load a list of events once', () => {
      dispatcher.dispatch(loadEvents({ past: false }));
      dispatcher.dispatch(loadEvents({ past: false }));

      expect(contentService['loadEvents']).toHaveBeenCalledTimes(1);
      expect(store.eventBySlug('event-1')).toBeDefined();
    });

    it('should load the about page once', () => {
      dispatcher.dispatch(loadAboutPage());
      dispatcher.dispatch(loadAboutPage());

      expect(contentService['loadAboutPage']).toHaveBeenCalledTimes(1);
      expect(store.aboutPage()?.content.title).toBe('Over ons');
    });

    it('should load each content page once', () => {
      dispatcher.dispatch(loadContentPage({ slug: 'gebouw' }));
      dispatcher.dispatch(loadContentPage({ slug: 'gebouw' }));
      dispatcher.dispatch(loadContentPage({ slug: 'anbi' }));

      expect(contentService['loadContentPage']).toHaveBeenCalledTimes(2);
      expect(store.contentPageBySlug('anbi')).toBeDefined();
    });

    it('should load the contact items', () => {
      dispatcher.dispatch(loadContactItems());

      expect(store.contactItems().length).toBe(1);
    });

    it('should load an event that is not in the store', () => {
      dispatcher.dispatch(loadEvent({ slug: 'event-9' }));

      expect(store.eventBySlug('event-9')).toBeDefined();
    });

    it('should not load an event that is in the store', () => {
      dispatcher.dispatch(eventLoaded({ event: story('1') }));
      dispatcher.dispatch(loadEvent({ slug: 'event-1' }));

      expect(contentService['loadEvent']).not.toHaveBeenCalled();
    });

    it('should load earlier events of the artists, also for an event in the store', () => {
      contentService['loadEarlierEventsByArtists'].mockReturnValue(of([story('earlier', PAST, ['a'])]));
      dispatcher.dispatch(eventLoaded({ event: story('1', FUTURE, ['a']) }));
      dispatcher.dispatch(loadEvent({ slug: 'event-1' }));

      expect(contentService['loadEarlierEventsByArtists']).toHaveBeenCalledWith(['a'], FUTURE);
      expect(store.eventBySlug('event-earlier')).toBeDefined();
    });

    it('should mark a slug as missing on a 404', () => {
      contentService['loadEvent'].mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
      dispatcher.dispatch(loadEvent({ slug: 'missing' }));

      expect(store.isEventMissing('missing')).toBe(true);
    });

    it('should mark a slug as missing when the story is not a concert', () => {
      contentService['loadEvent'].mockReturnValue(of({ id: 'h', slug: 'home', content: { component: 'HomePage' } }));
      dispatcher.dispatch(loadEvent({ slug: 'home' }));

      expect(store.isEventMissing('home')).toBe(true);
      expect(store.events()).toEqual([]);
    });

    it('should keep working after a failed request, without marking the slug as missing', () => {
      const consoleError = console.error;
      console.error = () => undefined;
      contentService['loadEvent'].mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));

      dispatcher.dispatch(loadEvent({ slug: 'event-1' }));
      expect(store.isEventMissing('event-1')).toBe(false);

      dispatcher.dispatch(loadEvent({ slug: 'event-2' }));
      console.error = consoleError;
      expect(store.eventBySlug('event-2')).toBeDefined();
    });
  });
});
