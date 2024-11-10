import { inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { ContentService } from "../services/content.service";
import { loadEvent, loadEventSuccess, loadPastEvents, loadPastEventsSuccess } from "./content.actions";
import { filter, map, mergeMap, tap, withLatestFrom } from "rxjs";
import { select, Store } from "@ngrx/store";
import { selectEvent } from "./content.selectors";

export const loadPastEventsEffect = createEffect(
    (actions$ = inject(Actions), contentService = inject(ContentService)) => {
        return actions$.pipe(
            ofType(loadPastEvents),
            mergeMap(() => 
                contentService.loadEvents(true).pipe(
                    map((stories) => loadPastEventsSuccess({ events: stories})),
                )
            )
        )
    },
    { functional: true }
);

export const loadEventEffect = createEffect(
    (actions$ = inject(Actions), contentService = inject(ContentService), store = inject(Store)) => {
        return actions$.pipe(
            ofType(loadEvent),
            tap(() => console.log('fetching event')),
            mergeMap((action) => 
                contentService.loadEvent2(action.eventSlug).pipe(
                    map((event) => loadEventSuccess({ event })),
                )
            )
        )
    },
    { functional: true }
)