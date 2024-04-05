import { UrlLink } from "./url-link";

export interface ContactItem {
    type: 'name' | 'kvk' | 'bankaccount' | 'email' | 'address';
    displayValue: string;
    link?: UrlLink;
}