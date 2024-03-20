import { Component, EventEmitter, Output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faClose } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  menuIcon = faBars;
  closeIcon = faClose;
  menuOpen = false;

  onClickMenuIcon() {
    console.log('onClickMenuIcon');
    this.menuOpen = true;
  }

  onClose() {
    this.menuOpen = false;
  }
}

