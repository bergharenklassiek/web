import { Component, effect, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { richTextToDescription } from '../../../core/seo/page-seo';
import { SeoService } from '../../../core/seo/seo.service';
import { loadAboutPage } from '../../../core/store/content.events';
import { ContentStore } from '../../../core/store/content.store';

@Component({
    selector: 'app-about-page',
    standalone: true,
    imports: [RichTextComponent],
    templateUrl: './about-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './about-page.component.scss'
})
export class AboutPageComponent implements OnInit {
  private readonly dispatcher = inject(Dispatcher);
  private readonly seo = inject(SeoService);

  aboutPage = inject(ContentStore).aboutPage;

  constructor() {
    effect(() => {
      const page = this.aboutPage();
      if (page) {
        this.seo.update({
          title: page.content.title,
          description: richTextToDescription(page.content.description),
          path: '/over-ons/',
        });
      }
    });
  }

  ngOnInit(): void {
    this.dispatcher.dispatch(loadAboutPage());
  }
}
