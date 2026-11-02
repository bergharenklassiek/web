import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Shows a thumbnail and only loads the YouTube player after a click, because the player is heavy. Until then, the only
 * request to YouTube is for the thumbnail image.
 */
@Component({
  selector: 'app-youtube-video',
  templateUrl: './youtube-video.component.html',
  styleUrl: './youtube-video.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YoutubeVideoComponent {
  private readonly sanitizer = inject(DomSanitizer);

  videoId = input.required<string>();
  videoTitle = input.required<string>();

  playing = signal(false);

  thumbnailUrl = computed(() => `https://i.ytimg.com/vi_webp/${encodeURIComponent(this.videoId())}/sddefault.webp`);
  // The ID is encoded and the rest of the URL is fixed, so this can't point to another site
  playerUrl = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.videoId())}?autoplay=1&rel=0`
  ));

  play(): void {
    this.playing.set(true);
  }
}
