import { formatDate } from '@angular/common';

export type AppDateFormat = 'month' | 'year';

export function formatAppDate(date: string, format: AppDateFormat = 'month', locale: string = 'nl-NL'): string {
  if (format === 'year') {
    return formatDate(date, 'EEE d MMMM y', locale);
  }

  const currentYear = new Date().getFullYear().toString();
  const dateFormat = date.split('-')[0] === currentYear ? 'EEE d MMMM HH:mm' : 'EEE d MMMM y HH:mm';
  return formatDate(date, dateFormat, locale);
}