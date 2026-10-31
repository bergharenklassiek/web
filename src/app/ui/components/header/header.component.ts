import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faClose } from '@fortawesome/free-solid-svg-icons';
import { filter } from 'rxjs';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [FaIconComponent, RouterModule],
    templateUrl: './header.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './header.component.scss'
})
export class HeaderComponent {
  menuIcon = faBars;
  closeIcon = faClose;
  menuOpen = signal(false);

  constructor() {
    // Also close the menu when navigating another way, e.g. with the browser's back button
    inject(Router).events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => this.menuOpen.set(false));
  }

  onClickMenuIcon() {
    this.menuOpen.set(true);
  }

  onClose() {
    this.menuOpen.set(false);
  }
}

