import { Component, input } from '@angular/core';
import { Event } from '../../../../core/models/event';
import { Story } from '../../../../core/models/story';

@Component({
  selector: 'app-reservation-dialog-row',
  imports: [],
  templateUrl: './reservation-dialog-row.component.html',
  styleUrl: './reservation-dialog-row.component.scss',
})
export class ReservationDialogRowComponent {
  story = input.required<Story<Event>>();
}
