import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-back-next-year-tile',
    standalone: true,
    templateUrl: './back-next-year-tile.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './back-next-year-tile.component.scss'
})
export class BackNextYearTileComponent {
  // Matches the agenda's list rows instead of the home page's cards
  @Input() compact = false;
}
