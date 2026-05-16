import { provideServerRendering, withRoutes } from '@angular/ssr';
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { appConfig } from './app.config';
import { registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';
import { serverRoutes } from './core/routing/app.routes.server';

registerLocaleData(localeNl);

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
