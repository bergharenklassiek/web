import { inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { ContentService } from "../services/content.service";
import { loadPastEvents, loadPastEventsSuccess } from "./content.actions";
import { map, mergeMap } from "rxjs";

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