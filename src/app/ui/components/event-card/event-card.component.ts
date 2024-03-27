import { Component, Input } from '@angular/core';
import { Event } from '../../../core/models/event';
import { StoryBlokUrlPipe } from '../../../core/pipes/story-blok-url.pipe';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Story } from '../../../core/models/story';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [ StoryBlokUrlPipe, DatePipe, RouterLink, NgOptimizedImage ],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss'
})
export class EventCardComponent {
  @Input() story!: Story<Event>;
  @Input() cardIndex!: number;
}
