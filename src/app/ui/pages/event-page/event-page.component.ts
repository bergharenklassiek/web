import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, effect, inject, OnInit, RESPONSE_INIT } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { map } from 'rxjs';
import { SwiperOptions } from 'swiper/types';
import { Event } from '../../../core/models/event';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';
import { StoryBlokImagePipe } from '../../../core/pipes/story-blok-image.pipe';
import { loadEvent } from '../../../core/store/content.events';
import { ContentStore } from '../../../core/store/content.store';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { ReservationLinkService } from '../../../core/services/reservation-link.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { ReservationDialogComponent, ReservationDialogData, reservationDialogConfig } from '../../components/reservation-dialog/reservation-dialog.component';
import { eventSeo } from '../../../core/seo/page-seo';
import { SeoService } from '../../../core/seo/seo.service';
import { CalendarEvent } from '../../../core/calendar/calendar';
import { ConcertLinksComponent } from '../../components/concert-links/concert-links.component';
import { EventListItemComponent } from '../../components/event-list-item/event-list-item.component';
import { carouselAutoplay, SwiperDirective } from '../../directives/swiper.directive';

// A new deploy clears Netlify's cache. Without one, edits in Storyblok show up within these times. After 5 minutes, the
// next visitor still gets the cached page while it's refreshed in the background.
const CDN_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=3600';

@Component({
    selector: 'app-event-page',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [RichTextComponent, EventListItemComponent, StoryBlokImagePipe, AppDatePipe, RouterLink, ConcertLinksComponent, SwiperDirective],
    templateUrl: './event-page.component.html',
    styleUrl: './event-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventPageComponent implements OnInit {
  reservationLinkService = inject(ReservationLinkService);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ContentStore);
  private readonly dispatcher = inject(Dispatcher);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private readonly seo = inject(SeoService);
  // Only set while rendering on the server
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });
  readonly reservationsEnabled = inject(ReservationService).enabled;

  swiperConfig: SwiperOptions = {
    autoplay: carouselAutoplay,
    observer: true,
    pagination: { clickable: true },
    // Hides the dots when there's only one photo
    watchOverflow: true,
    slidesPerView: 1,
    spaceBetween: 15,
  } 

  // The component is reused when navigating between events, so follow slug changes instead of reading the snapshot
  private readonly slug$ = this.route.paramMap.pipe(map(params => params.get('event-slug')!));
  private readonly slug = toSignal(this.slug$, { requireSync: true });

  private readonly story = computed(() => this.store.eventBySlug(this.slug()));
  event = computed(() => this.story()?.content);
  notFound = computed(() => this.store.isEventMissing(this.slug()));
  isPast = computed(() => {
    const event = this.event();
    return !!event && Date.parse(event.date) < Date.now();
  });
  reservationLink = computed(() => {
    const event = this.event();
    return event ? this.reservationLinkService.formatReservationLink(event) : '';
  });
  earlierEvents = computed(() => {
    const event = this.event();
    return event ? this.store.earlierEventsOf(event) : [];
  });
  calendarEvent = computed<CalendarEvent | undefined>(() => {
    const event = this.event();
    return event && !this.isPast()
      ? { slug: this.slug(), title: event.title, date: event.date, location: event.location, summary: event.summary }
      : undefined;
  });

  constructor() {
    effect(() => {
      const event = this.event();
      if (event) {
        this.seo.update(eventSeo(this.slug(), event));
        this.allowCdnCaching();
      }
    });
    effect(() => {
      if (this.notFound()) {
        if (this.responseInit) {
          this.responseInit.status = 404;
        }
        this.seo.update({ title: 'Concert niet gevonden', noindex: true });
      }
    });
  }

  // Only for a loaded concert, so a 404 or a failed request to Storyblok doesn't get cached as if it were the page
  private allowCdnCaching(): void {
    if (this.responseInit) {
      const headers = new Headers(this.responseInit.headers);
      headers.set('Netlify-CDN-Cache-Control', CDN_CACHE_CONTROL);
      this.responseInit.headers = headers;
    }
  }

  ngOnInit(): void {
    this.slug$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(slug => this.dispatcher.dispatch(loadEvent({ slug })));
  }

  openReservation(event: Event): void {
    const data: ReservationDialogData = {
      event: { id: String(this.story()!.id), slug: this.slug(), title: event.title, date: event.date, location: event.location },
    };
    this.dialog.open(ReservationDialogComponent, { ...reservationDialogConfig, data });
  }
}
