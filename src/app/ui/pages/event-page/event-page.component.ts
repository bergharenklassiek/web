import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component } from '@angular/core';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';
import { Event } from '../../../core/models/event';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoryBlokUrlPipe } from '../../../core/pipes/story-blok-url.pipe';
import { ContentService } from '../../../core/services/content.service';

@Component({
  selector: 'app-event-page',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [RichTextComponent, CommonModule, StoryBlokUrlPipe ],
  templateUrl: './event-page.component.html',
  styleUrl: './event-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventPageComponent {
  event = this.contentService.events().find(s => s.slug == this.route.snapshot.paramMap.get('event-slug'))?.content;

  constructor(private route: ActivatedRoute, private contentService: ContentService) {}
}
