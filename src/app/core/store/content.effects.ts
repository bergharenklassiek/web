import { inject } from "@angular/core";
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from "@ngrx/effects";
import { ContentService } from "../services/content.service";
import { loadEvent, loadEvents, loadEventsSuccess, loadEventSuccess } from "./content.actions";
import { map, mergeMap } from "rxjs";

export const loadEventsEffect = createEffect(
    (actions$ = inject(Actions), contentService = inject(ContentService)) => {
        return actions$.pipe(
            ofType(ROOT_EFFECTS_INIT, loadEvents),
            mergeMap((action) => 
                contentService.loadEvents(action.loadPast).pipe(
                    map((stories) => loadEventsSuccess({ events: stories})),
                )
            )
        )
    },
    { functional: true }
);

export const loadEventEffect = createEffect(
    (actions$ = inject(Actions), contentService = inject(ContentService)) => {
        return actions$.pipe(
            ofType(loadEvent),
            mergeMap((action) => 
                contentService.loadEvent(action.eventSlug).pipe(
                    map((event) => loadEventSuccess({ event })),
                )
            )
        )
    },
    { functional: true }
)