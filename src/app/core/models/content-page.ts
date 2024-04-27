import { ISbRichtext } from "@storyblok/js";
import { Asset } from "./asset";

export interface ContentPage {
    title: string;
    description: ISbRichtext;
    images?: Asset[];
}