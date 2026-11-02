import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YoutubeVideoComponent } from './youtube-video.component';

describe('YoutubeVideoComponent', () => {
  let fixture: ComponentFixture<YoutubeVideoComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [YoutubeVideoComponent] }).compileComponents();

    fixture = TestBed.createComponent(YoutubeVideoComponent);
    fixture.componentRef.setInput('videoId', 'abc123');
    fixture.componentRef.setInput('videoTitle', 'De kerk');
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should only show a thumbnail at first', () => {
    expect(element.querySelector('iframe')).toBeNull();
    expect(element.querySelector('img')?.getAttribute('src')).toBe('https://i.ytimg.com/vi_webp/abc123/sddefault.webp');
    expect(element.querySelector('button')?.getAttribute('aria-label')).toBe('Video afspelen: De kerk');
  });

  it('should load the player after a click', () => {
    element.querySelector('button')!.click();
    fixture.detectChanges();

    const iframe = element.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abc123?autoplay=1&rel=0');
    expect(iframe?.getAttribute('title')).toBe('De kerk');
    expect(element.querySelector('button')).toBeNull();
  });
});
