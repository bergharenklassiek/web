import { Routes } from '@angular/router';
import { EventPageComponent } from './ui/pages/event-page/event-page.component';
import { HomePageComponent } from './ui/pages/home-page/home-page.component';
import { NotFoundPageComponent } from './ui/pages/not-found-page/not-found-page.component';
import { AgendaPageComponent } from './ui/pages/agenda-page/agenda-page.component';
import { ContactPageComponent } from './ui/pages/contact-page/contact-page.component';

export const routes: Routes = [
    { path: 'agenda', component: AgendaPageComponent },
    { path: 'contact', component: ContactPageComponent },
    { path: 'events/:event-slug', component: EventPageComponent },
    { path: '', component: HomePageComponent },
    { path: '**', component: NotFoundPageComponent }
];
