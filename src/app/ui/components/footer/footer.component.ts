import { Component } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition, faAt, faEuroSign, faFileLines, faLocationDot, faSignature } from '@fortawesome/free-solid-svg-icons';

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
    'account': faEuroSign,
    'email': faAt,
    'address': faLocationDot,
  };

  contactDetails = [
    { type: 'name', value: 'Stichting Bergharen Klassiek' },
    { type: 'kvk', value: '12345678' },
    { type: 'account', value: 'NL12ABNA012345678' },
    { type: 'email', value: 'bergharenklassiek@outlook.com' },
    { type: 'address', value: 'Veldsestraat 10, Bergharen' }
  ];
}
