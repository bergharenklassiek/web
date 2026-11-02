// import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { AfterViewInit, Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, ElementRef, inject, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { SwiperOptions } from 'swiper/types';
import { StoryBlokImagePipe } from '../../../core/pipes/story-blok-image.pipe';
import { richTextToDescription } from '../../../core/seo/page-seo';
import { SeoService } from '../../../core/seo/seo.service';
import { loadContentPage } from '../../../core/store/content.events';
import { ContentStore } from '../../../core/store/content.store';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';

@Component({
    selector: 'app-content-page',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [RichTextComponent, StoryBlokImagePipe],
    templateUrl: './content-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
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

  private readonly store = inject(ContentStore);
  private readonly dispatcher = inject(Dispatcher);
  private readonly seo = inject(SeoService);

  slug = inject(Router).url.replace('/','');
  contentPage = computed(() => this.store.contentPageBySlug(this.slug));

  constructor() {
    effect(() => {
      const page = this.contentPage();
      if (page) {
        this.seo.update({
          title: page.content.title,
          description: richTextToDescription(page.content.description),
          path: `/${this.slug}/`,
        });
      }
    });
  }

  ngOnInit(): void {
    this.dispatcher.dispatch(loadContentPage({ slug: this.slug }));
  }

  ngAfterViewInit(): void {
    if (this.swiperRef?.nativeElement) {
      Object.assign(this.swiperRef?.nativeElement, this.swiperConfig);
      // this.breakpointObserver.observe('(max-width: 900px)').pipe(
      //   withLatestFrom(this.contentPage$),
      //   filter(([, contentPage]) => !!contentPage),
      //   tap(([state, contentPage]) => Object.assign(this.swiperRef?.nativeElement, {
      //     ...this.swiperConfig, 
      //     slidesPerView: state.matches ? 1 : (contentPage?.content?.images?.length ?? 0) > 1 ? 2 : 1
      //   }))
      // );
    }
  }
}
