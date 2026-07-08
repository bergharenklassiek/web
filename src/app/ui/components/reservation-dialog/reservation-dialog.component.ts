import { Component, inject } from '@angular/core';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { ContentService } from '../../../core/services/content.service';
import { ReservationDialogRowComponent } from './reservation-dialog-row/reservation-dialog-row.component';

@Component({
  selector: 'app-reservation-dialog',
  imports: [MatDialogContent, MatDialogTitle, MatDialogActions, MatDialogClose, ReservationDialogRowComponent],
  templateUrl: './reservation-dialog.component.html',
  styleUrl: './reservation-dialog.component.scss',
})
export class ReservationDialogComponent {
  private readonly contentService = inject(ContentService);
  events = this.contentService.events;
}
