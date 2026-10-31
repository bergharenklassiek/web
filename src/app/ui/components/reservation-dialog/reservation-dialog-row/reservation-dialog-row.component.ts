import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Event } from '../../../../core/models/event';
import { Story } from '../../../../core/models/story';
import { StoryBlokImagePipe } from "../../../../core/pipes/story-blok-image.pipe";
import { AppDatePipe } from "../../../../core/pipes/app-date.pipe";
import { ReservationLinkService } from '../../../../core/services/reservation-link.service';
import { ReservationService } from '../../../../core/services/reservation.service';

@Component({
  selector: 'app-reservation-dialog-row',
  imports: [StoryBlokImagePipe, AppDatePipe, NgTemplateOutlet],
  templateUrl: './reservation-dialog-row.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './reservation-dialog-row.component.scss',
})
export class ReservationDialogRowComponent {
  private readonly reservationLinkService = inject(ReservationLinkService);
  readonly reservationsEnabled = inject(ReservationService).enabled;

  story = input.required<Story<Event>>();
  selected = output<void>();

  reservationLink(event: Event): string {
    return this.reservationLinkService.formatReservationLink(event)
  }
}
