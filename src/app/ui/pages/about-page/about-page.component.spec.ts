import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ContentService } from '../../../core/services/content.service';
import { AboutPageComponent } from './about-page.component';

describe('AboutPageComponent', () => {
  const page = {
    id: '1',
    slug: 'about',
    content: {
      title: 'Over ons',
      description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'De stichting organiseert concerten.' }] }] },
    },
  };

  let fixture: ComponentFixture<AboutPageComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AboutPageComponent],
      providers: [{ provide: ContentService, useValue: { loadAboutPage: () => of(page) } }],
    });
    fixture = TestBed.createComponent(AboutPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    element = fixture.nativeElement;
  });

  it('should show the title and text', () => {
    expect(element.querySelector('h3')?.textContent).toContain('Over ons');
    expect(element.textContent).toContain('De stichting organiseert concerten.');
  });

  it('should set the search metadata', () => {
    expect(document.title).toBe('Over ons | Bergharen Klassiek');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://bergharenklassiek.nl/over-ons/');
  });
});
