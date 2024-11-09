import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ContentState } from "./content.reducer";

export const selectContent = createFeatureSelector<ContentState>('content');

export const selectPastEvents = createSelector(
    selectContent,
    (state) => state.events.filter(e => Date.parse(e.content.date) < Date.now())
);

export const selectEvent = (eventSlug: string) => createSelector(
    selectContent,
    (state) => state.events.find(e => e.slug === eventSlug)?.content
);