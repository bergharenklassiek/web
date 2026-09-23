import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { HomePage } from '../models/home-page';
import { Event } from '../models/event';
import { Story } from '../models/story';
import { ContactItem } from '../models/contact-item';
import { AboutPage } from '../models/about-page';
import { ContentPage } from '../models/content-page';
import { forkJoin, map, mergeMap, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private readonly http = inject(HttpClient);

  private storyblokBaseUrl = 'https://api.storyblok.com/v2/cdn';
  private token = 'token=acu9a7B7tQrUQ6dr0rQTqgtt';

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

    return this.http
      .get<{ stories: Story<Event>[] }>(url(1), { observe: 'response' })
      .pipe(
        mergeMap((response) => {
          const stories = response.body?.stories ?? [];
          const pages = Math.ceil(Number(response.headers.get('total') ?? 0) / perPage);
          if (pages <= 1) {
            return of(stories);
          }
          const remaining = Array.from({ length: pages - 1 }, (_, i) =>
            this.http.get<{ stories: Story<Event>[] }>(url(i + 2)).pipe(map((r) => r.stories))
          );
          return forkJoin(remaining).pipe(map((rest) => stories.concat(...rest)));
        })
      );
  }

  eventsResource = httpResource<{ stories: Story<Event>[] }>(() => `${this.storyblokBaseUrl}/stories?content_type=Event&sort_by=content.date:asc&filter_query[date][gt_date]=${new Date().toISOString().split('T')[0]}&${this.token}`);
  events = computed(() => this.eventsResource.value()?.stories);
}
