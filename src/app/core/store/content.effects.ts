import { inject } from "@angular/core";
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from "@ngrx/effects";
import { ContentService } from "../services/content.service";
import { loadAboutPage, loadAboutPageSuccess, loadContactItemsSuccess, loadContentPage, loadContentPageSuccess, loadEvent, loadEvents, loadEventsSuccess, loadEventSuccess, loadHomePageSuccess } from "./content.actions";
import { map, mergeMap } from "rxjs";

export const loadHomePageEffect = createEffect(
    (actions$ = inject(Actions), contentService = inject(ContentService)) => {
        return actions$.pipe(
            ofType(ROOT_EFFECTS_INIT),
            mergeMap(() => contentService.loadHomePage().pipe(
                map((homePage) => loadHomePageSuccess({ homePage }))
            ))
        )
    },
    { functional: true }
);

export const loadAboutPageEffect = createEffect(
    (actions$ = inject(Actions), contentService = inject(ContentService)) => {
        return actions$.pipe(
            ofType(loadAboutPage),
            mergeMap(() => contentService.loadAboutPage().pipe(
                map((aboutPage) => loadAboutPageSuccess({ aboutPage }))
            ))
        )
    },
    { functional: true }
);

export const loadContactItemsEffect = createEffect(
    (actions$ = inject(Actions), contentService = inject(ContentService)) => {
        return actions$.pipe(
            ofType(ROOT_EFFECTS_INIT),
            mergeMap(() => contentService.loadContactItems().pipe(
                map((contactItems) => loadContactItemsSuccess({ contactItems }))
            ))
        )
    },
    { functional: true }
);

export const loadContentPageEffect = createEffect(
    (actions$ = inject(Actions), contentService = inject(ContentService)) => {
        return actions$.pipe(
            ofType(loadContentPage),
            mergeMap((action) => contentService.loadContentPage(action.contentPageSlug).pipe(
                map((contentPage) => loadContentPageSuccess({ contentPage }))
            ))
        )
    },
    { functional: true }
);

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
);