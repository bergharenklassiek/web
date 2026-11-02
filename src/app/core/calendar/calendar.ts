import { siteName, siteUrl, venue } from '../config/site.config';
import { ROUTE_NAMES } from '../routing/route-names';
import { toIsoWithOffset } from '../utils/event-date';

export interface CalendarEvent {
  slug: string;
  title: string;
  date: string;
  location: string;
  summary?: string;
}

// Storyblok has no end time. Concerts take about an hour, followed by a drink with the musicians.
const DURATION_MINUTES = 90;
const MAX_ICS_LINE_BYTES = 75;

export function concertUrl(slug: string): string {
  return `${siteUrl}/${ROUTE_NAMES.AGENDA}/${encodeURIComponent(slug)}`;
}

export function icsUrl(slug: string): string {
  return `${concertUrl(slug)}.ics`;
}

export function locationWithAddress(location: string): string {
  return location === venue.name ? `${venue.name}, ${venue.streetAddress}, ${venue.addressLocality}` : location;
}

export function routeUrl(location: string): string {
  const destination = location === venue.name ? `${venue.streetAddress}, ${venue.addressLocality}` : location;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const { start, end } = eventTimes(event.date);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: description(event),
    location: locationWithAddress(event.location),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function buildIcs(event: CalendarEvent, id: string, now: Date = new Date()): string {
  const { start, end } = eventTimes(event.date);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${siteName}//Agenda//NL`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    // Stays the same for a concert, so importing it again updates the entry instead of adding a second one
    `UID:${id}@bergharenklassiek.nl`,
    `DTSTAMP:${toIcsTime(now)}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(description(event))}`,
    `LOCATION:${escapeText(locationWithAddress(event.location))}`,
    `URL:${concertUrl(event.slug)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

function description(event: CalendarEvent): string {
  return [event.summary, concertUrl(event.slug)].filter(Boolean).join('\n\n');
}

// Times are in UTC, so calendars show them correctly in any time zone without needing a time zone definition
function eventTimes(date: string): { start: string; end: string } {
  const start = new Date(toIsoWithOffset(date));
  const end = new Date(start.getTime() + DURATION_MINUTES * 60 * 1000);
  return { start: toIcsTime(start), end: toIcsTime(end) };
}

function toIcsTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// The format limits lines to 75 bytes. Longer ones continue on the next line, which starts with a space.
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > MAX_ICS_LINE_BYTES) {
      parts.push(current);
      current = ' ';
      bytes = 1;
    }
    current += character;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n');
}
