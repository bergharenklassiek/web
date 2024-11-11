import { ChangeDetectionStrategy, Component, afterNextRender } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { scrollLeftKey, scrollListKey } from '../../../app.config';
import { AsyncPipe, NgClass } from '@angular/common';
import { Observable } from 'rxjs';
import { Event } from '../../../core/models/event';
import { Story } from '../../../core/models/story';
import { select, Store } from '@ngrx/store';
import { selectEvents, selectHomePage } from '../../../core/store/content.selectors';
import { HomePage } from '../../../core/models/home-page';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [EventCardComponent, RichTextComponent, NgClass, AsyncPipe],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent {
  homePage$?: Observable<Story<HomePage> | undefined>;
  events$?: Observable<Story<Event>[] | undefined>;
  
  constructor(private store: Store) {
    this.events$ = this.store.pipe(select(selectEvents(false)));
    this.homePage$ = this.store.pipe(select(selectHomePage));
    
    afterNextRender(() => {
      const scrollLeft = localStorage?.getItem(scrollLeftKey);
      document.getElementById(scrollListKey)?.scrollTo({ left: parseInt(scrollLeft ?? '0') });
    });
  }
  
  onScroll(_: any) {
    localStorage.setItem(scrollLeftKey, (document.getElementById(scrollListKey)?.scrollLeft ?? 0).toString());
  }
}
