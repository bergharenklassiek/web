import { registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';

// The app registers this in app.config.ts, which tests don't load
registerLocaleData(localeNl);
