import { storyblokBaseUrl, storyblokToken } from '../config/storyblok.config';
import { Event } from '../models/event';
import { Story } from '../models/story';
import { buildIcs } from './calendar';

const ICS_PATH = /^\/agenda\/([^/]+)\.ics$/;

export function isCalendarPath(pathname: string): boolean {
  return ICS_PATH.test(pathname);
}

// Served from a real URL because iPhones only offer "add to calendar" for a file from a URL, not for one created in the page
export async function createCalendarResponse(pathname: string, fetchFn: typeof fetch = fetch): Promise<Response> {
  const notFound = () => new Response('Concert niet gevonden', { status: 404 });

  // Keep the encoded slug as it is: it goes back into the Storyblok URL
  const encodedSlug = pathname.match(ICS_PATH)?.[1];
  if (!encodedSlug) {
    return notFound();
  }

  try {
    const response = await fetchFn(`${storyblokBaseUrl}/stories/${encodedSlug}?token=${storyblokToken}`);
    if (response.status === 404) {
      return notFound();
    }
    if (!response.ok) {
      throw new Error(`Storyblok answered ${response.status}`);
    }
    const { story } = (await response.json()) as { story: Story<Event> };
    // The story endpoint returns any story by its slug, not just concerts
    if (story.content.component !== 'Event') {
      return notFound();
    }
    const { title, date, location, summary } = story.content;
    return new Response(buildIcs({ slug: story.slug, title, date, location, summary }, String(story.id)), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="bergharen-klassiek.ics"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Could not build the calendar file', error);
    return new Response('Agendabestand is tijdelijk niet beschikbaar', { status: 503 });
  }
}
