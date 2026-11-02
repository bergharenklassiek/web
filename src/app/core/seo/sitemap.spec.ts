import { buildSitemap, createSitemapResponse } from './sitemap';

describe('sitemap', () => {
  describe('buildSitemap', () => {
    it('should list the static pages and the concerts, but not the old events path', () => {
      const xml = buildSitemap([{ slug: 'concert', published_at: '2026-10-29T09:08:16.647Z' }]);

      expect(xml).toContain('<loc>https://bergharenklassiek.nl/</loc>');
      expect(xml).toContain('<loc>https://bergharenklassiek.nl/gebouw/</loc>');
      expect(xml).toContain('<url><loc>https://bergharenklassiek.nl/agenda/concert</loc><lastmod>2026-10-29T09:08:16.647Z</lastmod></url>');
      expect(xml).not.toContain('/events');
      expect(xml).not.toContain('**');
    });

    it('should use the URLs that Netlify serves without a redirect', () => {
      const locations = [...buildSitemap([{ slug: 'concert' }]).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
      const concert = 'https://bergharenklassiek.nl/agenda/concert';

      expect(locations).toContain(concert);
      expect(locations.filter((location) => location !== concert).every((location) => location.endsWith('/'))).toBe(true);
    });

    it('should escape special characters', () => {
      expect(buildSitemap([{ slug: 'a&b' }])).toContain('/agenda/a&amp;b</loc>');
    });
  });

  describe('createSitemapResponse', () => {
    const page = (slugs: string[], total: number) => new Response(
      JSON.stringify({ stories: slugs.map((slug) => ({ slug })) }),
      { headers: { total: String(total) } },
    );

    it('should fetch every page of concerts', async () => {
      const first = Array.from({ length: 100 }, (_, i) => `concert-${i}`);
      const responses = [page(first, 101), page(['concert-100'], 101)];
      const urls: string[] = [];
      const fetchFn = (async (url: string) => {
        urls.push(url);
        return responses.shift()!;
      }) as unknown as typeof fetch;

      const response = await createSitemapResponse(fetchFn);
      const xml = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/xml');
      expect(urls.length).toBe(2);
      expect(urls[1]).toContain('page=2');
      expect(xml).toContain('/agenda/concert-0</loc>');
      expect(xml).toContain('/agenda/concert-100</loc>');
    });

    it('should answer 503 when Storyblok fails, so crawlers keep the pages they know', async () => {
      const fetchFn = (async () => new Response('', { status: 500 })) as unknown as typeof fetch;
      const consoleError = console.error;
      console.error = () => undefined;

      const response = await createSitemapResponse(fetchFn);

      console.error = consoleError;
      expect(response.status).toBe(503);
    });
  });
});
