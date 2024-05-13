import { AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { ActivatedRoute } from '@angular/router';
import { StoryBlokUrlPipe } from '../../../core/pipes/story-blok-url.pipe';
import { ContentService } from '../../../core/services/content.service';
import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { SwiperOptions } from 'swiper/types';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';
import { Event } from '../../../core/models/event';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-event-page',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [RichTextComponent, StoryBlokUrlPipe, LayoutModule, AppDatePipe ],
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
  
  constructor(
    private route: ActivatedRoute, 
    private contentService: ContentService, 
    private breakpointObserver: BreakpointObserver,
    private meta: Meta
  ) {}
  
  ngOnInit(): void {
    this.event = this.contentService.getEvent(this.route.snapshot.paramMap.get('event-slug')!);
    this.meta.updateTag({ name: 'description', content: this.event?.summary });
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
