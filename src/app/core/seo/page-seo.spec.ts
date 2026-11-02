import { registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';
import { ISbRichtext } from '@storyblok/js';
import { Event } from '../models/event';
import { eventSeo, richTextToDescription, toIsoWithOffset } from './page-seo';

registerLocaleData(localeNl);

describe('page SEO', () => {
  const event = {
    title: 'Pianorecital',
    summary: 'Recital met Anna (piano)',
    date: '2026-11-22 16:00',
    location: 'Protestantse Kerk Bergharen',
    images: [{ filename: 'https://a.storyblok.com/f/1/photo.jpg', alt: '', focus: '' }],
  } as unknown as Event;

  describe('eventSeo', () => {
    it('should describe the concert and link to its agenda page', () => {
      const seo = eventSeo('pianorecital', event);

      expect(seo.title).toBe('Pianorecital');
      expect(seo.description).toBe('zondag 22 november 2026 om 16:00, Protestantse Kerk Bergharen. Recital met Anna (piano)');
      expect(seo.path).toBe('/agenda/pianorecital');
    });

    it('should use a resized first photo, with the title when it has no alt text', () => {
      expect(eventSeo('pianorecital', event).image).toEqual({
        url: 'https://a2.storyblok.com/f/1/photo.jpg/m/1200x630',
        width: 1200,
        height: 630,
        alt: 'Pianorecital',
      });
    });

    it('should fall back to the logo without photos', () => {
      expect(eventSeo('pianorecital', { ...event, images: [] }).image?.url).toBe('https://bergharenklassiek.nl/full-logo-BK.png');
    });

    it('should add the address of our own venue to the structured data', () => {
      const jsonLd = eventSeo('pianorecital', event).jsonLd as any;

      expect(jsonLd['@type']).toBe('Event');
      expect(jsonLd.startDate).toBe('2026-11-22T16:00:00+01:00');
      expect(jsonLd.location.address.streetAddress).toBe('Veldsestraat 12');
    });

    it('should not claim our address for another venue', () => {
      const jsonLd = eventSeo('pianorecital', { ...event, location: 'Concertgebouw' }).jsonLd as any;

      expect(jsonLd.location.name).toBe('Concertgebouw');
      expect(jsonLd.location.address).toBe('Concertgebouw');
    });
  });

  describe('toIsoWithOffset', () => {
    it('should use the winter offset', () => {
      expect(toIsoWithOffset('2026-01-15 20:00')).toBe('2026-01-15T20:00:00+01:00');
    });

    it('should use the summer offset', () => {
      expect(toIsoWithOffset('2026-07-15 20:00')).toBe('2026-07-15T20:00:00+02:00');
    });

    it('should leave a date without a time as it is', () => {
      expect(toIsoWithOffset('2026-07-15')).toBe('2026-07-15');
    });
  });

  describe('richTextToDescription', () => {
    const paragraph = (...texts: string[]) => ({ type: 'paragraph', content: texts.map((text) => ({ type: 'text', text })) });
    const doc = (...content: unknown[]) => ({ type: 'doc', content }) as ISbRichtext;

    it('should separate blocks and keep split text together', () => {
      expect(richTextToDescription(doc(paragraph('Stichting'), paragraph('Wo', 'rd', ', en meer!')))).toBe('Stichting. Word, en meer!');
    });

    it('should read list items', () => {
      const list = { type: 'bullet_list', content: [{ type: 'list_item', content: [paragraph('Festival')] }] };

      expect(richTextToDescription(doc(list))).toBe('Festival.');
    });

    it('should cut off long text at a word', () => {
      const description = richTextToDescription(doc(paragraph('woord '.repeat(50))));

      expect(description.length).toBeLessThanOrEqual(155);
      expect(description.endsWith('woord…')).toBe(true);
    });

    it('should be empty without text', () => {
      expect(richTextToDescription(undefined)).toBe('');
    });
  });
});
