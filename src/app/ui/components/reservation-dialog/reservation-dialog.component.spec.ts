import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Dispatcher } from '@ngrx/signals/events';
import { Event } from '../../../core/models/event';
import { Story } from '../../../core/models/story';
import { eventListLoaded } from '../../../core/store/content.events';
import { ContentStore } from '../../../core/store/content.store';
import { ReservationDialogComponent, ReservationDialogData } from './reservation-dialog.component';

describe('ReservationDialogComponent', () => {
  const story: Story<Event> = {
    id: '123',
    slug: 'concert',
    content: { title: 'Concert', date: '2999-01-01 16:00', location: 'Kerk', images: [] } as unknown as Event,
  };
  const reservationEvent = { id: '123', slug: 'concert', title: 'Concert', date: '2999-01-01 16:00', location: 'Kerk' };

  let fixture: ComponentFixture<ReservationDialogComponent>;
  let element: HTMLElement;
  let close: ReturnType<typeof vi.fn>;

  function setup(data: ReservationDialogData | null = null) {
    close = vi.fn();
    TestBed.configureTestingModule({
      imports: [ReservationDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
    TestBed.inject(ContentStore);
    fixture = TestBed.createComponent(ReservationDialogComponent);
    fixture.detectChanges();
    element = fixture.nativeElement;
  }

  const loadEvents = () => {
    TestBed.inject(Dispatcher).dispatch(eventListLoaded({ events: [story], past: false }));
    fixture.detectChanges();
  };

  it('should show nothing but the dialog while the concerts are loading', () => {
    setup();

    expect(element.querySelector('app-reservation-dialog-row')).toBeNull();
    expect(element.querySelector('app-reservation-form')).toBeNull();
  });

  it('should list the upcoming concerts', () => {
    setup();

    loadEvents();

    expect(element.querySelectorAll('app-reservation-dialog-row').length).toBe(1);
  });

  it('should show the form after choosing a concert, with a way back', () => {
    setup();
    loadEvents();

    fixture.componentInstance.select(story);
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedEvent()).toEqual(reservationEvent);
    expect(element.querySelector('app-reservation-form')).not.toBeNull();

    element.querySelector<HTMLButtonElement>('.reservation-dialog__back-button')!.click();
    fixture.detectChanges();

    expect(element.querySelector('app-reservation-form')).toBeNull();
    expect(element.querySelector('app-reservation-dialog-row')).not.toBeNull();
  });

  it('should close with the close button', () => {
    setup();

    element.querySelector<HTMLButtonElement>('.reservation-dialog__close-button')!.click();

    expect(close).toHaveBeenCalled();
  });

  it('should go straight to the form when opened for a concert, without a way back', () => {
    setup({ event: reservationEvent });

    expect(element.querySelector('app-reservation-form')).not.toBeNull();
    expect(element.querySelector('.reservation-dialog__back-button')).toBeNull();
  });
});
