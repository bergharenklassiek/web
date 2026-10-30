import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-not-found-page',
    standalone: true,
    templateUrl: './not-found-page.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './not-found-page.component.scss'
})
export class NotFoundPageComponent {}
