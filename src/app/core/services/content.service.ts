import { HttpClient } from '@angular/common/http';
import { inject, Injectable, makeStateKey, TransferState } from '@angular/core';
import { HomePage } from '../models/home-page';
import { Event } from '../models/event';
import { Story } from '../models/story';
import { ContactItem } from '../models/contact-item';
import { AboutPage } from '../models/about-page';
import { ContentPage } from '../models/content-page';
import { storyblokBaseUrl, storyblokToken } from '../config/storyblok.config';
import { concat, forkJoin, map, mergeMap, Observable, of, tap } from 'rxjs';

// Fixed keys (unlike the request URL, which contains today's date) so a prerendered page can hand its events to the browser
const EVENTS_KEYS = {
  upcoming: makeStateKey<Story<Event>[]>('upcomingEvents'),
  past: makeStateKey<Story<Event>[]>('pastEvents'),
};

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);

  private storyblokBaseUrl = storyblokBaseUrl;
  private token = `token=${storyblokToken}`;

  // homePageResource = httpResource<{ story: Story<HomePage> }>(() => `${this.storyblokBaseUrl}/stories/home?${this.token}`);
  // homePage = computed(() => this.homePageResource.value()?.story);

  homePage(): Observable<Story<HomePage>> {
    console.log('Loading home page content from Storyblok API');
    return this.http
      .get<{ story: Story<HomePage> }>(`${this.storyblokBaseUrl}/stories/home?${this.token}`)
      .pipe(map((response) => response.story));
  }

  loadAboutPage(): Observable<Story<AboutPage>> {
    return this.http
      .get<{ story: Story<AboutPage> }>(`${this.storyblokBaseUrl}/stories/about?${this.token}`)
      .pipe(map((response) => response.story));
  }

  loadContactItems(): Observable<Story<ContactItem>[]> {
    return this.http
      .get<{ stories: Story<ContactItem>[] }>(`${this.storyblokBaseUrl}/stories?content_type=ContactItem&${this.token}`)
      .pipe(map((response) => response.stories));
  }

  loadContentPage(slug: string): Observable<Story<ContentPage>> {
    return this.http
      .get<{ story: Story<ContentPage> }>(`${this.storyblokBaseUrl}/stories/${slug}?content_type=ContentPage&${this.token}`)
      .pipe(map((response) => response.story));
  } 

  loadEvent(slug: string): Observable<Story<Event>> {
    return this.http
      .get<{ story: Story<Event> }>(`${this.storyblokBaseUrl}/stories/${slug}?${this.token}`)
      .pipe(map((response) => response.story));
  }

  loadEvents(past: boolean = false): Observable<Story<Event>[]> {
    // Storyblok paginates results (25 per page by default, max 100), so fetch every page
    const perPage = 100;
    const url = (page: number) => `${this.storyblokBaseUrl}/stories?content_type=Event&sort_by=content.date:${past ? 'desc' : 'asc'}&filter_query[date][${ past ? 'lt_date' : 'gt_date' }]=${new Date().toISOString().split('T')[0]}&per_page=${perPage}&page=${page}&${this.token}`;

    const key = past ? EVENTS_KEYS.past : EVENTS_KEYS.upcoming;
    const fresh$ = this.http
      .get<{ stories: Story<Event>[] }>(url(1), { observe: 'response', transferCache: false })
      .pipe(
        mergeMap((response) => {
          const stories = response.body?.stories ?? [];
          const pages = Math.ceil(Number(response.headers.get('total') ?? 0) / perPage);
          if (pages <= 1) {
            return of(stories);
          }
          const remaining = Array.from({ length: pages - 1 }, (_, i) =>
            this.http.get<{ stories: Story<Event>[] }>(url(i + 2), { transferCache: false }).pipe(map((r) => r.stories))
          );
          return forkJoin(remaining).pipe(map((rest) => stories.concat(...rest)));
        }),
        tap((stories) => this.transferState.set(key, stories))
      );

    // In the browser, first emit the list rendered on the server, so its cards stay in place instead of flashing to the
    // loading state, then the fresh list. The transfer state holds this list, so the HTTP transfer cache doesn't need to:
    // it would add a second copy to the page, and its URL contains the build's date, so it misses on later days anyway.
    const rendered = this.transferState.get(key, undefined);
    return rendered ? concat(of(rendered), fresh$) : fresh$;
  }

  loadEarlierEventsByArtists(artists: string[], beforeDate: string): Observable<Story<Event>[]> {
    const url = `${this.storyblokBaseUrl}/stories?content_type=Event&sort_by=content.date:desc&filter_query[artists][any_in_array]=${artists.join(',')}&filter_query[date][lt_date]=${encodeURIComponent(beforeDate)}&${this.token}`;

    return this.http
      .get<{ stories: Story<Event>[] }>(url)
      .pipe(map((response) => response.stories));
  }
}
