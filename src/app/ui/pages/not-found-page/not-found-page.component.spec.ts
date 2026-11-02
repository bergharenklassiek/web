import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundPageComponent } from './not-found-page.component';

describe('NotFoundPageComponent', () => {
  it('should explain the page does not exist, link onward, and stay out of search results', () => {
    TestBed.configureTestingModule({ imports: [NotFoundPageComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const document = TestBed.inject(DOCUMENT);

    expect(element.querySelector('h2')?.textContent).toContain('Deze pagina bestaat niet');
    expect([...element.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/agenda', '/']);
    expect(document.title).toBe('Pagina niet gevonden | Bergharen Klassiek');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
  });
});
