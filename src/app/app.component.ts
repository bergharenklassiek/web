import { Component, Inject, OnInit, afterNextRender, inject, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './ui/components/header/header.component';
import { FooterComponent } from './ui/components/footer/footer.component';
import { scrollLeftKey } from './app.config';

import { config, dom } from "@fortawesome/fontawesome-svg-core";
import { Dispatcher } from '@ngrx/signals/events';
import { loadContactItems, loadEvents } from './core/store/content.events';
import { ContentStore } from './core/store/content.store';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, HeaderComponent, FooterComponent],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  // Injected so the store exists and reacts to the events below
  private readonly store = inject(ContentStore);
  private readonly dispatcher = inject(Dispatcher);

  constructor(@Inject(DOCUMENT) private document: Document) {
    afterNextRender(() => localStorage.removeItem(scrollLeftKey));

    config.autoAddCss = false;
    let head = this.document.getElementsByTagName("head")[0];
    let styleNode = this.document.createElement("style");
    styleNode.innerHTML = dom.css(); // grab FA's CSS
    head.appendChild(styleNode);
  }

  ngOnInit(): void {
    this.dispatcher.dispatch(loadEvents({ past: false }));
    this.dispatcher.dispatch(loadContactItems());
  }
}
