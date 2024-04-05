import { Component } from '@angular/core';
import { ContactDetailsComponent } from '../../components/contact-details/contact-details.component';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [ContactDetailsComponent],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss'
})
export class ContactPageComponent {

}
