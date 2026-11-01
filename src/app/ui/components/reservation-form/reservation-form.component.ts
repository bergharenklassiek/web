import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { maxSeatsPerReservation } from '../../../core/config/reservation.config';
import { ReservationEvent, ReservationStatus } from '../../../core/models/reservation';
import { AppDatePipe } from '../../../core/pipes/app-date.pipe';
import { ReservationLinkService } from '../../../core/services/reservation-link.service';
import { ReservationService } from '../../../core/services/reservation.service';

@Component({
  selector: 'app-reservation-form',
  imports: [ReactiveFormsModule, AppDatePipe],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservationFormComponent {
  private readonly reservationService = inject(ReservationService);
  private readonly reservationLinkService = inject(ReservationLinkService);

  event = input.required<ReservationEvent>();

  status = signal<ReservationStatus | 'idle' | 'sending'>('idle');
  remaining = signal<number | undefined>(undefined);
  mailtoLink = computed(() => this.reservationLinkService.formatReservationLink(this.event()));
  seatOptions = Array.from({ length: maxSeatsPerReservation }, (_, i) => i + 1);

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    seats: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(maxSeatsPerReservation)] }),
    website: new FormControl('', { nonNullable: true }),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('sending');
    this.reservationService.reserve(this.event(), this.form.getRawValue()).subscribe(response => {
      this.remaining.set(response.remaining);
      this.status.set(response.status);
    });
  }

  showError(control: 'name' | 'email'): boolean {
    const field = this.form.controls[control];
    return field.invalid && field.touched;
  }
}
