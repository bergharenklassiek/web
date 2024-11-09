import { Component, OnInit } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';
import { StoryBlokUrlPipe } from '../../../core/pipes/story-blok-url.pipe';
import { RouterModule } from '@angular/router';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';
import { select, Store } from '@ngrx/store';
import { loadPastEvents } from '../../../core/store/content.actions';
import { selectPastEvents } from '../../../core/store/content.selectors';
import { ContentState } from '../../../core/store/content.reducer';
import { Observable } from 'rxjs';
import { Story } from '../../../core/models/story';
import { Event } from '../../../core/models/event';
import { AsyncPipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  imports: [StoryBlokUrlPipe, AppDatePipe, RouterModule, AsyncPipe, NgClass],
  templateUrl: './agenda-page.component.html',
  styleUrl: './agenda-page.component.scss'
})
export class AgendaPageComponent implements OnInit {
  stories = this.contentService.events;
  pastEvents$?: Observable<Story<Event>[]>;
  showPastEvents = false;

  constructor(private contentService: ContentService, private store: Store<ContentState>) {}

  ngOnInit(): void {
    this.pastEvents$ = this.store.pipe(select(selectPastEvents));
  }
  
  onClick(showPastEvents: boolean) {
    this.showPastEvents = showPastEvents;
    if (showPastEvents) {
      this.store.dispatch(loadPastEvents());
    }
  }
}
