import { createReducer, on } from "@ngrx/store";
import { Event } from "../models/event";
import { loadEvents, loadEventsSuccess, loadEventSuccess, removeEvents } from "./content.actions";
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