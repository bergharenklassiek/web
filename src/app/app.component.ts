import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { HeaderComponent } from './ui/components/header/header.component';
import { FooterComponent } from './ui/components/footer/footer.component';
import { ContentService } from './core/services/content.service';
import { ClickOutsideDirective } from './core/directives/click-outside.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FaIconComponent, HeaderComponent, FooterComponent, ClickOutsideDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  faCoffee = faCoffee;
  openMenu = false;

  constructor(private contentService: ContentService) {}
  
  ngOnInit(): void {
    this.contentService.loadData();
  }

  onOpenMenu(event: boolean) {
    this.openMenu = event;
  }

  onCloseMenu(event: MouseEvent) {
    if (typeof (event.target as any).parentElement?.className.includes === 'function' && 
      !(event.target as any)?.parentElement?.className?.includes('app-header__menu')
    ) {
      this.openMenu = false;
    }
  }
}
