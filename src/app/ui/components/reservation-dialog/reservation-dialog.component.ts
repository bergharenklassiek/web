import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { Event } from '../../../core/models/event';
import { ReservationEvent } from '../../../core/models/reservation';
import { Story } from '../../../core/models/story';
import { ContentService } from '../../../core/services/content.service';
import { ReservationFormComponent } from '../reservation-form/reservation-form.component';
import { ReservationDialogRowComponent } from './reservation-dialog-row/reservation-dialog-row.component';

export interface ReservationDialogData {
  // Opens the form for this concert straight away instead of the list of concerts
  event?: ReservationEvent;
}

export const reservationDialogConfig = {
  width: '520px',
  maxWidth: 'calc(100vw - 32px)',
};

@Component({
  selector: 'app-reservation-dialog',
  imports: [MatDialogContent, MatDialogTitle, MatDialogActions, MatDialogClose, ReservationDialogRowComponent, ReservationFormComponent],
  templateUrl: './reservation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './reservation-dialog.component.scss',
})
export class ReservationDialogComponent {
  private readonly contentService = inject(ContentService);
  private readonly data = inject<ReservationDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  events = this.contentService.events;
  readonly openedForEvent = !!this.data?.event;
  selectedEvent = signal<ReservationEvent | undefined>(this.data?.event);

  select(story: Story<Event>): void {
    this.selectedEvent.set({ slug: story.slug, title: story.content.title, date: story.content.date });
  }
}
