// import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, ElementRef, inject, OnInit, RESPONSE_INIT, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { filter, map, Observable, switchMap, take } from 'rxjs';
import { SwiperOptions } from 'swiper/types';
import { Event } from '../../../core/models/event';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';
import { StoryBlokImagePipe } from '../../../core/pipes/story-blok-image.pipe';
import { loadEvent } from '../../../core/store/content.actions';
import { selectEarlierEventsByArtists, selectEvent, selectEventId, selectEventNotFound } from '../../../core/store/content.selectors';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { ReservationLinkService } from '../../../core/services/reservation-link.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { ReservationDialogComponent, ReservationDialogData, reservationDialogConfig } from '../../components/reservation-dialog/reservation-dialog.component';
import { Story } from '../../../core/models/story';
import { eventSeo } from '../../../core/seo/page-seo';
import { SeoService } from '../../../core/seo/seo.service';
import { EventListItemComponent } from '../../components/event-list-item/event-list-item.component';

@Component({
    selector: 'app-event-page',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [RichTextComponent, EventListItemComponent, StoryBlokImagePipe, AppDatePipe, AsyncPipe, RouterLink],
    templateUrl: './event-page.component.html',
    styleUrl: './event-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventPageComponent implements OnInit, AfterViewInit {
  reservationLinkService = inject(ReservationLinkService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private readonly seo = inject(SeoService);
  // Only set while rendering on the server
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });
  readonly reservationsEnabled = inject(ReservationService).enabled;

  @ViewChild('swiperRef') swiperRef: ElementRef | undefined;
  swiperConfig: SwiperOptions = {
    autoplay: true,
    observer: true,
    pagination: { clickable: true },
    // Hides the dots when there's only one photo
    watchOverflow: true,
    slidesPerView: 1,
    spaceBetween: 15,
  } 

  event?: Event;
  event$?: Observable<Event | undefined>;
  reservationLink$?: Observable<string>;
  isPast$?: Observable<boolean>;
  earlierEvents$?: Observable<Story<Event>[]>;
  notFound$?: Observable<boolean>;
  
  constructor(
    private route: ActivatedRoute, 
    // private contentService: ContentService, 
    // private breakpointObserver: BreakpointObserver,
    private store: Store
  ) {}
  
  ngOnInit(): void {
    // The component is reused when navigating between events, so follow slug changes instead of reading the snapshot
    const slug$ = this.route.paramMap.pipe(map(params => params.get('event-slug')!));
    slug$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(slug => this.store.dispatch(loadEvent({ eventSlug: slug })));
    this.event$ = slug$.pipe(switchMap(slug => this.store.pipe(select(selectEvent(slug)))));
    this.earlierEvents$ = slug$.pipe(switchMap(slug => this.store.pipe(select(selectEarlierEventsByArtists(slug)))));
    this.reservationLink$ = this.event$.pipe(
      filter((event): event is Event => !!event),
      map(event => this.reservationLinkService.formatReservationLink(event))
    );
    this.isPast$ = this.event$.pipe(
      filter((event): event is Event => !!event),
      map(event => Date.parse(event.date) < Date.now())
    );

    slug$.pipe(
      switchMap(slug => this.store.pipe(
        select(selectEvent(slug)),
        filter((event): event is Event => !!event),
        map(event => eventSeo(slug, event))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(seo => this.seo.update(seo));

    this.notFound$ = slug$.pipe(switchMap(slug => this.store.pipe(select(selectEventNotFound(slug)))));
    this.notFound$.pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.responseInit) {
        this.responseInit.status = 404;
      }
      this.seo.update({ title: 'Concert niet gevonden', noindex: true });
    });
  }
  
  openReservation(event: Event): void {
    const slug = this.route.snapshot.paramMap.get('event-slug')!;
    this.store.select(selectEventId(slug)).pipe(take(1)).subscribe(id => {
      const data: ReservationDialogData = {
        event: { id: String(id), title: event.title, date: event.date, location: event.location },
      };
      this.dialog.open(ReservationDialogComponent, { ...reservationDialogConfig, data });
    });
  }

  ngAfterViewInit(): void {
    if (this.swiperRef?.nativeElement) {
      Object.assign(this.swiperRef?.nativeElement, this.swiperConfig);
      // this.breakpointObserver.observe('(max-width: 900px)').subscribe(state => {
      //   Object.assign(this.swiperRef?.nativeElement, {
      //     ...this.swiperConfig, 
      //     slidesPerView: state.matches ? 1 : (this.event?.images?.length ?? 0) > 1 ? 2 : 1
      //   })
      // });
    }
  }
}
