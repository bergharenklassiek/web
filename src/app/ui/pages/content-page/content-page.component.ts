import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { filter, Observable, tap, withLatestFrom } from 'rxjs';
import { SwiperOptions } from 'swiper/types';
import { ContentPage } from '../../../core/models/content-page';
import { Story } from '../../../core/models/story';
import { StoryBlokImagePipe } from '../../../core/pipes/story-blok-image.pipe';
import { loadContentPage } from '../../../core/store/content.actions';
import { selectContentPage } from '../../../core/store/content.selectors';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';

@Component({
    selector: 'app-content-page',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [RichTextComponent, StoryBlokImagePipe, LayoutModule, AsyncPipe],
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

  slug = this.router.url.replace('/','');
  contentPage$: Observable<Story<ContentPage> | undefined> = this.store.pipe(select(selectContentPage(this.slug)));;

  constructor(private store: Store, private router: Router, private breakpointObserver: BreakpointObserver) {}
  
  ngOnInit(): void {
    const slug = this.router.url.replace('/','');
    this.store.dispatch(loadContentPage({ contentPageSlug: slug }));
  }

  ngAfterViewInit(): void {
    if (this.swiperRef?.nativeElement) {
      Object.assign(this.swiperRef?.nativeElement, this.swiperConfig);
      this.breakpointObserver.observe('(max-width: 900px)').pipe(
        withLatestFrom(this.contentPage$),
        filter(([, contentPage]) => !!contentPage),
        tap(([state, contentPage]) => Object.assign(this.swiperRef?.nativeElement, {
          ...this.swiperConfig, 
          slidesPerView: state.matches ? 1 : (contentPage?.content?.images?.length ?? 0) > 1 ? 2 : 1
        }))
      );
    }
  }
}
