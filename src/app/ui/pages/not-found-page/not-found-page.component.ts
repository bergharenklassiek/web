import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../core/seo/seo.service';

@Component({
    selector: 'app-not-found-page',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './not-found-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './not-found-page.component.scss'
})
export class NotFoundPageComponent {
  constructor() {
    inject(SeoService).update({ title: 'Pagina niet gevonden', noindex: true });
  }
}
