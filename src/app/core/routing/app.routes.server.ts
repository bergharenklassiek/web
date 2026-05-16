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
        path: ROUTE_NAMES.HOME,
        renderMode: RenderMode.Prerender,
    },
    {
        path: ROUTE_NAMES.WILDCARD,
        renderMode: RenderMode.Prerender,
    },
];
