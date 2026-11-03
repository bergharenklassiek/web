import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { of, Subject } from 'rxjs';
import { Event } from '../../../core/models/event';
import { Story } from '../../../core/models/story';
import { ContentService } from '../../../core/services/content.service';
import { eventLoaded } from '../../../core/store/content.events';
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

  it('should add a tile about next year when there is one upcoming concert, only in that list', () => {
    setup([story('nieuw', '2999-01-01 16:00')], [story('oud', '2000-01-01 16:00')]);
    const tile = () => element.querySelector('app-back-next-year-tile');

    expect(tile()).not.toBeNull();

    toggle('Eerder');

    expect(tile()).toBeNull();
  });

  it('should not show the tile with several upcoming concerts', () => {
    setup([story('nieuw1', '2999-01-01 16:00'), story('nieuw2', '2999-02-01 16:00')], []);

    expect(element.querySelector('app-back-next-year-tile')).toBeNull();
  });

  it('should not show the tile without upcoming concerts', () => {
    setup([], []);

    expect(element.querySelector('app-back-next-year-tile')).toBeNull();
  });

  it('should wait for the list before showing the tile, when a concert page already stored one concert', () => {
    const concert = story('nieuw', '2999-01-01 16:00');
    const list = new Subject<Story<Event>[]>();
    TestBed.configureTestingModule({
      imports: [AgendaPageComponent],
      providers: [provideRouter([]), { provide: ContentService, useValue: { loadEvents: () => list } }],
    });
    fixture = TestBed.createComponent(AgendaPageComponent);
    element = fixture.nativeElement;
    fixture.componentInstance.onClick(false);
    TestBed.inject(Dispatcher).dispatch(eventLoaded({ event: concert }));
    fixture.detectChanges();

    expect(items()).toBe(1);
    expect(element.querySelector('app-back-next-year-tile')).toBeNull();

    list.next([concert]);
    fixture.detectChanges();

    expect(element.querySelector('app-back-next-year-tile')).not.toBeNull();
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
