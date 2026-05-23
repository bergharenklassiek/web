import { Component, inject } from '@angular/core';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { Store } from '@ngrx/store';
import { ContentService } from '../../../core/services/content.service';

@Component({
    selector: 'app-home-page',
    imports: [EventCardComponent, RichTextComponent],
    templateUrl: './home-page.component.html',
    styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly store = inject(Store);
  private readonly contentService = inject(ContentService);

  homePage = this.contentService.homePage;
  events = this.contentService.events;
}
