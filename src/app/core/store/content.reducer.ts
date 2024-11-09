import { createReducer, on } from "@ngrx/store";
import { Event } from "../models/event";
import { loadPastEvents, loadPastEventsSuccess } from "./content.actions";
import { Story } from "../models/story";

export interface ContentState {
    isLoading: boolean;
    events: Story<Event>[];
}

export const initialState: ContentState = {
    isLoading: false,
    events: []
};

export const contentReducer = createReducer(
    initialState,
    on(loadPastEvents, (state) => ({ ...state, isLoading: true })),
    on(loadPastEventsSuccess, (state, { events }) => ({ 
        ...state, 
        isLoading: false, 
        events: state.events.concat(events.filter(e => state.events.findIndex(storedEvent => storedEvent.id === e.id) === -1))
    }))
)