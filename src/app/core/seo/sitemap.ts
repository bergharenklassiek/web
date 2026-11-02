import { siteUrl } from '../config/site.config';
import { storyblokBaseUrl, storyblokToken } from '../config/storyblok.config';
import { ROUTE_NAMES } from '../routing/route-names';

interface EventStory {
  slug: string;
  published_at?: string | null;
}

const STATIC_PATHS = [
  ROUTE_NAMES.HOME,
  ROUTE_NAMES.AGENDA,
  ROUTE_NAMES.ABOUT,
  ROUTE_NAMES.CONTACT,
  ROUTE_NAMES.GEBOUW,
  ROUTE_NAMES.CONCERTEN_IN_DE_REGIO,
  ROUTE_NAMES.ANBI,
];

const PER_PAGE = 100;

// Built on request, so a concert is listed as soon as it's published, without a new deploy
export async function createSitemapResponse(fetchFn: typeof fetch = fetch): Promise<Response> {
  try {
    const events = await loadEvents(fetchFn);
    return new Response(buildSitemap(events), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Could not build the sitemap', error);
    // Crawlers retry on a 503, while a 404 or an incomplete list could make them drop pages
    return new Response('Sitemap is tijdelijk niet beschikbaar', { status: 503 });
  }
}

export function buildSitemap(events: EventStory[]): string {
  const staticUrls = STATIC_PATHS.map((path) => urlEntry(path ? `${siteUrl}/${path}` : `${siteUrl}/`));
  const eventUrls = events.map((event) => urlEntry(`${siteUrl}/${ROUTE_NAMES.AGENDA}/${event.slug}`, event.published_at));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticUrls,
    ...eventUrls,
    '</urlset>',
    '',
  ].join('\n');
}

function urlEntry(url: string, lastModified?: string | null): string {
  const lastmod = lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : '';
  return `  <url><loc>${escapeXml(url)}</loc>${lastmod}</url>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function loadEvents(fetchFn: typeof fetch): Promise<EventStory[]> {
  const events: EventStory[] = [];
  let page = 1;
  let total: number;
  do {
    const url = `${storyblokBaseUrl}/stories?content_type=Event&excluding_fields=description,images&per_page=${PER_PAGE}&page=${page}&token=${storyblokToken}`;
    const response = await fetchFn(url);
    if (!response.ok) {
      throw new Error(`Storyblok answered ${response.status}`);
    }
    const body = (await response.json()) as { stories: EventStory[] };
    events.push(...body.stories);
    total = Number(response.headers.get('total') ?? 0);
    page++;
  } while (events.length < total);
  return events;
}
