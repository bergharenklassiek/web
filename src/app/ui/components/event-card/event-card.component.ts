import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Event } from '../../../core/models/event';
import { Story } from '../../../core/models/story';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';
import { StoryBlokImagePipe } from '../../../core/pipes/story-blok-image.pipe';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [ StoryBlokImagePipe, RouterModule, AppDatePipe ],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss'
})
export class EventCardComponent {
  @Input() story!: Story<Event>;
  @Input() cardIndex!: number;
}
