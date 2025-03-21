import { Component, Inject, afterNextRender } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { HeaderComponent } from './ui/components/header/header.component';
import { FooterComponent } from './ui/components/footer/footer.component';
import { scrollLeftKey } from './app.config';
import { DOCUMENT } from '@angular/common';
import { config, dom } from "@fortawesome/fontawesome-svg-core";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  faCoffee = faCoffee;
  openMenu = false;

  constructor(@Inject(DOCUMENT) private document: Document) {
    afterNextRender(() => localStorage.removeItem(scrollLeftKey));

    config.autoAddCss = false;
    let head = this.document.getElementsByTagName("head")[0];
    let styleNode = this.document.createElement("style");
    styleNode.innerHTML = dom.css(); // grab FA's CSS
    head.appendChild(styleNode);
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
