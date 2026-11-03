import { RenderMode, ServerRoute } from "@angular/ssr";
import { ROUTE_NAMES } from "./route-names";

export const serverRoutes: ServerRoute[] = [
    {
        path: ROUTE_NAMES.AGENDA,
        renderMode: RenderMode.Prerender,
    },
    {
        path: ROUTE_NAMES.CONTACT,
        renderMode: RenderMode.Prerender,
    },
    {
        path: `${ROUTE_NAMES.EVENTS}/:event-slug`,
        renderMode: RenderMode.Server,
    },
    {
        path: `${ROUTE_NAMES.AGENDA}/:event-slug`,
        renderMode: RenderMode.Server,
    },
    {
        path: ROUTE_NAMES.ABOUT,
        renderMode: RenderMode.Prerender,
    },
    {
        path: ROUTE_NAMES.GEBOUW,
        renderMode: RenderMode.Prerender,
    },
    {
        path: ROUTE_NAMES.CONCERTEN_IN_DE_REGIO,
        renderMode: RenderMode.Prerender,
    },
    {
        path: ROUTE_NAMES.ANBI,
        renderMode: RenderMode.Prerender,
    },
    {
        path: `${ROUTE_NAMES.CANCEL}/:code`,
        renderMode: RenderMode.Server,
    },
    {
        path: ROUTE_NAMES.HOME,
        renderMode: RenderMode.Prerender,
    },
    {
        // On request, because the URLs aren't known ahead of time. Prerendering gave a plain-text "Not found" on Netlify.
        path: ROUTE_NAMES.WILDCARD,
        renderMode: RenderMode.Server,
        status: 404,
    },
];
