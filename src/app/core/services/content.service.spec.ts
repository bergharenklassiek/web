import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { makeStateKey, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Event } from '../models/event';
import { Story } from '../models/story';
import { ContentService } from './content.service';

describe('ContentService', () => {
  const UPCOMING_KEY = makeStateKey<Story<Event>[]>('upcomingEvents');
  const story = (id: string): Story<Event> => ({ id, slug: id, content: {} as Event });

  let service: ContentService;
  let http: HttpTestingController;
  let transferState: TransferState;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ContentService);
    http = TestBed.inject(HttpTestingController);
    transferState = TestBed.inject(TransferState);
  });

  afterEach(() => http.verify());

  it('should not request anything until asked', () => {
    http.expectNone(() => true);
  });

  it('should unwrap single stories', () => {
    const results: unknown[] = [];
    service.homePage().subscribe((r) => results.push(r));
    service.loadAboutPage().subscribe((r) => results.push(r));
    service.loadContentPage('gebouw').subscribe((r) => results.push(r));
    service.loadEvent('concert').subscribe((r) => results.push(r));

    http.expectOne((r) => r.url.includes('/stories/home')).flush({ story: { id: 'home' } });
    http.expectOne((r) => r.url.includes('/stories/about')).flush({ story: { id: 'about' } });
    http.expectOne((r) => r.url.includes('/stories/gebouw')).flush({ story: { id: 'gebouw' } });
    http.expectOne((r) => r.url.includes('/stories/concert')).flush({ story: { id: 'concert' } });

    expect(results).toEqual([{ id: 'home' }, { id: 'about' }, { id: 'gebouw' }, { id: 'concert' }]);
  });

  it('should unwrap the contact items', () => {
    let items: unknown;
    service.loadContactItems().subscribe((r) => (items = r));

    http.expectOne((r) => r.url.includes('content_type=ContactItem')).flush({ stories: [{ id: 'a' }] });

    expect(items).toEqual([{ id: 'a' }]);
  });

  describe('loadEvents', () => {
    it('should request upcoming events from today, soonest first', () => {
      service.loadEvents().subscribe();
      const today = new Date().toISOString().split('T')[0];

      const request = http.expectOne((r) => r.url.includes('content_type=Event'));

      expect(request.request.url).toContain('sort_by=content.date:asc');
      expect(request.request.url).toContain(`filter_query[date][gt_date]=${today}`);
      request.flush({ stories: [] }, { headers: { total: '0' } });
    });

    it('should request past events, newest first', () => {
      service.loadEvents(true).subscribe();

      const request = http.expectOne((r) => r.url.includes('content_type=Event'));

      expect(request.request.url).toContain('sort_by=content.date:desc');
      expect(request.request.url).toContain('filter_query[date][lt_date]=');
      request.flush({ stories: [] }, { headers: { total: '0' } });
    });

    it('should fetch every page and combine them', () => {
      let events: Story<Event>[] = [];
      service.loadEvents(true).subscribe((r) => (events = r));

      http.expectOne((r) => r.url.includes('page=1&')).flush({ stories: [story('1')] }, { headers: { total: '250' } });
      http.expectOne((r) => r.url.includes('page=2&')).flush({ stories: [story('2')] });
      http.expectOne((r) => r.url.includes('page=3&')).flush({ stories: [story('3')] });

      expect(events.map((e) => e.id)).toEqual(['1', '2', '3']);
    });

    it('should keep the list out of the HTTP transfer cache, because the transfer state holds it', () => {
      service.loadEvents(true).subscribe();
      const first = http.expectOne((r) => r.url.includes('page=1&'));
      first.flush({ stories: [] }, { headers: { total: '150' } });
      const second = http.expectOne((r) => r.url.includes('page=2&'));
      second.flush({ stories: [] });

      expect(first.request.transferCache).toBe(false);
      expect(second.request.transferCache).toBe(false);
    });

    it('should save the list for the browser', () => {
      service.loadEvents().subscribe();

      http.expectOne((r) => r.url.includes('content_type=Event')).flush({ stories: [story('1')] }, { headers: { total: '1' } });

      expect(transferState.get(UPCOMING_KEY, undefined)?.map((e) => e.id)).toEqual(['1']);
    });

    it('should first emit the list from the server, then the fresh one', () => {
      transferState.set(UPCOMING_KEY, [story('rendered')]);
      const emitted: string[][] = [];
      service.loadEvents().subscribe((r) => emitted.push(r.map((e) => e.id)));

      expect(emitted).toEqual([['rendered']]);

      http.expectOne((r) => r.url.includes('content_type=Event')).flush({ stories: [story('fresh')] }, { headers: { total: '1' } });

      expect(emitted).toEqual([['rendered'], ['fresh']]);
    });
  });

  it('should request earlier events by the same artists', () => {
    let events: Story<Event>[] = [];
    service.loadEarlierEventsByArtists(['a', 'b'], '2026-11-22 16:00').subscribe((r) => (events = r));

    const request = http.expectOne((r) => r.url.includes('any_in_array'));

    expect(request.request.url).toContain('filter_query[artists][any_in_array]=a,b');
    expect(request.request.url).toContain('filter_query[date][lt_date]=2026-11-22%2016%3A00');
    request.flush({ stories: [story('1')] });
    expect(events.map((e) => e.id)).toEqual(['1']);
  });
});
