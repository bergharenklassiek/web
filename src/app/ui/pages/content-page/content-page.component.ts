import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { StoryBlokImagePipe } from '../../../core/pipes/story-blok-image.pipe';
import { richTextToDescription } from '../../../core/seo/page-seo';
import { SeoService } from '../../../core/seo/seo.service';
import { loadContentPage } from '../../../core/store/content.events';
import { ContentStore } from '../../../core/store/content.store';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { photoCarouselOptions, SwiperDirective } from '../../directives/swiper.directive';

@Component({
    selector: 'app-content-page',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [RichTextComponent, StoryBlokImagePipe, SwiperDirective],
    templateUrl: './content-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './content-page.component.scss'
})
export class ContentPageComponent implements OnInit {
  carouselOptions = photoCarouselOptions;
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
}
