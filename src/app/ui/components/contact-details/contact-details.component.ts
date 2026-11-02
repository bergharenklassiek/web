import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faSignature, faFileLines, faEuroSign, faAt, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ContentStore } from '../../../core/store/content.store';

@Component({
    selector: 'app-contact-details',
    standalone: true,
    imports: [FaIconComponent],
    templateUrl: './contact-details.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
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
  contactItems = inject(ContentStore).contactItems;
}
