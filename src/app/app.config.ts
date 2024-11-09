import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { InMemoryScrollingOptions, provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import * as contentEffects from '../app/core/store/content.effects';
import { contentReducer } from './core/store/content.reducer';

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
    { provide: LOCALE_ID, useValue: 'nl' },
    { provide: DatePipe, useClass: DatePipe },
    provideStore({
      content: contentReducer
    }),
    provideEffects(contentEffects)
  ],
};

export const scrollListKey = 'scroll-list';
export const scrollLeftKey = 'scrollLeft';