import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

/**
 * Draws a Font Awesome icon as inline SVG. Only the icon data is needed, not Font Awesome's much larger runtime and
 * stylesheet.
 */
@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  icon = input.required<IconDefinition>();
  size = input<'lg' | 'xl'>('lg');

  viewBox = computed(() => {
    const [width, height] = this.icon().icon;
    return `0 0 ${width} ${height}`;
  });
  path = computed(() => {
    const path = this.icon().icon[4];
    return Array.isArray(path) ? path.join(' ') : path;
  });
}
