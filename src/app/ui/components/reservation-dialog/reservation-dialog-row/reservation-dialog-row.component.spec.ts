import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationDialogRowComponent } from './reservation-dialog-row.component';
import { Story } from '../../../../core/models/story';
import { Event } from '../../../../core/models/event';

describe('ReservationDialogRowComponent', () => {
  let component: ReservationDialogRowComponent;
  let fixture: ComponentFixture<ReservationDialogRowComponent>;
  const story: Story<Event> = {
    id: 'event-1',
    slug: 'concert',
    content: {
      title: 'Summer Concert',
      summary: 'A chamber music evening',
      artists: ['Quartet'],
      date: '2026-08-12',
      location: 'Bergharen',
      description: {
        type: 'doc',
        content: [],
      },
      images: [],
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDialogRowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationDialogRowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('story', story);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the event title', () => {
    expect(fixture.nativeElement.textContent).toContain('Summer Concert');
  });
});
