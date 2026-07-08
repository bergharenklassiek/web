import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReservationDialogComponent } from '../reservation-dialog/reservation-dialog.component';

@Component({
  selector: 'app-reservation-button',
  imports: [],
  templateUrl: './reservation-button.component.html',
  styleUrl: './reservation-button.component.scss',
})
export class ReservationButtonComponent {
  private readonly dialog = inject(MatDialog);

  openDialog(): void {
    this.dialog.open(ReservationDialogComponent);
  }
}
