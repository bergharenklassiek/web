import { type } from '@ngrx/signals';
import { event } from '@ngrx/signals/events';
import { AboutPage } from '../models/about-page';
import { ContactItem } from '../models/contact-item';
import { ContentPage } from '../models/content-page';
import { Event } from '../models/event';
import { HomePage } from '../models/home-page';
import { Story } from '../models/story';

// HOME PAGE
export const loadHomePage = event('[Home Page] Load home page');
export const homePageLoaded = event('[Home Page] Loaded', type<{ homePage: HomePage }>());

// ABOUT PAGE
export const loadAboutPage = event('[About Page] Load about page');
export const aboutPageLoaded = event('[About Page] Loaded', type<{ aboutPage: Story<AboutPage> }>());

// CONTENT PAGES
export const loadContentPage = event('[Content Page] Load content page', type<{ slug: string }>());
export const contentPageLoaded = event('[Content Page] Loaded', type<{ contentPage: Story<ContentPage> }>());

// CONTACT ITEMS
export const loadContactItems = event('[Contact] Load contact items');
export const contactItemsLoaded = event('[Contact] Loaded', type<{ contactItems: Story<ContactItem>[] }>());

// EVENTS
export const loadEvents = event('[Events] Load events', type<{ past: boolean }>());
export const eventListLoaded = event('[Events] List loaded', type<{ events: Story<Event>[]; past: boolean }>());
export const displayPastEvents = event('[Events] Display past events', type<{ display: boolean }>());
export const loadEvent = event('[Events] Load event', type<{ slug: string }>());
export const eventLoaded = event('[Events] Event loaded', type<{ event: Story<Event> }>());
export const eventNotFound = event('[Events] Event not found', type<{ slug: string }>());
export const earlierEventsLoaded = event('[Events] Earlier events loaded', type<{ events: Story<Event>[] }>());
