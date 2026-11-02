import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SeoService } from '../../../core/seo/seo.service';
import { ContactDetailsComponent } from '../../components/contact-details/contact-details.component';

@Component({
    selector: 'app-contact-page',
    standalone: true,
    imports: [ContactDetailsComponent],
    templateUrl: './contact-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './contact-page.component.scss'
})
export class ContactPageComponent {
  constructor() {
    inject(SeoService).update({
      title: 'Contact',
      description: 'Contactgegevens van Stichting Bergharen Klassiek en het adres van de Protestantse Kerk te Bergharen.',
      path: '/contact',
    });
  }
}
