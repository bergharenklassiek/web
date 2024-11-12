import { Component } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faSignature, faFileLines, faEuroSign, faAt, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { ContentService } from '../../../core/services/content.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Observable } from 'rxjs';
import { Story } from '../../../core/models/story';
import { ContactItem } from '../../../core/models/contact-item';
import { select, Store } from '@ngrx/store';
import { selectContactItems } from '../../../core/store/content.selectors';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-contact-details',
  standalone: true,
  imports: [FaIconComponent, AsyncPipe],
  templateUrl: './contact-details.component.html',
  styleUrl: './contact-details.component.scss'
})
export class ContactDetailsComponent {
  iconsContactTypesMap: { [key: string]: IconDefinition } = {
    'name': faSignature,
    'kvk': faFileLines,
    'fiscalnumber': faFileLines,
    'bankaccount': faEuroSign,
    'email': faAt,
    'address': faLocationDot,
  };
  contactItems$?: Observable<Story<ContactItem>[]> = this.store.pipe(select(selectContactItems));

  constructor(private store: Store) {}
}
