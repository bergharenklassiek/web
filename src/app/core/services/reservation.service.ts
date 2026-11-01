import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { reservationEndpoint } from '../config/reservation.config';
import { ReservationEvent, ReservationGuest, ReservationRequest, ReservationResponse } from '../models/reservation';
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
}
