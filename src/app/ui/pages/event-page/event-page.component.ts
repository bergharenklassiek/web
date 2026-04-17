// import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { filter, map, Observable } from 'rxjs';
import { SwiperOptions } from 'swiper/types';
import { Event } from '../../../core/models/event';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';
import { StoryBlokImagePipe } from '../../../core/pipes/story-blok-image.pipe';
import { ContentService } from '../../../core/services/content.service';
import { loadEvent } from '../../../core/store/content.actions';
import { selectEvent } from '../../../core/store/content.selectors';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';

@Component({
    selector: 'app-event-page',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [RichTextComponent, StoryBlokImagePipe, AppDatePipe, AsyncPipe,],
    providers: [AppDatePipe],
    templateUrl: './event-page.component.html',
    styleUrl: './event-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventPageComponent implements OnInit, AfterViewInit {
  appDatePipe = inject(AppDatePipe);

  @ViewChild('swiperRef') swiperRef: ElementRef | undefined;
  swiperConfig: SwiperOptions = {
    autoplay: true,
    navigation: true,
    slidesPerView: 1,
    spaceBetween: 15,
  } 

  event?: Event;
  event$?: Observable<Event | undefined>;
  reservationLink$?: Observable<string>;
  
  constructor(
    private route: ActivatedRoute, 
    // private contentService: ContentService, 
    // private breakpointObserver: BreakpointObserver,
    // private meta: Meta,
    private store: Store
  ) {}
  
  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('event-slug')!;
    this.store.dispatch(loadEvent({ eventSlug: slug }));
    this.event$ = this.store.pipe(select(selectEvent(slug)));
    this.reservationLink$ = this.event$.pipe(
      filter((event): event is Event => !!event),
      map(event => {
        const subject = `Reservering voor ${event.title}`;
        const body = `Hallo,\n\nIk wil graag een reservering maken voor het concert: ${event.title} op ${this.appDatePipe.transform(event.date)} voor [aantal personen] personen.\n\nMet vriendelijke groet,\n[Je naam]`;
        return `mailto:kees_joosse@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      })
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
