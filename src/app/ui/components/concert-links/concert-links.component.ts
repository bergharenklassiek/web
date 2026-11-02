import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CalendarEvent, googleCalendarUrl, icsUrl, locationWithAddress, routeUrl } from '../../../core/calendar/calendar';
import { venue } from '../../../core/config/site.config';

@Component({
  selector: 'app-concert-links',
  templateUrl: './concert-links.component.html',
  styleUrl: './concert-links.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConcertLinksComponent {
  event = input.required<CalendarEvent>();

  address = computed(() => locationWithAddress(this.event().location));
  route = computed(() => routeUrl(this.event().location));
  parking = computed(() => this.event().location === venue.name ? venue.parking : '');
  ics = computed(() => icsUrl(this.event().slug));
  googleCalendar = computed(() => googleCalendarUrl(this.event()));
}
