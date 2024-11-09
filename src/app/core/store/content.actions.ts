import { createAction, props } from "@ngrx/store";
import { Event } from "../models/event";
import { Story } from "../models/story";

export const loadPastEvents = createAction('[Content] Load past events');
export const loadPastEventsSuccess = createAction('[Content] Load past events success', props<{ events: Story<Event>[]}>());
export const removeEvents = createAction('[Content] Remove events');