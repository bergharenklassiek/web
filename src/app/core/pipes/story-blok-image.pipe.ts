import { Pipe, PipeTransform } from '@angular/core';
import { Asset } from '../models/asset';

@Pipe({
  name: 'storyBlokImage',
  standalone: true
})
export class StoryBlokImagePipe implements PipeTransform {
  transform(asset: Asset, width: number, height: number): string {
    let url = `${asset.filename.replace('//a.storyblok.com', '//a2.storyblok.com')}/m/${width}x${height}`;
    if (asset.focus) url += `/filters:focal(${asset.focus})`;
    return url;
  }
}
