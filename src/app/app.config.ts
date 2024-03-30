import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { InMemoryScrollingOptions, provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';
registerLocaleData(localeNl);

const scrollConfig: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled',
}; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling(scrollConfig)), 
    provideClientHydration(), 
    provideHttpClient(withFetch()), 
    { provide: LOCALE_ID, useValue: 'nl'}
  ]
};

export const scrollListKey = 'scroll-list';
export const scrollLeftKey = 'scrollLeft';