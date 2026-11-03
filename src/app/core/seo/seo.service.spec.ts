import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let document: Document;

  const content = (selector: string) => document.head.querySelector(selector)?.getAttribute('content');
  const canonical = () => document.head.querySelector('link[rel="canonical"]');
  const jsonLd = () => document.head.querySelector('script[type="application/ld+json"]');

  beforeEach(() => {
    service = TestBed.inject(SeoService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => service.update({ path: '/' }));

  it('should add the site name to the page title', () => {
    service.update({ title: 'Agenda', path: '/agenda' });

    expect(document.title).toBe('Agenda | Bergharen Klassiek');
    expect(content('meta[property="og:title"]')).toBe('Agenda');
    expect(content('meta[property="og:url"]')).toBe('https://bergharenklassiek.nl/agenda');
    expect(canonical()?.getAttribute('href')).toBe('https://bergharenklassiek.nl/agenda');
  });

  it('should use the site name and logo by default', () => {
    service.update({ path: '/' });

    expect(document.title).toBe('Bergharen Klassiek');
    expect(content('meta[property="og:image"]')).toBe('https://bergharenklassiek.nl/share-image.png');
  });

  it('should not pile up tags across pages', () => {
    service.update({ title: 'Een', path: '/een', jsonLd: { name: 'een' } });
    service.update({ title: 'Twee', path: '/twee', jsonLd: { name: 'twee' } });

    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.head.querySelectorAll('script[type="application/ld+json"]').length).toBe(1);
    expect(jsonLd()?.textContent).toBe('{"name":"twee"}');
  });

  it('should clear what the previous page set', () => {
    service.update({ title: 'Concert', path: '/agenda/concert', jsonLd: { name: 'concert' } });
    service.update({ title: 'Niet gevonden', noindex: true });

    expect(content('meta[name="robots"]')).toBe('noindex');
    expect(canonical()).toBeNull();
    expect(jsonLd()).toBeNull();
    expect(content('meta[property="og:url"]')).toBeUndefined();

    service.update({ path: '/' });

    expect(content('meta[name="robots"]')).toBeUndefined();
  });

  it('should not let text close the script tag', () => {
    service.update({ path: '/', jsonLd: { name: '</script><script>alert(1)</script>' } });

    expect(jsonLd()?.textContent).not.toContain('<');
    expect(JSON.parse(jsonLd()!.textContent!).name).toBe('</script><script>alert(1)</script>');
  });
});
