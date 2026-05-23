import { patchState, signalStore, withHooks, withState } from '@ngrx/signals';
import { HomePage } from "../models/home-page";
import { withReducer, on, withEventHandlers, Events } from '@ngrx/signals/events';
import { homePageLoaded, loadHomePage } from './content.events';
import { inject, makeStateKey, TransferState } from '@angular/core';
import { ContentService } from '../services/content.service';
import { map, switchMap } from 'rxjs';
import { mapResponse } from '@ngrx/operators';

export interface ContentState {
    isLoading: boolean;
    homePage?: HomePage;
}

export const initialContentState: ContentState = {
    isLoading: false,
    homePage: undefined
}

export const ContentStore = signalStore(
    { providedIn: 'root' },
    withState(initialContentState),
    withHooks({
        onInit: (store) => {
            const transferState = inject(TransferState);
            const NGRX_SIGNALS_STORE_SK = makeStateKey<object>('ngrxSignalsStore');

            if (transferState.hasKey(NGRX_SIGNALS_STORE_SK)) {
                const rehydratedState = transferState.get(NGRX_SIGNALS_STORE_SK, {}) as Partial<ContentState>;
                patchState(store, rehydratedState);
            }
        }
    }),
    withReducer(
        on(loadHomePage,
            (_, state) => ({ ...state, isLoading: true })
        ),
        on(homePageLoaded,
            ({ payload }, state) => ({ ...state, isLoading: false, homePage: payload.homePage })
        )
    ),
    withEventHandlers(
        ( store, events = inject(Events), contentService = inject(ContentService)) => ({
            handleLoadHomePage$: events.on(loadHomePage).pipe(
                switchMap(() =>
                    contentService.homePage().pipe(
                        map((homePage) => homePage.content),
                        mapResponse({
                            next: (homePage: HomePage) => homePageLoaded({ homePage }),
                            error: () => ({ type: 'NO_ACTION' })
                        }),
                    )
                )
            ),
        })
    )
);