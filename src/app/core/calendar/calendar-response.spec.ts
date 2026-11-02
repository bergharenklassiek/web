import { createCalendarResponse, isCalendarPath } from './calendar-response';

describe('calendar response', () => {
  const answer = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
  const story = {
    id: 123,
    slug: 'nicolò',
    content: { component: 'Event', title: 'Recital', date: '2026-11-22 16:00', location: 'Kerk', summary: 'Mooi' },
  };

  it('should only match calendar paths of one concert', () => {
    expect(isCalendarPath('/agenda/concert.ics')).toBe(true);
    expect(isCalendarPath('/agenda/concert')).toBe(false);
    expect(isCalendarPath('/agenda/a/b.ics')).toBe(false);
    expect(isCalendarPath('/concert.ics')).toBe(false);
  });

  it('should answer with a calendar file', async () => {
    const response = await createCalendarResponse('/agenda/nicol%C3%B2.ics', answer({ story }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/calendar');
    expect(await response.text()).toContain('UID:123@bergharenklassiek.nl');
  });

  it('should request the encoded slug', async () => {
    let requested = '';
    const fetchFn = (async (url: string) => {
      requested = url;
      return new Response(JSON.stringify({ story }));
    }) as unknown as typeof fetch;

    await createCalendarResponse('/agenda/nicol%C3%B2.ics', fetchFn);

    expect(requested).toContain('/stories/nicol%C3%B2?');
  });

  it('should answer 404 for an unknown concert', async () => {
    expect((await createCalendarResponse('/agenda/x.ics', answer({}, 404))).status).toBe(404);
  });

  it('should answer 404 for a story that is not a concert', async () => {
    const page = { ...story, content: { component: 'HomePage' } };

    expect((await createCalendarResponse('/agenda/home.ics', answer({ story: page }))).status).toBe(404);
  });

  it('should answer 503 when Storyblok fails', async () => {
    const consoleError = console.error;
    console.error = () => undefined;

    const response = await createCalendarResponse('/agenda/x.ics', answer({}, 500));

    console.error = consoleError;
    expect(response.status).toBe(503);
  });
});
