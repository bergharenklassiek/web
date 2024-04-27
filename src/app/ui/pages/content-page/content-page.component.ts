import { Component, OnInit } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';
import { Router } from '@angular/router';
import { ContentPage } from '../../../core/models/content-page';
import { Story } from '../../../core/models/story';
import { RichTextComponent } from '../../components/rich-text/rich-text.component';

@Component({
  selector: 'app-content-page',
  standalone: true,
  imports: [RichTextComponent],
  templateUrl: './content-page.component.html',
  styleUrl: './content-page.component.scss'
})
export class ContentPageComponent implements OnInit {
  contentPage?: Story<ContentPage>;

  constructor(private contentService: ContentService, private router: Router) {}
  
  ngOnInit(): void {
    this.contentPage = this.contentService.contentPages().find(p => p.slug === this.router.url.replace('/',''));
  }
}
