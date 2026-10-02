import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventListItemComponent } from './event-list-item.component';
import { provideRouter } from '@angular/router';
import { Event } from '../../../core/models/event';

describe('EventListItemComponent', () => {
  let component: EventListItemComponent;
  let fixture: ComponentFixture<EventListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [EventListItemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventListItemComponent);
    component = fixture.componentInstance;
    component.story = {
      id: '123',
      slug: 'event-123',
      content: { title: 'Event', date: '2025-03-08 20:00', images: [] } as unknown as Event
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
