import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { ReservationFormComponent } from './reservation-form.component';
import { ReservationService } from '../../../core/services/reservation.service';
import { ReservationResponse } from '../../../core/models/reservation';

describe('ReservationFormComponent', () => {
  let component: ReservationFormComponent;
  let fixture: ComponentFixture<ReservationFormComponent>;
  let reserve: ReturnType<typeof vi.fn>;

  const event = { id: '129413000010395', slug: 'strijkkwartet-aurelia', title: 'Strijkkwartet Aurelia', date: '2026-11-16 15:00', location: 'Kerk Bergharen' };

  beforeEach(async () => {
    reserve = vi.fn();
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

  it('says so when the concert is full', () => {
    fillIn();
    respond({ status: 'full', remaining: 0 });

    expect(fixture.nativeElement.textContent).toContain('Dit concert is helaas vol');
  });

  it('asks to check the details when the script rejects them', () => {
    fillIn();
    respond({ status: 'invalid' });

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Controleer je gegevens');
  });

  it('shows the button as busy while sending, and enables it again after an answer', () => {
    const response = new Subject<ReservationResponse>();
    reserve.mockReturnValue(response);
    const button = (): HTMLButtonElement => fixture.nativeElement.querySelector('button[type="submit"]');
    fillIn();

    component.submit();
    fixture.detectChanges();

    expect(button().disabled).toBe(true);
    expect(button().textContent).toContain('Bezig met versturen');

    response.next({ status: 'error' });
    fixture.detectChanges();

    expect(button().disabled).toBe(false);
    expect(button().textContent).toContain('Reserveer');
  });

  it('offers reserving by email when sending fails', () => {
    fillIn();
    respond({ status: 'error' });

    expect(fixture.nativeElement.querySelector('a[href^="mailto:"]')).toBeTruthy();
  });
});
