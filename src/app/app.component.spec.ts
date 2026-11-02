import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { ContentService } from './core/services/content.service';
import { ContentStore } from './core/store/content.store';

describe('AppComponent', () => {
  it('should load the upcoming concerts and contact details once, for the whole site', () => {
    const loadEvents = vi.fn(() => of([]));
    const loadContactItems = vi.fn(() => of([{ id: '1', slug: 'name', content: { type: 'name', displayValue: 'Stichting' } }]));
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: ContentService, useValue: { loadEvents, loadContactItems } }],
    });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(loadEvents).toHaveBeenCalledTimes(1);
    expect(loadEvents).toHaveBeenCalledWith(false);
    expect(loadContactItems).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(ContentStore).eventsLoaded().upcoming).toBe(true);
    expect(fixture.nativeElement.querySelector('app-footer').textContent).toContain('Stichting');
  });

  it('should mark the page content as the main landmark', () => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: ContentService, useValue: { loadEvents: () => of([]), loadContactItems: () => of([]) } }],
    });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('main router-outlet')).not.toBeNull();
  });
});
