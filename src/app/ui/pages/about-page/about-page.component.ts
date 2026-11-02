import { Component, DestroyRef, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { select, Store } from '@ngrx/store';
import { loadAboutPage } from '../../../core/store/content.actions';
import { selectAboutPage } from '../../../core/store/content.selectors';
import { filter, Observable } from 'rxjs';
import { richTextToDescription } from '../../../core/seo/page-seo';
import { SeoService } from '../../../core/seo/seo.service';
import { AboutPage } from '../../../core/models/about-page';
import { Story } from '../../../core/models/story';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-about-page',
    standalone: true,
    imports: [RichTextComponent, AsyncPipe],
    templateUrl: './about-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './about-page.component.scss'
})
export class AboutPageComponent implements OnInit {
  aboutPage$: Observable<Story<AboutPage> | undefined> = this.store.pipe(select(selectAboutPage));

  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(loadAboutPage());
    this.aboutPage$.pipe(filter((page) => !!page), takeUntilDestroyed(this.destroyRef)).subscribe((page) => this.seo.update({
      title: page.content.title,
      description: richTextToDescription(page.content.description),
      path: '/over-ons/',
    }));
  }
}
