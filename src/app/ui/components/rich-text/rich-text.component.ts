import { Component, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { ISbRichtext, renderRichText, storyblokInit } from '@storyblok/js';

@Component({
    selector: 'app-rich-text',
    standalone: true,
    templateUrl: './rich-text.component.html',
    styleUrls: ['./rich-text.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RichTextComponent implements OnChanges {
  @Input() richText?: ISbRichtext;
  richTextFormatted?: string;

  constructor() {
    storyblokInit({ accessToken: 'acu9a7B7tQrUQ6dr0rQTqgtt' });
  }

  // Re-render on every input change, the host component may be reused for different content (e.g. navigating between events)
  ngOnChanges(): void {
    this.richTextFormatted = renderRichText(this.richText);
  }
}
