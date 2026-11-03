import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { CancellationResponse } from '../../../core/models/reservation';
import { ReservationService } from '../../../core/services/reservation.service';
import { CancelPageComponent } from './cancel-page.component';

describe('CancelPageComponent', () => {
  const details = { title: 'Pianorecital', dateLabel: 'zo 22 november 2026', seats: 2 };

  let fixture: ComponentFixture<CancelPageComponent>;
  let element: HTMLElement;
  let cancelReservation: ReturnType<typeof vi.fn>;
  let lookUpReservation: ReturnType<typeof vi.fn>;

  function setup(lookUp: Observable<CancellationResponse>, cancel: Observable<CancellationResponse> = of({ status: 'ok' })) {
    lookUpReservation = vi.fn(() => lookUp);
    cancelReservation = vi.fn(() => cancel);
    TestBed.configureTestingModule({
      imports: [CancelPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ code: 'de-code' }) } } },
        { provide: ReservationService, useValue: { lookUpReservation, cancelReservation } },
      ],
    });
    fixture = TestBed.createComponent(CancelPageComponent);
    element = fixture.nativeElement;
    // The first render starts the lookup, and the second one shows its answer
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
  }

  const button = () => element.querySelector<HTMLButtonElement>('button');

  it('should show that it is loading the reservation', () => {
    setup(new Subject<CancellationResponse>());

    expect(lookUpReservation).toHaveBeenCalledWith('de-code');
    expect(element.textContent).toContain('wordt opgehaald');
    expect(button()).toBeNull();
  });

  it('should show the reservation, without cancelling by just opening the link', () => {
    setup(of({ status: 'ok', details }));

    expect(element.textContent).toContain('Pianorecital');
    expect(element.textContent).toContain('zo 22 november 2026');
    expect(element.textContent).toContain('2 personen');
    expect(cancelReservation).not.toHaveBeenCalled();
  });

  it('should use the singular for one person', () => {
    setup(of({ status: 'ok', details: { ...details, seats: 1 } }));

    expect(element.textContent).toContain('1 persoon');
  });

  it('should cancel after clicking the button, and disable it meanwhile', async () => {
    const answer = new Subject<CancellationResponse>();
    setup(of({ status: 'ok', details }), answer);

    button()!.click();
    fixture.detectChanges();

    expect(cancelReservation).toHaveBeenCalledWith('de-code');
    expect(button()!.disabled).toBe(true);
    expect(button()!.textContent).toContain('Bezig met annuleren');

    answer.next({ status: 'ok' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Je reservering is geannuleerd');
    expect(button()).toBeNull();
  });

  it('should say so when the reservation does not exist', () => {
    setup(of({ status: 'not_found' }));

    expect(element.textContent).toContain('konden we niet vinden');
    expect(button()).toBeNull();
  });

  it('should say so when someone else cancelled it in the meantime', () => {
    setup(of({ status: 'ok', details }), of({ status: 'not_found' }));

    button()!.click();
    fixture.detectChanges();

    expect(element.textContent).toContain('konden we niet vinden');
  });

  it('should offer email when looking up or cancelling fails', () => {
    setup(of({ status: 'error' }));

    expect(element.querySelector('a[href^="mailto:"]')).not.toBeNull();
    expect(button()).toBeNull();
  });

  it('should not be indexed', () => {
    setup(of({ status: 'not_found' }));

    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
    expect(document.title).toContain('Reservering annuleren');
  });
});
