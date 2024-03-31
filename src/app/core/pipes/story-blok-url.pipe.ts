import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'storyBlokUrl',
  standalone: true
})
export class StoryBlokUrlPipe implements PipeTransform {

  transform(url: string, size?: number): string {
    return `${url.replace('//a.storyblok.com', '//a2.storyblok.com')}${size ? `/m/${size}x0` : ''}`;
  }
}
