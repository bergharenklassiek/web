import { Component, inject } from '@angular/core';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { AsyncPipe } from '@angular/common';
import { select, Store } from '@ngrx/store';
import { selectEvents, selectHomePage } from '../../../core/store/content.selectors';

@Component({
    selector: 'app-home-page',
    imports: [EventCardComponent, RichTextComponent, AsyncPipe],
    templateUrl: './home-page.component.html',
    styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly store = inject(Store);

  events$ = this.store.pipe(select(selectEvents(false)));
  homePage$ = this.store.pipe(select(selectHomePage));
}
