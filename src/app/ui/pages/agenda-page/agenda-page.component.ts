import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';
import { StoryBlokUrlPipe } from '../../../core/pipes/story-blok-url.pipe';
import { RouterModule } from '@angular/router';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';
import { select, Store } from '@ngrx/store';
import { displayPastEvents, loadEvents } from '../../../core/store/content.actions';
import { selectDisplayPastEvents, selectEvents } from '../../../core/store/content.selectors';
import { ContentState } from '../../../core/store/content.reducer';
import { map, mergeMap, Observable, withLatestFrom } from 'rxjs';
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
export class AgendaPageComponent {
  showPastEvents$ = this.store.select(selectDisplayPastEvents);
  events$ = this.store.select(selectDisplayPastEvents).pipe(
    mergeMap(displayPastEvents => this.store.select(selectEvents(displayPastEvents)))
  );

  constructor(private store: Store<ContentState>, private cdRef: ChangeDetectorRef) {}
  
  onClick(showPastEvents: boolean) {
    this.store.dispatch(displayPastEvents({ displayPastEvents: showPastEvents }));
    this.store.dispatch(loadEvents({ loadPast: showPastEvents }));
    this.events$ = this.store.pipe(select(selectEvents(showPastEvents)));
    this.cdRef.detectChanges();
  }
}
