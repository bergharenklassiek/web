import { Component } from '@angular/core';
import { ContactDetailsComponent } from '../contact-details/contact-details.component';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [ContactDetailsComponent],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
})
export class FooterComponent {}
