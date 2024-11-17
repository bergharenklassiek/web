import { Component, Input } from '@angular/core';
import { Event } from '../../../core/models/event';
import { StoryBlokUrlPipe } from '../../../core/pipes/story-blok-url.pipe';
import { RouterModule } from '@angular/router';
import { Story } from '../../../core/models/story';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [ StoryBlokUrlPipe, RouterModule, AppDatePipe ],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss'
})
export class EventCardComponent {
  @Input() story!: Story<Event>;
  @Input() cardIndex!: number;
}
