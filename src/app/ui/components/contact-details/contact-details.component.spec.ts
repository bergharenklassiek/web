import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dispatcher } from '@ngrx/signals/events';
import { ContentService } from '../../../core/services/content.service';
import { contactItemsLoaded } from '../../../core/store/content.events';
import { ContentStore } from '../../../core/store/content.store';
import { ContactDetailsComponent } from './contact-details.component';

describe('ContactDetailsComponent', () => {
  let fixture: ComponentFixture<ContactDetailsComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ContactDetailsComponent],
      providers: [{ provide: ContentService, useValue: {} }],
    });
    TestBed.inject(ContentStore);
    fixture = TestBed.createComponent(ContactDetailsComponent);
    TestBed.inject(Dispatcher).dispatch(contactItemsLoaded({
      contactItems: [
        { id: '1', slug: 'name', content: { type: 'name', displayValue: 'Stichting' } },
        { id: '2', slug: 'email', content: { type: 'email', displayValue: 'mail@example.com', link: { url: 'mailto:mail@example.com' } } },
        { id: '3', slug: 'address', content: { type: 'address', displayValue: 'Veldsestraat 12', link: { url: 'https://maps.example.com' } } },
      ] as never,
    }));
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should show every item with an icon', () => {
    expect(element.querySelectorAll('.app-contact-details__item').length).toBe(3);
    expect(element.querySelectorAll('svg').length).toBe(3);
  });

  it('should only link the email address and the address', () => {
    const links = [...element.querySelectorAll('a')];

    expect(links.map((a) => a.getAttribute('href'))).toEqual(['mailto:mail@example.com', 'https://maps.example.com']);
    expect(element.textContent).toContain('Stichting');
  });
});
