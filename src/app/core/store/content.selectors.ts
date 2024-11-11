import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ContentState } from "./content.reducer";

export const selectContent = createFeatureSelector<ContentState>('content');

export const selectHomePage = createSelector(selectContent, (state) => state.homePage);

export const selectEvents = (pastEvents: boolean) => createSelector(
    selectContent,
    (state) => state.events.filter(e => pastEvents ? Date.parse(e.content.date) < Date.now() : Date.parse(e.content.date) >= Date.now())
);

export const selectEvent = (eventSlug: string) => createSelector(
    selectContent,
    (state) => state.events.find(e => e.slug === eventSlug)?.content
);