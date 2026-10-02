import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ContentState } from "./content.reducer";

export const selectContent = createFeatureSelector<ContentState>('content');

export const selectHomePage = createSelector(selectContent, (state) => state.homePage);
export const selectContactItems = createSelector(selectContent, (state) => state.contactItems);

export const selectAboutPage = createSelector(selectContent, (state) => state.aboutPage);

export const selectContentPage = (slug: string) => createSelector(
    selectContent, 
    (state) => state.contentPages.find(c => c.slug === slug)
);

export const selectEvents = (pastEvents: boolean) => createSelector(
    selectContent,
    (state) => state.events
        .filter(e => pastEvents ? Date.parse(e.content.date) < Date.now() : Date.parse(e.content.date) >= Date.now())
        // Events can enter the store in any order (single event pages, earlier events), so sort here: past newest first, upcoming soonest first
        .sort((a, b) => pastEvents
            ? Date.parse(b.content.date) - Date.parse(a.content.date)
            : Date.parse(a.content.date) - Date.parse(b.content.date))
);

export const selectEvent = (eventSlug: string) => createSelector(
    selectContent,
    (state) => state.events.find(e => e.slug === eventSlug)?.content
);

export const selectDisplayPastEvents = createSelector(selectContent, (state) => state.displayPastEvents);
export const selectEventsLoaded = (pastEvents: boolean) => createSelector(selectContent, (state) => pastEvents ? state.eventsLoaded.past : state.eventsLoaded.future);

export const selectEarlierEventsByArtists = (eventSlug: string) => createSelector(
    selectContent,
    (state) => {
        const event = state.events.find(e => e.slug === eventSlug)?.content;
        if (!event?.artists?.length) {
            return [];
        }
        return state.events
            .filter(e => Date.parse(e.content.date) < Date.parse(event.date))
            .filter(e => e.content.artists?.some(artist => event.artists.includes(artist)))
            .sort((a, b) => Date.parse(b.content.date) - Date.parse(a.content.date));
    }
);
