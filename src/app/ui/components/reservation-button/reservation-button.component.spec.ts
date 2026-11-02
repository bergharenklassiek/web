import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ReservationDialogComponent } from '../reservation-dialog/reservation-dialog.component';
import { ReservationButtonComponent } from './reservation-button.component';

describe('ReservationButtonComponent', () => {
  it('should open the dialog with the list of concerts', () => {
    const open = vi.fn();
    TestBed.configureTestingModule({
      imports: [ReservationButtonComponent],
      providers: [{ provide: MatDialog, useValue: { open } }],
    });
    const fixture = TestBed.createComponent(ReservationButtonComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.reservation-button').click();

    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][0]).toBe(ReservationDialogComponent);
    expect(open.mock.calls[0][1].data).toBeUndefined();
  });
});
