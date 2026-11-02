import { buildIcs, CalendarEvent, googleCalendarUrl, icsUrl, routeUrl } from './calendar';

describe('calendar', () => {
  const event: CalendarEvent = {
    slug: 'pianorecital',
    title: 'Recital; Anna, Bert',
    date: '2026-11-22 16:00',
    location: 'Protestantse Kerk Bergharen',
    summary: 'Recital met Anna',
  };
  const now = new Date('2026-11-02T12:00:00Z');
  const unfolded = (ics: string) => ics.replace(/\r\n /g, '');

  describe('buildIcs', () => {
    it('should convert the local time to UTC and last 90 minutes', () => {
      const ics = buildIcs(event, '123', now);

      expect(ics).toContain('DTSTART:20261122T150000Z\r\n');
      expect(ics).toContain('DTEND:20261122T163000Z\r\n');
    });

    it('should use the summer offset in summer', () => {
      expect(buildIcs({ ...event, date: '2026-07-15 20:00' }, '123', now)).toContain('DTSTART:20260715T180000Z');
    });

    it('should have a stable UID and the required fields', () => {
      const ics = buildIcs(event, '123', now);

      expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
      expect(ics).toContain('UID:123@bergharenklassiek.nl\r\n');
      expect(ics).toContain('DTSTAMP:20261102T120000Z\r\n');
      expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true);
    });

    it('should escape special characters', () => {
      const ics = unfolded(buildIcs(event, '123', now));

      expect(ics).toContain('SUMMARY:Recital\; Anna\\, Bert\r\n');
      expect(ics).toContain('DESCRIPTION:Recital met Anna\\n\\nhttps://bergharenklassiek.nl/agenda/pianorecital\r\n');
    });

    it('should add the address of our own venue only', () => {
      expect(unfolded(buildIcs(event, '123', now))).toContain('LOCATION:Protestantse Kerk Bergharen\\, Veldsestraat 12\\, Bergharen\r\n');
      expect(buildIcs({ ...event, location: 'Concertgebouw' }, '123', now)).toContain('LOCATION:Concertgebouw\r\n');
    });

    it('should fold long lines at 75 bytes without splitting characters', () => {
      const title = 'ò'.repeat(100);
      const ics = buildIcs({ ...event, title }, '123', now);
      const encoder = new TextEncoder();

      ics.split('\r\n').forEach((line) => expect(encoder.encode(line).length).toBeLessThanOrEqual(75));
      expect(ics).not.toContain('�');
      expect(unfolded(ics)).toContain(`SUMMARY:${title}\r\n`);
    });
  });

  describe('googleCalendarUrl', () => {
    it('should fill in the event', () => {
      const url = new URL(googleCalendarUrl(event));

      expect(url.origin).toBe('https://calendar.google.com');
      expect(url.searchParams.get('text')).toBe('Recital; Anna, Bert');
      expect(url.searchParams.get('dates')).toBe('20261122T150000Z/20261122T163000Z');
      expect(url.searchParams.get('location')).toBe('Protestantse Kerk Bergharen, Veldsestraat 12, Bergharen');
      expect(url.searchParams.get('details')).toContain('https://bergharenklassiek.nl/agenda/pianorecital');
    });
  });

  describe('routeUrl', () => {
    it('should route to the address of our own venue', () => {
      expect(new URL(routeUrl(event.location)).searchParams.get('destination')).toBe('Veldsestraat 12, Bergharen');
    });

    it('should route to the name of another venue', () => {
      expect(new URL(routeUrl('Concertgebouw')).searchParams.get('destination')).toBe('Concertgebouw');
    });
  });

  describe('icsUrl', () => {
    it('should percent-encode the slug', () => {
      expect(icsUrl('nicolò')).toBe('https://bergharenklassiek.nl/agenda/nicol%C3%B2.ics');
    });
  });
});
