import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';
import { SeoService } from '../../../core/seo/seo.service';
import { displayPastEvents, loadEvents } from '../../../core/store/content.events';
import { ContentStore } from '../../../core/store/content.store';
import { EventListItemComponent } from '../../components/event-list-item/event-list-item.component';

@Component({
    selector: 'app-agenda-page',
    standalone: true,
    imports: [EventListItemComponent],
    templateUrl: './agenda-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './agenda-page.component.scss'
})
export class AgendaPageComponent {
  private readonly store = inject(ContentStore);
  private readonly dispatcher = inject(Dispatcher);

  showPastEvents = this.store.displayPastEvents;
  events = computed(() => this.showPastEvents() ? this.store.pastEvents() : this.store.upcomingEvents());

  constructor() {
    inject(SeoService).update({
      title: 'Agenda',
      description: 'De agenda van Bergharen Klassiek: alle komende en eerdere concerten in de Protestantse Kerk te Bergharen.',
      path: '/agenda/',
    });
  }

  onClick(showPastEvents: boolean) {
    this.dispatcher.dispatch(displayPastEvents({ display: showPastEvents }));
    this.dispatcher.dispatch(loadEvents({ past: showPastEvents }));
  }
}
