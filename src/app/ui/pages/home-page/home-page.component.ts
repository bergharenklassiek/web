import { Component, inject, OnInit } from '@angular/core';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { ContentService } from '../../../core/services/content.service';
import { Dispatcher } from '@ngrx/signals/events';
import { ContentStore } from '../../../core/store-v2/content.store';
import { loadHomePage } from '../../../core/store-v2/content.events';
import { ReservationButtonComponent } from '../../components/reservation-button/reservation-button.component';

@Component({
    selector: 'app-home-page',
    imports: [EventCardComponent, RichTextComponent, ReservationButtonComponent],
    templateUrl: './home-page.component.html',
    styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  private contentStore = inject(ContentStore);
  private dispatcher = inject(Dispatcher);
  private readonly contentService = inject(ContentService);
  
  homePage = this.contentStore.homePage;
  events = this.contentService.events;
  
  ngOnInit(): void {
    this.dispatcher.dispatch(loadHomePage());
  }
}
