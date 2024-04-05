import { Component } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ContactDetailsComponent } from '../contact-details/contact-details.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [FaIconComponent,ContactDetailsComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {}
