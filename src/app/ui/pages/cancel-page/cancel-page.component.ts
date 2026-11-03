import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { reservationEmail } from '../../../core/config/reservation.config';
import { ReservationDetails } from '../../../core/models/reservation';
import { SeoService } from '../../../core/seo/seo.service';
import { ReservationService } from '../../../core/services/reservation.service';

type CancelPageStatus = 'loading' | 'ready' | 'cancelling' | 'cancelled' | 'not_found' | 'error';

/**
 * Where the link in the confirmation email leads. Opening it only shows the reservation, because mail scanners also open
 * links: cancelling takes a click on the button.
 */
@Component({
  selector: 'app-cancel-page',
  imports: [RouterLink],
  templateUrl: './cancel-page.component.html',
  styleUrl: './cancel-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelPageComponent {
  private readonly reservationService = inject(ReservationService);
  private readonly code = inject(ActivatedRoute).snapshot.paramMap.get('code') ?? '';

  readonly email = reservationEmail;
  status = signal<CancelPageStatus>('loading');
  details = signal<ReservationDetails | undefined>(undefined);

  constructor() {
    inject(SeoService).update({ title: 'Reservering annuleren', noindex: true });
    // Only runs in the browser, so server rendering doesn't call the script
    afterNextRender(() => {
      this.reservationService.lookUpReservation(this.code).subscribe((response) => {
        this.details.set(response.details);
        this.status.set(response.status === 'ok' ? 'ready' : response.status);
      });
    });
  }

  cancel(): void {
    this.status.set('cancelling');
    this.reservationService.cancelReservation(this.code).subscribe((response) => {
      this.status.set(response.status === 'ok' ? 'cancelled' : response.status);
    });
  }
}
