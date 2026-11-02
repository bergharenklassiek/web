import { formatDate } from '@angular/common';
import { ISbRichtext } from '@storyblok/js';
import { defaultShareImage, siteName, siteUrl, venue } from '../config/site.config';
import { ROUTE_NAMES } from '../routing/route-names';
import { Asset } from '../models/asset';
import { Event } from '../models/event';
import { StoryBlokImagePipe } from '../pipes/story-blok-image.pipe';
import { toIsoWithOffset } from '../utils/event-date';
import { PageSeo, ShareImage } from './seo.service';

const SHARE_IMAGE_WIDTH = 1200;
const SHARE_IMAGE_HEIGHT = 630;
const MAX_DESCRIPTION_LENGTH = 155;

export function eventSeo(slug: string, event: Event): PageSeo {
  const path = `/${ROUTE_NAMES.AGENDA}/${encodeURIComponent(slug)}`;
  const image = shareImage(event.images?.[0], event.title);
  const when = formatDate(event.date, "EEEE d MMMM y 'om' HH:mm", 'nl-NL');
  const details = [when, event.location].filter(Boolean).join(', ');

  return {
    title: event.title,
    description: [`${details}.`, event.summary].filter(Boolean).join(' '),
    path,
    image,
    type: 'article',
    jsonLd: eventJsonLd(event, path, image),
  };
}

export function eventJsonLd(event: Event, path: string, image: ShareImage): object {
  const locationName = event.location || venue.name;
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: toIsoWithOffset(event.date),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: locationName,
      // We only know the address of our own venue
      address: locationName === venue.name
        ? {
            '@type': 'PostalAddress',
            streetAddress: venue.streetAddress,
            addressLocality: venue.addressLocality,
            addressCountry: venue.addressCountry,
          }
        : locationName,
    },
    image: [image.url],
    description: event.summary,
    url: `${siteUrl}${path}`,
    organizer: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
    },
  };
}

function shareImage(asset: Asset | undefined, fallbackAlt: string): ShareImage {
  if (!asset) {
    return defaultShareImage;
  }
  return {
    url: new StoryBlokImagePipe().transform(asset, SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT),
    width: SHARE_IMAGE_WIDTH,
    height: SHARE_IMAGE_HEIGHT,
    alt: asset.alt || fallbackAlt,
  };
}

// A short description from CMS rich text, cut off at a word
export function richTextToDescription(richText: ISbRichtext | undefined): string {
  const text = textBlocks(richText)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    // Headings and list items often have no punctuation, which would run them into the next sentence
    .map((block) => (/[.!?:;,…]$/.test(block) ? block : `${block}.`))
    .join(' ');
  if (text.length <= MAX_DESCRIPTION_LENGTH) {
    return text;
  }
  const cut = text.slice(0, MAX_DESCRIPTION_LENGTH - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

function textBlocks(node: ISbRichtext | undefined): string[] {
  const children = node?.content ?? [];
  // Text in one paragraph can be split up by formatting, even in the middle of a word, so it's joined without spaces
  if (children.some((child) => child.type === 'text')) {
    return [children.map((child) => child.text ?? ' ').join('')];
  }
  return children.flatMap(textBlocks);
}
