import { Routes } from '@angular/router';
import { EventPageComponent } from './ui/pages/event-page/event-page.component';
import { HomePageComponent } from './ui/pages/home-page/home-page.component';
import { NotFoundPageComponent } from './ui/pages/not-found-page/not-found-page.component';
import { AgendaPageComponent } from './ui/pages/agenda-page/agenda-page.component';
import { ContactPageComponent } from './ui/pages/contact-page/contact-page.component';
import { AboutPageComponent } from './ui/pages/about-page/about-page.component';
import { ContentPageComponent } from './ui/pages/content-page/content-page.component';

export const routes: Routes = [
    { path: 'agenda', component: AgendaPageComponent },
    { path: 'contact', component: ContactPageComponent },
    { path: 'events/:event-slug', redirectTo: '/agenda/:event-slug', pathMatch: 'full' },
    { path: 'agenda/:event-slug', component: EventPageComponent },
    { path: 'over-ons', component: AboutPageComponent },
    { path: 'gebouw', component: ContentPageComponent },
    { path: 'concerten-in-de-regio', component: ContentPageComponent },
    { path: 'anbi', component: ContentPageComponent },
    { path: '', component: HomePageComponent },
    { path: '**', component: NotFoundPageComponent }
];
