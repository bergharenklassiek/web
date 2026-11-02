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
    component = fixture.componentInstance;
    component.story = {
      id: '123',
      slug: 'event-123',
      content: { title: 'Pianorecital', summary: 'Met Anna', date: '2026-11-22 16:00', images: [] } as unknown as Event
    };
    fixture.detectChanges();
  });

  it('should show the concert and link to it', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('Pianorecital');
    expect(element.textContent).toContain('Met Anna');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/agenda/event-123');
  });

  it('should show the logo for a concert without photos', () => {
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toContain('/full-logo-BK.png');
  });
});
