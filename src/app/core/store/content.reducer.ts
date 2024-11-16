import { createReducer, on } from "@ngrx/store";
import { Event } from "../models/event";
import { loadAboutPageSuccess, loadContactItemsSuccess, loadContentPage, loadContentPageSuccess, loadEvents, loadEventsSuccess, loadEventSuccess, loadHomePageSuccess, removeEvents } from "./content.actions";
import { Story } from "../models/story";
import { HomePage } from "../models/home-page";
import { ContactItem } from "../models/contact-item";
import { AboutPage } from "../models/about-page";
import { ContentPage } from "../models/content-page";

export interface ContentState {
    isLoading: boolean;
    homePage?: Story<HomePage>;
    contactItems: Story<ContactItem>[];
    aboutPage?: Story<AboutPage>;
    contentPages: Story<ContentPage>[];
    events: Story<Event>[];
}

export const initialState: ContentState = {
    isLoading: false,
    homePage: undefined,
    contactItems: [],
    aboutPage: undefined,
    contentPages: [],
    events: []
};

export const contentReducer = createReducer(
    initialState,
    on(loadHomePageSuccess, (state, action) => ({ ...state, homePage: action.homePage })),
    on(loadContactItemsSuccess, (state, action) => ({ ...state, contactItems: action.contactItems })),
    on(loadAboutPageSuccess, (state, action) => ({ ...state, aboutPage: action.aboutPage })),
    on(loadContentPage, (state) => ({ ...state, isLoading: true })),
    on(loadContentPageSuccess, (state, action) => ({ 
        ...state, 
        isLoading: false, 
        contentPages: state.contentPages.map(c => c.id === action.contentPage.id ? action.contentPage : c)
    })),
    on(loadEvents, (state) => ({ ...state, isLoading: true })),
    on(loadEventsSuccess, (state, { events }) => ({ 
        ...state, 
        isLoading: false, 
        events: state.events.concat(events.filter(e => state.events.findIndex(storedEvent => storedEvent.id === e.id) === -1))
    })),
    on(removeEvents, (_) => ( initialState )),
    on(loadEventSuccess, (state, action) => ({
        ...state,
        events: state.events.map(e => e.id).findIndex(e => e === action.event.id) > -1
            ? state.events.map(e => e.id === action.event.id ? action.event : e)
            : state.events.concat(action.event) 
    }))
)