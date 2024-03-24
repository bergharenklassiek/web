import { AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoryBlokUrlPipe } from '../../../core/pipes/story-blok-url.pipe';
import { ContentService } from '../../../core/services/content.service';
import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { SwiperOptions } from 'swiper/types';

@Component({
  selector: 'app-event-page',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [RichTextComponent, CommonModule, StoryBlokUrlPipe, LayoutModule ],
  templateUrl: './event-page.component.html',
  styleUrl: './event-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventPageComponent implements AfterViewInit {
  @ViewChild('swiperRef') swiperRef: ElementRef | undefined;

  event = this.contentService.events().find(s => s.slug == this.route.snapshot.paramMap.get('event-slug'))?.content;
  isSmallScreen?: boolean;

  swiperConfig: SwiperOptions = {
    autoplay: true,
    navigation: true,
    slidesPerView: 1,
    spaceBetween: 15,
  } 

  constructor(private route: ActivatedRoute, private contentService: ContentService, private breakpointObserver: BreakpointObserver) {}
  
  ngAfterViewInit(): void {
    Object.assign(this.swiperRef?.nativeElement, this.swiperConfig);
    this.breakpointObserver.observe('(max-width: 900px)').subscribe(state => {
      Object.assign(this.swiperRef?.nativeElement, {
        ...this.swiperConfig, 
        slidesPerView: state.matches ? 1 : 2
      })
    });
  }
}
