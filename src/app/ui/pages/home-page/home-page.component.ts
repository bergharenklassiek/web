import { ChangeDetectionStrategy, Component, afterNextRender } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { scrollLeftKey, scrollListKey } from '../../../app.config';
import { NgClass, NgFor } from '@angular/common';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [EventCardComponent, RichTextComponent, NgFor, NgClass],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent {
  homePage = this.contentService.homePage;
  stories = this.contentService.events;
  
  constructor(private contentService: ContentService) {
    afterNextRender(() => {
      const scrollLeft = localStorage?.getItem(scrollLeftKey);
      document.getElementById(scrollListKey)?.scrollTo({ left: parseInt(scrollLeft ?? '0') });
    });
  }
  
  onScroll(_: any) {
    localStorage.setItem(scrollLeftKey, (document.getElementById(scrollListKey)?.scrollLeft ?? 0).toString());
  }
}
