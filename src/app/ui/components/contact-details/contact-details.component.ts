import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { faSignature, faFileLines, faEuroSign, faAt, faLocationDot, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { IconComponent } from '../icon/icon.component';
import { ContentStore } from '../../../core/store/content.store';

@Component({
    selector: 'app-contact-details',
    standalone: true,
    imports: [IconComponent],
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
