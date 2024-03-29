import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faClose } from '@fortawesome/free-solid-svg-icons';
import { filter, tap } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FaIconComponent, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  menuIcon = faBars;
  closeIcon = faClose;
  menuOpen = false;

  constructor(private router: Router) {}
  
  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      tap(() => this.menuOpen = false)
    );
  }

  onClickMenuIcon() {
    this.menuOpen = true;
  }

  onClose() {
    this.menuOpen = false;
  }
}

