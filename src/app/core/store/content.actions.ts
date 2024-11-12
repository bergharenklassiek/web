import { createAction, props } from "@ngrx/store";
import { Event } from "../models/event";
import { Story } from "../models/story";
import { HomePage } from "../models/home-page";
import { ContactItem } from "../models/contact-item";

export const loadHomePageSuccess = createAction('[Content] Load homepage success', props<{ homePage: Story<HomePage> }>());
export const loadContactItemsSuccess = createAction('[Content] Load contact items success', props<{ contactItems: Story<ContactItem>[] }>());
export const loadEvents = createAction('[Content] Load events', props<{ loadPast: boolean}>());
export const loadEventsSuccess = createAction('[Content] Load events success', props<{ events: Story<Event>[]}>());
export const removeEvents = createAction('[Content] Remove events');
export const loadEvent = createAction('[Content] Load event', props<{ eventSlug: string }>());
export const loadEventSuccess = createAction('[Content] Load event success', props<{ event: Story<Event> }>());
