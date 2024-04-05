import { Component, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition, faAt, faEuroSign, faFileLines, faLocationDot, faSignature } from '@fortawesome/free-solid-svg-icons';
import { ContentService } from '../../../core/services/content.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
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
