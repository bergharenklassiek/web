// import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { filter, map, Observable, switchMap } from 'rxjs';
import { SwiperOptions } from 'swiper/types';
import { Event } from '../../../core/models/event';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';
import { StoryBlokImagePipe } from '../../../core/pipes/story-blok-image.pipe';
import { loadEvent } from '../../../core/store/content.actions';
import { selectEarlierEventsByArtists, selectEvent } from '../../../core/store/content.selectors';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { ReservationLinkService } from '../../../core/services/reservation-link.service';
import { Story } from '../../../core/models/story';
import { EventListItemComponent } from '../../components/event-list-item/event-list-item.component';

@Component({
    selector: 'app-event-page',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [RichTextComponent, EventListItemComponent, StoryBlokImagePipe, AppDatePipe, AsyncPipe,],
    templateUrl: './event-page.component.html',
    styleUrl: './event-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventPageComponent implements OnInit, AfterViewInit {
  reservationLinkService = inject(ReservationLinkService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('swiperRef') swiperRef: ElementRef | undefined;
  swiperConfig: SwiperOptions = {
    autoplay: true,
    observer: true,
    navigation: true,
    slidesPerView: 1,
    spaceBetween: 15,
  } 

  event?: Event;
  event$?: Observable<Event | undefined>;
  reservationLink$?: Observable<string>;
  isPast$?: Observable<boolean>;
  earlierEvents$?: Observable<Story<Event>[]>;
  
  constructor(
    private route: ActivatedRoute, 
    // private contentService: ContentService, 
    // private breakpointObserver: BreakpointObserver,
    // private meta: Meta,
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

    // this.meta.updateTag({ name: 'description', content: this.event?.summary });
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
