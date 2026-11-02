/**
 * Storyblok dates look like "2026-11-15 20:00" and hold the local time in the Netherlands, so the time is kept as it
 * is and only the offset that applies on that date is added.
 */
export function toIsoWithOffset(date: string): string {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!match) {
    return date;
  }
  const [, year, month, day, hours, minutes] = match;
  const instant = Date.UTC(+year, +month - 1, +day, +hours, +minutes);
  const zoneName = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Amsterdam', timeZoneName: 'longOffset' })
    .formatToParts(instant)
    .find((part) => part.type === 'timeZoneName')!.value;
  return `${year}-${month}-${day}T${hours}:${minutes}:00${zoneName.replace('GMT', '')}`;
}
