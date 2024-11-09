import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ContentState } from "./content.reducer";

export const selectEvents = createFeatureSelector<ContentState>('content');

export const selectPastEvents = createSelector(
    selectEvents,
    (state) => state.events.filter(e => Date.parse(e.content.date) < Date.now())
);