import { createAction, props } from "@ngrx/store";
import { Event } from "../models/event";
import { Story } from "../models/story";

export const loadEvents = createAction('[Content] Load events', props<{ loadPast: boolean}>());
export const loadEventsSuccess = createAction('[Content] Load events success', props<{ events: Story<Event>[]}>());
export const removeEvents = createAction('[Content] Remove events');
export const loadEvent = createAction('[Content] Load event', props<{ eventSlug: string }>());
export const loadEventSuccess = createAction('[Content] Load event success', props<{ event: Story<Event> }>());