import { Component, OnInit } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';
import { StoryBlokUrlPipe } from '../../../core/pipes/story-blok-url.pipe';
import { RouterModule } from '@angular/router';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';
import { select, Store } from '@ngrx/store';
import { loadEvents } from '../../../core/store/content.actions';
import { selectEvents } from '../../../core/store/content.selectors';
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
  events$?: Observable<Story<Event>[]>;
  showPastEvents = false;

  constructor(private store: Store<ContentState>) {}

  ngOnInit(): void {
    this.events$ = this.store.pipe(select(selectEvents(this.showPastEvents)));
  }
  
  onClick(showPastEvents: boolean) {
    this.showPastEvents = showPastEvents;
    if (this.showPastEvents) {
      this.store.dispatch(loadEvents({ loadPast: this.showPastEvents }));
      this.events$ = this.store.pipe(select(selectEvents(this.showPastEvents)));
    }
  }
}
