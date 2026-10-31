import { Component, Inject, OnInit, afterNextRender, inject, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './ui/components/header/header.component';
import { FooterComponent } from './ui/components/footer/footer.component';
import { scrollLeftKey } from './app.config';

import { config, dom } from "@fortawesome/fontawesome-svg-core";
import { Store } from '@ngrx/store';
import { loadEvents } from './core/store/content.actions';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, HeaderComponent, FooterComponent],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private readonly store = inject(Store);

  constructor(@Inject(DOCUMENT) private document: Document) {
    afterNextRender(() => localStorage.removeItem(scrollLeftKey));

    config.autoAddCss = false;
    let head = this.document.getElementsByTagName("head")[0];
    let styleNode = this.document.createElement("style");
    styleNode.innerHTML = dom.css(); // grab FA's CSS
    head.appendChild(styleNode);
  }

  ngOnInit(): void {
    this.store.dispatch(loadEvents({ loadPast: false }));
  }
}
