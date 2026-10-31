import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { ReservationService } from './reservation.service';

describe('ReservationService', () => {
  let service: ReservationService;
  let http: HttpTestingController;

  const event = { id: '129413000010395', title: 'Strijkkwartet', date: '2026-11-16 15:00' };
  const guest = { name: 'Anna', email: 'anna@example.com', seats: 2, website: '' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReservationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the reservation as text/plain JSON', async () => {
    const result = firstValueFrom(service.reserve(event, guest));

    const request = http.expectOne(() => true);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Content-Type')).toContain('text/plain');
    expect(JSON.parse(request.request.body)).toMatchObject({ ...event, ...guest });
    request.flush({ status: 'ok' });

    expect(await result).toEqual({ status: 'ok' });
  });

  it('turns a failed request into an error status', async () => {
    const result = firstValueFrom(service.reserve(event, guest));

    http.expectOne(() => true).flush('Server error', { status: 500, statusText: 'Server error' });

    expect(await result).toEqual({ status: 'error' });
  });
});
