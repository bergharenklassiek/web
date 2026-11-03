import { TestBed } from '@angular/core/testing';
import { BackNextYearTileComponent } from './back-next-year-tile.component';

describe('BackNextYearTileComponent', () => {
  function render(compact: boolean): HTMLElement {
    const fixture = TestBed.createComponent(BackNextYearTileComponent);
    fixture.componentRef.setInput('compact', compact);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('should say that we will be back next year', () => {
    const element = render(false);

    expect(element.textContent).toContain('Volgend jaar zijn we er weer!');
    expect(element.textContent).toContain('nieuwe programma');
  });

  it('should only show the title when compact', () => {
    const element = render(true);

    expect(element.textContent).toContain('Volgend jaar zijn we er weer!');
    expect(element.textContent).not.toContain('nieuwe programma');
  });
});
