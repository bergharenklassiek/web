import { Component, inject, input } from '@angular/core';
import { Event } from '../../../../core/models/event';
import { Story } from '../../../../core/models/story';
import { StoryBlokImagePipe } from "../../../../core/pipes/story-blok-image.pipe";
import { AppDatePipe } from "../../../../core/pipes/app-date.pipe";
import { ReservationLinkService } from '../../../../core/services/reservation-link.service';

@Component({
  selector: 'app-reservation-dialog-row',
  imports: [StoryBlokImagePipe, AppDatePipe],
  templateUrl: './reservation-dialog-row.component.html',
  styleUrl: './reservation-dialog-row.component.scss',
})
export class ReservationDialogRowComponent {
  private readonly reservationLinkService = inject(ReservationLinkService);

  story = input.required<Story<Event>>();

  reservationLink(event: Event): string {
    return this.reservationLinkService.formatReservationLink(event)
  }
}
