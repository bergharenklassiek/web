import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { catchError, concat, EMPTY, filter, map, mergeMap, Observable, of, OperatorFunction } from 'rxjs';
import { AboutPage } from '../models/about-page';
import { ContactItem } from '../models/contact-item';
import { ContentPage } from '../models/content-page';
import { Event } from '../models/event';
import { HomePage } from '../models/home-page';
import { Story } from '../models/story';
import { ContentService } from '../services/content.service';
import {
  aboutPageLoaded,
  contactItemsLoaded,
  contentPageLoaded,
  displayPastEvents,
  earlierEventsLoaded,
  eventListLoaded,
  eventLoaded,
  eventNotFound,
  homePageLoaded,
  loadAboutPage,
  loadContactItems,
  loadContentPage,
  loadEvent,
  loadEvents,
  loadHomePage,
} from './content.events';

export interface ContentState {
  homePage: HomePage | undefined;
  aboutPage: Story<AboutPage> | undefined;
  contentPages: Story<ContentPage>[];
  contactItems: Story<ContactItem>[];
  events: Story<Event>[];
  eventsLoaded: { past: boolean; upcoming: boolean };
  displayPastEvents: boolean;
  missingEventSlugs: string[];
}

export const initialContentState: ContentState = {
  homePage: undefined,
  aboutPage: undefined,
  contentPages: [],
  contactItems: [],
  events: [],
  eventsLoaded: { past: false, upcoming: false },
  displayPastEvents: false,
  missingEventSlugs: [],
};

// Keeps a failed request from ending the handler, which would stop it from reacting to later events
function logAndSkip<T>(): OperatorFunction<T, T> {
  return catchError((error: unknown) => {
    console.error(error);
    return EMPTY;
  });
}

function addNewEvents(stored: Story<Event>[], events: Story<Event>[]): Story<Event>[] {
  return stored.concat(events.filter((event) => !stored.some((storedEvent) => storedEvent.id === event.id)));
}

// A fresh list wins over what's stored, because a prerendered page can hold events from the last deploy. Upcoming events
// that aren't in a fresh list of upcoming events have been removed from the CMS.
function mergeEventList(stored: Story<Event>[], events: Story<Event>[], past: boolean): Story<Event>[] {
  const isListed = (story: Story<Event>) => events.some((event) => event.id === story.id);
  const isRemoved = (story: Story<Event>) => !past && !isListed(story) && Date.parse(story.content.date) >= Date.now();
  return stored.filter((story) => !isListed(story) && !isRemoved(story)).concat(events);
}

function replaceOrAdd<T>(stored: Story<T>[], story: Story<T>): Story<T>[] {
  return stored.some((s) => s.id === story.id)
    ? stored.map((s) => (s.id === story.id ? story : s))
    : stored.concat(story);
}

export const ContentStore = signalStore(
  { providedIn: 'root' },
  withState(initialContentState),
  withComputed(({ events }) => ({
    // Soonest first
    upcomingEvents: computed(() => events()
      .filter((e) => Date.parse(e.content.date) >= Date.now())
      .sort((a, b) => Date.parse(a.content.date) - Date.parse(b.content.date))),
    // Newest first
    pastEvents: computed(() => events()
      .filter((e) => Date.parse(e.content.date) < Date.now())
      .sort((a, b) => Date.parse(b.content.date) - Date.parse(a.content.date))),
  })),
  withComputed(({ eventsLoaded, upcomingEvents }) => ({
    // Undefined while the first list is loading, to tell that apart from having no upcoming events
    upcomingEventsWhenLoaded: computed(() => eventsLoaded().upcoming ? upcomingEvents() : undefined),
  })),
  withMethods(({ events, contentPages, missingEventSlugs }) => ({
    eventBySlug: (slug: string) => events().find((e) => e.slug === slug),
    isEventMissing: (slug: string) => missingEventSlugs().includes(slug),
    contentPageBySlug: (slug: string) => contentPages().find((c) => c.slug === slug),
    earlierEventsOf: (event: Event) => event.artists?.length
      ? events()
          .filter((e) => Date.parse(e.content.date) < Date.parse(event.date))
          .filter((e) => e.content.artists?.some((artist) => event.artists.includes(artist)))
          .sort((a, b) => Date.parse(b.content.date) - Date.parse(a.content.date))
      : [],
  })),
  withReducer(
    on(homePageLoaded, ({ payload }) => ({ homePage: payload.homePage })),
    on(aboutPageLoaded, ({ payload }) => ({ aboutPage: payload.aboutPage })),
    on(contentPageLoaded, ({ payload }, state) => ({ contentPages: replaceOrAdd(state.contentPages, payload.contentPage) })),
    on(contactItemsLoaded, ({ payload }) => ({ contactItems: payload.contactItems })),
    on(eventListLoaded, ({ payload }, state) => ({
      eventsLoaded: payload.past ? { ...state.eventsLoaded, past: true } : { ...state.eventsLoaded, upcoming: true },
      events: mergeEventList(state.events, payload.events, payload.past),
    })),
    on(displayPastEvents, ({ payload }) => ({ displayPastEvents: payload.display })),
    on(eventLoaded, ({ payload }, state) => ({ events: replaceOrAdd(state.events, payload.event) })),
    on(eventNotFound, ({ payload }, state) => ({
      missingEventSlugs: state.missingEventSlugs.includes(payload.slug)
        ? state.missingEventSlugs
        : state.missingEventSlugs.concat(payload.slug),
    })),
    on(earlierEventsLoaded, ({ payload }, state) => ({ events: addNewEvents(state.events, payload.events) })),
  ),
  withEventHandlers((store, events = inject(Events), contentService = inject(ContentService)) => {
    const loadEarlierEvents = (event: Event): Observable<ReturnType<typeof earlierEventsLoaded>> => event.artists?.length
      ? contentService.loadEarlierEventsByArtists(event.artists, event.date).pipe(
          map((earlierEvents) => earlierEventsLoaded({ events: earlierEvents })),
          logAndSkip(),
        )
      : EMPTY;

    return {
      handleLoadHomePage$: events.on(loadHomePage).pipe(
        mergeMap(() => contentService.homePage().pipe(
          map((homePage) => homePageLoaded({ homePage: homePage.content })),
          logAndSkip(),
        )),
      ),
      handleLoadAboutPage$: events.on(loadAboutPage).pipe(
        filter(() => !store.aboutPage()),
        mergeMap(() => contentService.loadAboutPage().pipe(
          map((aboutPage) => aboutPageLoaded({ aboutPage })),
          logAndSkip(),
        )),
      ),
      handleLoadContentPage$: events.on(loadContentPage).pipe(
        filter(({ payload }) => !store.contentPageBySlug(payload.slug)),
        mergeMap(({ payload }) => contentService.loadContentPage(payload.slug).pipe(
          map((contentPage) => contentPageLoaded({ contentPage })),
          logAndSkip(),
        )),
      ),
      handleLoadContactItems$: events.on(loadContactItems).pipe(
        mergeMap(() => contentService.loadContactItems().pipe(
          map((contactItems) => contactItemsLoaded({ contactItems })),
          logAndSkip(),
        )),
      ),
      handleLoadEvents$: events.on(loadEvents).pipe(
        filter(({ payload }) => !(payload.past ? store.eventsLoaded().past : store.eventsLoaded().upcoming)),
        mergeMap(({ payload }) => contentService.loadEvents(payload.past).pipe(
          map((stories) => eventListLoaded({ events: stories, past: payload.past })),
          logAndSkip(),
        )),
      ),
      handleLoadEvent$: events.on(loadEvent).pipe(
        mergeMap(({ payload: { slug } }) => {
          const stored = store.eventBySlug(slug);
          if (stored) {
            return loadEarlierEvents(stored.content);
          }
          return contentService.loadEvent(slug).pipe(
            // The story endpoint returns any story by its slug, not just concerts
            mergeMap((story) => story.content.component === 'Event'
              ? concat(of(eventLoaded({ event: story })), loadEarlierEvents(story.content))
              : of(eventNotFound({ slug }))),
            catchError((error: unknown) => {
              if (error instanceof HttpErrorResponse && error.status === 404) {
                return of(eventNotFound({ slug }));
              }
              console.error(error);
              return EMPTY;
            }),
          );
        }),
      ),
    };
  }),
);
