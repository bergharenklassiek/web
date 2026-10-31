import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ReservationFormComponent } from './reservation-form.component';
import { ReservationService } from '../../../core/services/reservation.service';
import { ReservationResponse } from '../../../core/models/reservation';

describe('ReservationFormComponent', () => {
  let component: ReservationFormComponent;
  let fixture: ComponentFixture<ReservationFormComponent>;
  let reserve: jest.Mock;

  const event = { id: '129413000010395', title: 'Strijkkwartet Aurelia', date: '2026-11-16 15:00' };

  beforeEach(async () => {
    reserve = jest.fn();
    await TestBed.configureTestingModule({
      imports: [ReservationFormComponent],
      providers: [{ provide: ReservationService, useValue: { enabled: true, reserve } }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('event', event);
    fixture.detectChanges();
  });

  function fillIn(): void {
    component.form.setValue({ name: 'Anna', email: 'anna@example.com', seats: 2, website: '' });
  }

  function respond(response: ReservationResponse): void {
    reserve.mockReturnValue(of(response));
    component.submit();
    fixture.detectChanges();
  }

  it('does not send an incomplete form', () => {
    component.submit();

    expect(reserve).not.toHaveBeenCalled();
  });

  it('sends the reservation and thanks the guest', () => {
    fillIn();
    respond({ status: 'ok' });

    expect(reserve).toHaveBeenCalledWith(event, { name: 'Anna', email: 'anna@example.com', seats: 2, website: '' });
    expect(fixture.nativeElement.textContent).toContain('Bedankt voor je reservering');
  });

  it('shows how many seats are left when the concert is nearly full', () => {
    fillIn();
    respond({ status: 'full', remaining: 1 });

    expect(fixture.nativeElement.textContent).toContain('is nog maar 1 plaats');
  });

  it('offers reserving by email when sending fails', () => {
    fillIn();
    respond({ status: 'error' });

    expect(fixture.nativeElement.querySelector('a[href^="mailto:"]')).toBeTruthy();
  });
});
