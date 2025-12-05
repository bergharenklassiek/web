import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
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
    imports: [RichTextComponent, StoryBlokImagePipe, LayoutModule, AppDatePipe, AsyncPipe],
    templateUrl: './event-page.component.html',
    styleUrl: './event-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventPageComponent implements OnInit, AfterViewInit {
  @ViewChild('swiperRef') swiperRef: ElementRef | undefined;
  swiperConfig: SwiperOptions = {
    autoplay: true,
    navigation: true,
    slidesPerView: 1,
    spaceBetween: 15,
  } 

  event?: Event;
  event$?: Observable<Event | undefined>;
  
  constructor(
    private route: ActivatedRoute, 
    private contentService: ContentService, 
    private breakpointObserver: BreakpointObserver,
    private meta: Meta,
    private store: Store
  ) {}
  
  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('event-slug')!;
    this.store.dispatch(loadEvent({ eventSlug: slug }));
    this.event$ = this.store.pipe(select(selectEvent(slug)));
    // this.meta.updateTag({ name: 'description', content: this.event?.summary });
  }
  
  ngAfterViewInit(): void {
    if (this.swiperRef?.nativeElement) {
      Object.assign(this.swiperRef?.nativeElement, this.swiperConfig);
      this.breakpointObserver.observe('(max-width: 900px)').subscribe(state => {
        Object.assign(this.swiperRef?.nativeElement, {
          ...this.swiperConfig, 
          slidesPerView: state.matches ? 1 : (this.event?.images?.length ?? 0) > 1 ? 2 : 1
        })
      });
    }
  }
}
