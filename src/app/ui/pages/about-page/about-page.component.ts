import { Component } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [RichTextComponent],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss'
})
export class AboutPageComponent {
  aboutPage = this.contentService.aboutPage;

  constructor(private contentService: ContentService) {}
}
