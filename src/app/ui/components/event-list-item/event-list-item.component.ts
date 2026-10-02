import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Event } from '../../../core/models/event';
import { Story } from '../../../core/models/story';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';
import { StoryBlokImagePipe } from '../../../core/pipes/story-blok-image.pipe';

@Component({
    selector: 'app-event-list-item',
    standalone: true,
    imports: [StoryBlokImagePipe, AppDatePipe, RouterModule],
    templateUrl: './event-list-item.component.html',
    styleUrl: './event-list-item.component.scss'
})
export class EventListItemComponent {
  @Input() story!: Story<Event>;
}
