import { TestBed } from '@angular/core/testing';
import { faBars, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  function render(icon: IconDefinition, size?: 'lg' | 'xl'): SVGElement {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('icon', icon);
    if (size) {
      fixture.componentRef.setInput('size', size);
    }
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('svg');
  }

  it('should draw the icon, hidden from screen readers', () => {
    const svg = render(faBars);

    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${faBars.icon[0]} ${faBars.icon[1]}`);
    expect(svg.querySelector('path')?.getAttribute('d')).toBe(faBars.icon[4]);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.classList.contains('app-icon--lg')).toBe(true);
  });

  it('should use the given size', () => {
    expect(render(faBars, 'xl').classList.contains('app-icon--xl')).toBe(true);
  });

  it('should join an icon with multiple paths', () => {
    const icon = { ...faBars, icon: [10, 20, [], 'f000', ['M1', 'M2']] } as unknown as IconDefinition;

    expect(render(icon).querySelector('path')?.getAttribute('d')).toBe('M1 M2');
  });
});
