import { Component } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faSignature, faFileLines, faEuroSign, faAt, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { ContentService } from '../../../core/services/content.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-contact-details',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './contact-details.component.html',
  styleUrl: './contact-details.component.scss'
})
export class ContactDetailsComponent {
  iconsContactTypesMap: { [key: string]: IconDefinition } = {
    'name': faSignature,
    'kvk': faFileLines,
    'bankaccount': faEuroSign,
    'email': faAt,
    'address': faLocationDot,
  };
  contactList = this.contentService.contactList;

  constructor(private contentService: ContentService) {}
}
