import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, Component, ChangeDetectionStrategy } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { mergeMap } from 'rxjs';
import { displayPastEvents, loadEvents } from '../../../core/store/content.actions';
import { ContentState } from '../../../core/store/content.reducer';
import { selectDisplayPastEvents, selectEvents } from '../../../core/store/content.selectors';
import { EventListItemComponent } from '../../components/event-list-item/event-list-item.component';

@Component({
    selector: 'app-agenda-page',
    standalone: true,
    imports: [EventListItemComponent, AsyncPipe],
    templateUrl: './agenda-page.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
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
  }
}
