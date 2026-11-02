import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { InMemoryScrollingOptions, provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';

import { routes } from './core/routing/app.routes';
import { provideClientHydration, withHttpTransferCacheOptions, withIncrementalHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';

registerLocaleData(localeNl);

const scrollConfig: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled',
}; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, 
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withViewTransitions({ skipInitialTransition: true })
    ),
    provideClientHydration(
      withIncrementalHydration(),
      withHttpTransferCacheOptions({
        includeRequestsWithAuthHeaders: true,
      })
    ),
    provideHttpClient(withFetch()),
    { provide: LOCALE_ID, useValue: 'nl' },
    { provide: DatePipe, useClass: DatePipe },
],
};

export const scrollListKey = 'scroll-list';
export const scrollLeftKey = 'scrollLeft';