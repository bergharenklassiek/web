import { Routes } from '@angular/router';
import { ROUTE_NAMES } from './route-names';

export const routes: Routes = [
    { 
        path: ROUTE_NAMES.AGENDA, 
        loadComponent: () => import('../../ui/pages/agenda-page/agenda-page.component').then(m => m.AgendaPageComponent),
        pathMatch: 'full'
    },
    { 
        path: ROUTE_NAMES.CONTACT, 
        loadComponent: () => import('../../ui/pages/contact-page/contact-page.component').then(m => m.ContactPageComponent),
        pathMatch: 'full'
    },
    {
        path: `${ROUTE_NAMES.EVENTS}/:event-slug`, 
        redirectTo: `${ROUTE_NAMES.AGENDA}/:event-slug`, 
        pathMatch: 'full'
    },
    { 
        path: `${ROUTE_NAMES.AGENDA}/:event-slug`, 
        loadComponent: () => import('../../ui/pages/event-page/event-page.component').then(m => m.EventPageComponent),
        pathMatch: 'full'
    },
    { 
        path: ROUTE_NAMES.ABOUT, 
        loadComponent: () => import('../../ui/pages/about-page/about-page.component').then(m => m.AboutPageComponent),
        pathMatch: 'full'
    },
    { 
        path: ROUTE_NAMES.GEBOUW, 
        loadComponent: () => import('../../ui/pages/content-page/content-page.component').then(m => m.ContentPageComponent),
        pathMatch: 'full'
    },
    { 
        path: ROUTE_NAMES.CONCERTEN_IN_DE_REGIO, 
        loadComponent: () => import('../../ui/pages/content-page/content-page.component').then(m => m.ContentPageComponent),
        pathMatch: 'full'
    },
    { 
        path: ROUTE_NAMES.ANBI, 
        loadComponent: () => import('../../ui/pages/content-page/content-page.component').then(m => m.ContentPageComponent),
        pathMatch: 'full'
    },
    { 
        path: ROUTE_NAMES.HOME, 
        loadComponent: () => import('../../ui/pages/home-page/home-page.component').then(m => m.HomePageComponent),
        pathMatch: 'full'
    },
    { 
        path: ROUTE_NAMES.WILDCARD,
        loadComponent: () => import('../../ui/pages/not-found-page/not-found-page.component').then(m => m.NotFoundPageComponent)
    }
];
