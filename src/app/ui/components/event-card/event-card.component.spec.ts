import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCardComponent } from './event-card.component';
import { provideRouter } from '@angular/router';
import { Event } from '../../../core/models/event';

describe('EventCardComponent', () => {
  let component: EventCardComponent;
  let fixture: ComponentFixture<EventCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [EventCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventCardComponent);
    component.story = {
      id: '123',
      slug: 'event-123',
      content: {} as Event
    }

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
