import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { HomePage } from '../models/home-page';
import { Event } from '../models/event';
import { Story } from '../models/story';
import { ContactItem } from '../models/contact-item';
import { AboutPage } from '../models/about-page';
import { ContentPage } from '../models/content-page';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private storyblokBaseUrl = 'https://api.storyblok.com/v2/cdn';
  private token = 'token=acu9a7B7tQrUQ6dr0rQTqgtt';

  aboutPage = signal<AboutPage>({} as AboutPage);
  contentPages = signal<Story<ContentPage>[]>([]);

  constructor(private http: HttpClient) { }

  loadData(): void {
    this.http
      .get<{ story: Story<AboutPage> }>(`${this.storyblokBaseUrl}/stories/about?${this.token}`)
      .subscribe(response => this.aboutPage.set(response.story.content));

    this.http
      .get<{ stories: Story<ContentPage>[] }>(`${this.storyblokBaseUrl}/stories?content_type=ContentPage&${this.token}`)
      .subscribe(response => this.contentPages.set(response.stories));
  }

  loadHomePage(): Observable<Story<HomePage>> {
    return this.http
      .get<{ story: Story<HomePage> }>(`${this.storyblokBaseUrl}/stories/home?${this.token}`)
      .pipe(map((response) => response.story));
  }

  loadContactItems(): Observable<Story<ContactItem>[]> {
    return this.http
      .get<{ stories: Story<ContactItem>[] }>(`${this.storyblokBaseUrl}/stories?content_type=ContactItem&${this.token}`)
      .pipe(map((response) => response.stories));
  }

  loadEvent(slug: string): Observable<Story<Event>> {
    return this.http
      .get<{ story: Story<Event> }>(`${this.storyblokBaseUrl}/stories/${slug}?${this.token}`)
      .pipe(map((response) => response.story));
  }

  loadEvents(past: boolean = false): Observable<Story<Event>[]> {
    return this.http
      .get<{ stories: Story<Event>[] }>(`${this.storyblokBaseUrl}/stories?content_type=Event&sort_by=content.date:${past ? 'desc' : 'asc'}&filter_query[date][${ past ? 'lt_date' : 'gt_date' }]=${new Date().toISOString().split('T')[0]}&${this.token}`)
      .pipe(map((response) => response.stories));
  }
}
