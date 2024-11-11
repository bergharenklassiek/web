import { createReducer, on } from "@ngrx/store";
import { Event } from "../models/event";
import { loadEvents, loadEventsSuccess, loadEventSuccess, loadHomePageSuccess, removeEvents } from "./content.actions";
import { Story } from "../models/story";
import { HomePage } from "../models/home-page";

export interface ContentState {
    isLoading: boolean;
    homePage?: Story<HomePage>;
    events: Story<Event>[];
}

export const initialState: ContentState = {
    isLoading: false,
    homePage: undefined,
    events: []
};

export const contentReducer = createReducer(
    initialState,
    on(loadHomePageSuccess, (state, action) => ({ ...state, homePage: action.homePage })),
    on(loadEvents, (state) => ({ ...state, isLoading: true })),
    on(loadEventsSuccess, (state, { events }) => ({ 
        ...state, 
        isLoading: false, 
        events: state.events.concat(events.filter(e => state.events.findIndex(storedEvent => storedEvent.id === e.id) === -1))
    })),
    on(removeEvents, (_) => ( initialState )),
    on(loadEventSuccess, (state, action) => ({
        ...state,
        events: state.events.indexOf(action.event) > -1 
            ? state.events.splice(state.events.indexOf(action.event), 1)
            : state.events.concat(action.event)
    }))
)