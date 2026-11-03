import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BackNextYearTileComponent } from '../../components/back-next-year-tile/back-next-year-tile.component';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { Dispatcher } from '@ngrx/signals/events';
import { ContentStore } from '../../../core/store/content.store';
import { loadHomePage } from '../../../core/store/content.events';
import { SeoService } from '../../../core/seo/seo.service';
import { ReservationButtonComponent } from '../../components/reservation-button/reservation-button.component';
import { YoutubeVideoComponent } from '../../components/youtube-video/youtube-video.component';

@Component({
    selector: 'app-home-page',
    imports: [BackNextYearTileComponent, EventCardComponent, RichTextComponent, ReservationButtonComponent, YoutubeVideoComponent],
    templateUrl: './home-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  private contentStore = inject(ContentStore);
  private dispatcher = inject(Dispatcher);
  private readonly seo = inject(SeoService);
  
  homePage = this.contentStore.homePage;
  events = this.contentStore.upcomingEventsWhenLoaded;
  
  ngOnInit(): void {
    this.seo.update({ path: '/' });
    this.dispatcher.dispatch(loadHomePage());
  }
}
