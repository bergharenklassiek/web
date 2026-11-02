import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Event } from '../../../core/models/event';
import { Story } from '../../../core/models/story';
import { ContentService } from '../../../core/services/content.service';
import { AgendaPageComponent } from './agenda-page.component';

describe('AgendaPageComponent', () => {
  const story = (id: string, date: string): Story<Event> => ({
    id,
    slug: id,
    content: { title: id, date, images: [] } as unknown as Event,
  });

  let fixture: ComponentFixture<AgendaPageComponent>;
  let element: HTMLElement;
  let loadEvents: ReturnType<typeof vi.fn>;

  function setup(upcoming: Story<Event>[], past: Story<Event>[]) {
    loadEvents = vi.fn((isPast: boolean) => of(isPast ? past : upcoming));
    TestBed.configureTestingModule({
      imports: [AgendaPageComponent],
      providers: [provideRouter([]), { provide: ContentService, useValue: { loadEvents } }],
    });
    fixture = TestBed.createComponent(AgendaPageComponent);
    fixture.componentInstance.onClick(false);
    fixture.detectChanges();
    element = fixture.nativeElement;
  }

  const items = () => element.querySelectorAll('app-event-list-item').length;
  const toggle = (label: string) => {
    [...element.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(label))!.click();
    fixture.detectChanges();
  };

  it('should show upcoming concerts first', () => {
    setup([story('nieuw', '2999-01-01 16:00')], []);

    expect(items()).toBe(1);
    expect(TestBed.inject(ContentService).loadEvents).toHaveBeenCalledWith(false);
  });

  it('should switch between past and upcoming concerts, loading each list once', () => {
    setup([story('nieuw', '2999-01-01 16:00')], [story('oud1', '2000-01-01 16:00'), story('oud2', '2001-01-01 16:00')]);

    toggle('Eerder');
    expect(items()).toBe(2);

    toggle('Binnenkort');
    expect(items()).toBe(1);

    toggle('Eerder');
    expect(loadEvents).toHaveBeenCalledTimes(2);
  });

  it('should explain when there are no upcoming concerts', () => {
    setup([], []);

    expect(element.textContent).toContain('druk bezig met ons programma');
  });

  it('should not show that message for past concerts', () => {
    setup([], []);

    toggle('Eerder');

    expect(element.textContent).not.toContain('druk bezig met ons programma');
  });

  it('should show which list is selected', () => {
    setup([], []);
    const pressed = () => element.querySelector('[aria-pressed="true"]')?.textContent;

    expect(pressed()).toContain('Binnenkort');

    toggle('Eerder');

    expect(pressed()).toContain('Eerder');
  });
});
