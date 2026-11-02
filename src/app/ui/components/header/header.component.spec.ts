import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import { provideRouter, Router } from '@angular/router';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [HeaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('menu', () => {
    const isOpen = () => !!fixture.nativeElement.querySelector('.app-header__menu--open');

    it('should open and close', () => {
      expect(isOpen()).toBe(false);

      fixture.nativeElement.querySelector('.app-header__menu-button').click();
      fixture.detectChanges();
      expect(isOpen()).toBe(true);

      fixture.nativeElement.querySelector('.app-header__menu__close-button').click();
      fixture.detectChanges();
      expect(isOpen()).toBe(false);
    });

    it('should close on every navigation, also with the back button', async () => {
      fixture.nativeElement.querySelector('.app-header__menu-button').click();
      fixture.detectChanges();

      await TestBed.inject(Router).navigateByUrl('/');
      fixture.detectChanges();

      expect(isOpen()).toBe(false);
    });
  });
});
