import { ISbRichtext } from "@storyblok/js";
import { Asset } from "./asset";

export interface Event {
    // Storyblok's content type. The story endpoint returns any story by its slug, not just concerts.
    component?: string;
    title: string;
    summary: string;
    artists: string[];
    date: string;
    location: string;
    description: ISbRichtext;
    images: Asset[];
}