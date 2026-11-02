import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { defaultDescription, defaultShareImage, siteName, siteUrl } from '../config/site.config';

export interface ShareImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface PageSeo {
  // Left out on the home page, which is titled by the site name alone
  title?: string;
  description?: string;
  // Path of the page's preferred URL. Left out for pages that shouldn't be indexed.
  path?: string;
  image?: ShareImage;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: object;
}

const JSON_LD_SELECTOR = 'script[type="application/ld+json"]';

/**
 * Sets the title and the tags that search engines and link previews read. Those don't run JavaScript, so this has to
 * happen during server rendering. Every page calls update(), which replaces everything the previous page set.
 */
@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);

  update(page: PageSeo): void {
    const title = page.title ? `${page.title} | ${siteName}` : siteName;
    const description = page.description || defaultDescription;
    const image = page.image ?? defaultShareImage;

    this.titleService.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.setOrRemove('name', 'robots', page.noindex ? 'noindex' : undefined);

    const url = page.path === undefined ? undefined : `${siteUrl}${page.path}`;
    this.setCanonical(url);

    this.meta.updateTag({ property: 'og:site_name', content: siteName });
    this.meta.updateTag({ property: 'og:locale', content: 'nl_NL' });
    this.meta.updateTag({ property: 'og:type', content: page.type ?? 'website' });
    this.meta.updateTag({ property: 'og:title', content: page.title ?? siteName });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.setOrRemove('property', 'og:url', url);
    this.meta.updateTag({ property: 'og:image', content: image.url });
    this.meta.updateTag({ property: 'og:image:width', content: String(image.width) });
    this.meta.updateTag({ property: 'og:image:height', content: String(image.height) });
    this.meta.updateTag({ property: 'og:image:alt', content: image.alt });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

    this.setJsonLd(page.jsonLd);
  }

  private setOrRemove(attribute: 'name' | 'property', key: string, content: string | undefined): void {
    if (content === undefined) {
      this.meta.removeTag(`${attribute}="${key}"`);
    } else {
      this.meta.updateTag({ [attribute]: key, content });
    }
  }

  private setCanonical(url: string | undefined): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (url === undefined) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(jsonLd: object | undefined): void {
    let script = this.document.head.querySelector<HTMLScriptElement>(JSON_LD_SELECTOR);
    if (jsonLd === undefined) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    // Text from the CMS must not be able to close the script tag
    script.textContent = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  }
}
