import { Component } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';
import { StoryBlokUrlPipe } from '../../../core/pipes/story-blok-url.pipe';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  imports: [StoryBlokUrlPipe, DatePipe, RouterModule],
  templateUrl: './agenda-page.component.html',
  styleUrl: './agenda-page.component.scss'
})
export class AgendaPageComponent {
  stories = this.contentService.events;

  constructor(private contentService: ContentService) {}
}
