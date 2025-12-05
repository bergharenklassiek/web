import { createReducer, on } from "@ngrx/store";
import { Event } from "../models/event";
import { displayPastEvents, loadAboutPageSuccess, loadContactItemsSuccess, loadContentPage, loadContentPageSuccess, loadEvents, loadEventsSuccess, loadEventSuccess, loadHomePageSuccess, removeEvents } from "./content.actions";
import { Story } from "../models/story";
import { HomePage } from "../models/home-page";
import { ContactItem } from "../models/contact-item";
import { AboutPage } from "../models/about-page";
import { ContentPage } from "../models/content-page";

export interface ContentState {
    isLoading: boolean;
    displayPastEvents: boolean;
    events: Story<Event>[];
    eventsLoaded: {
        past: boolean;
        future: boolean;
    };
    homePage?: Story<HomePage>;
    contactItems: Story<ContactItem>[];
    aboutPage?: Story<AboutPage>;
    contentPages: Story<ContentPage>[];
}

export const initialState: ContentState = {
    isLoading: false,
    displayPastEvents: false,
    events: [],
    eventsLoaded: {
        past: false,
        future: false
    },
    homePage: undefined,
    contactItems: [],
    aboutPage: undefined,
    contentPages: [],
};

export const contentReducer = createReducer(
    initialState,
    on(loadHomePageSuccess, (state, { homePage }) => ({ ...state, homePage })),
    on(loadContactItemsSuccess, (state, { contactItems }) => ({ ...state, contactItems })),
    on(loadAboutPageSuccess, (state, { aboutPage }) => ({ ...state, aboutPage })),
    on(loadContentPage, (state) => ({ ...state, isLoading: true })),
    on(loadContentPageSuccess, (state, { contentPage }) => ({ 
        ...state, 
        isLoading: false, 
        contentPages: state.contentPages.map(e => e.id).findIndex(e => e === contentPage.id) > -1
            ? state.contentPages.map(c => c.id === contentPage.id ? contentPage : c)
            : state.contentPages.concat(contentPage)
    })),
    on(loadEvents, (state) => ({ ...state, isLoading: true })),
    on(loadEventsSuccess, (state, { events, pastEvents }) => ({ 
        ...state, 
        isLoading: false,
        eventsLoaded: pastEvents ? { ...state.eventsLoaded, past: pastEvents } : { ...state.eventsLoaded, future: !pastEvents },
        events: state.events.concat(events.filter(e => state.events.findIndex(storedEvent => storedEvent.id === e.id) === -1))
    })),
    on(removeEvents, (_) => ( initialState )),
    on(loadEventSuccess, (state, { event }) => ({
        ...state,
        events: state.events.map(e => e.id).findIndex(e => e === event.id) > -1
            ? state.events.map(e => e.id === event.id ? event : e)
            : state.events.concat(event) 
    })),
    on(displayPastEvents, (state, { displayPastEvents}) => ({ ...state, displayPastEvents }))
)