import type { Page } from '@playwright/test';

export const menuPages = [
  { menu: 'Home', path: '/', title: /^Bergharen Klassiek/, content: (page: Page) => page.getByTestId('home-about') },
  { menu: 'Agenda', path: '/agenda', title: /^Agenda/, content: (page: Page) => page.getByRole('group', { name: 'Concerten' }) },
  { menu: 'Over ons', path: '/over-ons', title: /Bergharen Klassiek/, content: (page: Page) => page.getByTestId('about-description') },
  { menu: 'Gebouw', path: '/gebouw', title: /Bergharen Klassiek/, content: (page: Page) => page.getByTestId('content-description') },
  { menu: 'Concerten in de regio', path: '/concerten-in-de-regio', title: /Bergharen Klassiek/, content: (page: Page) => page.getByTestId('content-description') },
  { menu: 'ANBI', path: '/anbi', title: /ANBI/, content: (page: Page) => page.getByTestId('content-description') },
  { menu: 'Contact', path: '/contact', title: /^Contact/, content: (page: Page) => page.getByTestId('contact-details') },
];

// A past concert in Storyblok with several photos. Concert pages opened by URL are rendered on the server, where
// requests can't be faked, so this one has to be real.
export const concertWithPhotos = { path: '/agenda/concert-dina-ivanova', title: 'Pianorecital Dina Ivanova' };

export const allPaths = [...menuPages.map((page) => page.path), concertWithPhotos.path];
