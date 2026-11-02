import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ContentService } from '../../../core/services/content.service';
import { ContentPageComponent } from './content-page.component';

describe('ContentPageComponent', () => {
  const page = {
    id: '1',
    slug: 'gebouw',
    content: {
      title: 'Gebouw',
      description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'De kerk ligt aan de rand.' }] }] },
      images: [{ filename: 'https://a.storyblok.com/f/1/kerk.jpg', alt: 'De kerk' }],
    },
  };

  let fixture: ComponentFixture<ContentPageComponent>;
  let element: HTMLElement;
  let loadContentPage: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadContentPage = vi.fn(() => of(page));
    TestBed.configureTestingModule({
      imports: [ContentPageComponent],
      providers: [
        { provide: Router, useValue: { url: '/gebouw' } },
        { provide: ContentService, useValue: { loadContentPage } },
      ],
    });
    fixture = TestBed.createComponent(ContentPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    element = fixture.nativeElement;
  });

  it('should load the page for the current URL', () => {
    expect(loadContentPage).toHaveBeenCalledWith('gebouw');
  });

  it('should show the title, text and photos', () => {
    expect(element.querySelector('h3')?.textContent).toContain('Gebouw');
    expect(element.textContent).toContain('De kerk ligt aan de rand.');
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('De kerk');
  });

  it('should set the search metadata, with a trailing slash in the canonical URL', () => {
    expect(document.title).toBe('Gebouw | Bergharen Klassiek');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('De kerk ligt aan de rand.');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://bergharenklassiek.nl/gebouw/');
  });
});
