import { inject } from "@angular/core";
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { filter, map, mergeMap, } from "rxjs";
import { concatLatestFrom } from '@ngrx/operators';
import { ContentService } from "../services/content.service";
import { loadAboutPage, loadAboutPageSuccess, loadContactItemsSuccess, loadContentPage, loadContentPageSuccess, loadEvent, loadEvents, loadEventsSuccess, loadEventSuccess, loadHomePageSuccess } from "./content.actions";
import { selectAboutPage, selectContentPage, selectEvent, selectEvents, selectEventsLoaded, } from "./content.selectors";

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
    (actions$ = inject(Actions), store = inject(Store), contentService = inject(ContentService)) => {
        return actions$.pipe(
            ofType(loadAboutPage),
            mergeMap(() => store.select(selectAboutPage).pipe(
                filter((aboutPage) => !aboutPage),
                mergeMap(() => contentService.loadAboutPage().pipe(
                    map((aboutPage) => loadAboutPageSuccess({ aboutPage }))
                ))
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
    (actions$ = inject(Actions), store = inject(Store), contentService = inject(ContentService)) => {
        return actions$.pipe(
            ofType(loadContentPage),
            mergeMap((action) => store.select(selectContentPage(action.contentPageSlug)).pipe(
                filter(contentPage => !contentPage),
                mergeMap(() => contentService.loadContentPage(action.contentPageSlug).pipe(
                    map((contentPage) => loadContentPageSuccess({ contentPage }))
                ))
            ))
        )
    },
    { functional: true }
);

export const loadEventsEffect = createEffect(
    (actions$ = inject(Actions), store = inject(Store), contentService = inject(ContentService)) => {
        return actions$.pipe(
            ofType(loadEvents),
            concatLatestFrom((action) => [store.select(selectEventsLoaded(action.loadPast))]),
            filter(([_, eventsLoaded]) => !eventsLoaded),
            mergeMap(([action, _]) => contentService.loadEvents(action.loadPast).pipe(
                map((events) => loadEventsSuccess({ events, pastEvents: action.loadPast })),
            ))
        )
    },
    { functional: true }
);

export const loadEventEffect = createEffect(
    (actions$ = inject(Actions), store = inject(Store), contentService = inject(ContentService)) => {
        return actions$.pipe(
            ofType(loadEvent),
            mergeMap((action) => store.select(selectEvent(action.eventSlug)).pipe(
                filter(event => !event),
                mergeMap(() => contentService.loadEvent(action.eventSlug).pipe(
                    map((event) => loadEventSuccess({ event }))
                ))
            ))
        )
    },
    { functional: true }
);