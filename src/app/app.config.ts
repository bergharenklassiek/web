import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { InMemoryScrollingOptions, provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';

import { routes } from './core/routing/app.routes';
import { provideClientHydration, withHttpTransferCacheOptions, withIncrementalHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import * as contentEffects from '../app/core/store/content.effects';
import { contentReducer } from './core/store/content.reducer';
import { storeDevtoolsProviders } from './core/store/store-devtools';

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
    provideStore({
        content: contentReducer
    }),
    provideEffects(contentEffects),
    storeDevtoolsProviders,
],
};

export const scrollListKey = 'scroll-list';
export const scrollLeftKey = 'scrollLeft';