import { Injectable } from '@angular/core';
import { Event } from '../models/event';
import { formatAppDate } from '../utils/app-date-format';

@Injectable({
  providedIn: 'root',
})
export class ReservationLinkService {
  formatReservationLink(event: Event): string {
    const subject = `Reservering voor ${event.title}`;
    const body = `Hallo,\n\nIk wil graag een reservering maken voor het concert: ${event.title} op ${formatAppDate(event.date)} voor [aantal personen] personen.\n\nMet vriendelijke groet,\n[Je naam]`;
    return `mailto:bergharenklassiek@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}
