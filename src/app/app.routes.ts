import { Routes } from '@angular/router';
import { EventPageComponent } from './ui/pages/event-page/event-page.component';
import { HomePageComponent } from './ui/pages/home-page/home-page.component';
import { LoadingPageComponent } from './ui/pages/loading-page/loading-page.component';

export const routes: Routes = [
    { path: 'events/:event-slug', component: EventPageComponent },
    { path: '', component: HomePageComponent },
    { path: '**', component: LoadingPageComponent }
];
