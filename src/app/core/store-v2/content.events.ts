import { type } from '@ngrx/signals';
import { event } from '@ngrx/signals/events';
import { HomePage } from '../models/home-page';

// HOME PAGE
export const loadHomePage = event(
    '[Home Page] Load home page'
);

export const homePageLoaded = event(
    '[Home Page] Loaded',
    type<{ homePage: HomePage }>()
);