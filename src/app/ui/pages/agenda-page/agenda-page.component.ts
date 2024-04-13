import { Component } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';
import { StoryBlokUrlPipe } from '../../../core/pipes/story-blok-url.pipe';
import { RouterModule } from '@angular/router';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  imports: [StoryBlokUrlPipe, AppDatePipe, RouterModule],
  templateUrl: './agenda-page.component.html',
  styleUrl: './agenda-page.component.scss'
})
export class AgendaPageComponent {
  stories = this.contentService.events;

  constructor(private contentService: ContentService) {}
}
