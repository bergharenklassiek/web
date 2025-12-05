import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ISbRichtext, renderRichText, storyblokInit } from '@storyblok/js';

@Component({
    selector: 'app-rich-text',
    standalone: true,
    templateUrl: './rich-text.component.html',
    styleUrls: ['./rich-text.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RichTextComponent implements OnInit {
  @Input() richText?: ISbRichtext;
  richTextFormatted?: string;

  ngOnInit(): void {
    storyblokInit({ accessToken: 'acu9a7B7tQrUQ6dr0rQTqgtt' });
    this.richTextFormatted = renderRichText(this.richText);
  }
}
