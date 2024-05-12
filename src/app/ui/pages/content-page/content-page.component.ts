import { AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';
import { Router } from '@angular/router';
import { ContentPage } from '../../../core/models/content-page';
import { Story } from '../../../core/models/story';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { SwiperOptions } from 'swiper/types';
import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { StoryBlokUrlPipe } from '../../../core/pipes/story-blok-url.pipe';

@Component({
  selector: 'app-content-page',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [RichTextComponent, StoryBlokUrlPipe, LayoutModule],
  templateUrl: './content-page.component.html',
  styleUrl: './content-page.component.scss'
})
export class ContentPageComponent implements OnInit, AfterViewInit {
  @ViewChild('swiperRef') swiperRef: ElementRef | undefined;
  swiperConfig: SwiperOptions = {
    autoplay: true,
    navigation: true,
    slidesPerView: 1,
    spaceBetween: 15,
  } 

  contentPage?: Story<ContentPage>;

  constructor(private contentService: ContentService, private router: Router, private breakpointObserver: BreakpointObserver) {}
  
  ngOnInit(): void {
    this.contentPage = this.contentService.contentPages().find(p => p.slug === this.router.url.replace('/',''));
  }

  ngAfterViewInit(): void {
    if (this.swiperRef?.nativeElement) {
      Object.assign(this.swiperRef?.nativeElement, this.swiperConfig);
      this.breakpointObserver.observe('(max-width: 900px)').subscribe(state => {
        Object.assign(this.swiperRef?.nativeElement, {
          ...this.swiperConfig, 
          slidesPerView: state.matches ? 1 : (this.contentPage?.content?.images?.length ?? 0) > 1 ? 2 : 1
        })
      });
    }
  }
}
