import { ISbRichtext } from "@storyblok/js";
import { Asset } from "./asset";

export interface Event {
    title: string;
    summary: string;
    artists: string[];
    date: Date;
    location: string;
    description: ISbRichtext;
    images: Asset[];
}