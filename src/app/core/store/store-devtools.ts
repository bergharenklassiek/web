import { provideStoreDevtools } from '@ngrx/store-devtools';

// Replaced by store-devtools.prod.ts in production builds (see angular.json), to keep DevTools out of the bundle
export const storeDevtoolsProviders = [
  provideStoreDevtools({
    maxAge: 25,
    autoPause: true,
    trace: true,
    traceLimit: 75,
    connectInZone: true,
  }),
];
