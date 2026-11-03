import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { reservationEndpoint } from '../config/reservation.config';
import { CancellationResponse, ReservationEvent, ReservationGuest, ReservationRequest, ReservationResponse } from '../models/reservation';
import { formatAppDate } from '../utils/app-date-format';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private readonly http = inject(HttpClient);

  readonly enabled = !!reservationEndpoint;

  reserve(event: ReservationEvent, guest: ReservationGuest): Observable<ReservationResponse> {
    const request: ReservationRequest = { ...event, ...guest, dateLabel: formatAppDate(event.date, 'year') };
    // Apps Script can't answer a CORS preflight, so the JSON is sent as text/plain, which doesn't need one
    return this.http.post<ReservationResponse>(reservationEndpoint, JSON.stringify(request), {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    }).pipe(
      catchError(() => of<ReservationResponse>({ status: 'error' }))
    );
  }

  lookUpReservation(code: string): Observable<CancellationResponse> {
    return this.sendCancellation('lookup', code);
  }

  cancelReservation(code: string): Observable<CancellationResponse> {
    return this.sendCancellation('cancel', code);
  }

  private sendCancellation(action: 'lookup' | 'cancel', code: string): Observable<CancellationResponse> {
    return this.http.post<CancellationResponse>(reservationEndpoint, JSON.stringify({ action, code }), {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    }).pipe(
      // Includes an older script, which answers this with an error page or "invalid"
      map((response) => (response.status === 'ok' || response.status === 'not_found' ? response : { status: 'error' as const })),
      catchError(() => of<CancellationResponse>({ status: 'error' }))
    );
  }
}
