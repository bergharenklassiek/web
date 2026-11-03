export const menuPages = [
  { menu: 'Home', path: '/', title: /^Bergharen Klassiek/, content: '.app-home-page__about' },
  { menu: 'Agenda', path: '/agenda', title: /^Agenda/, content: '.app-agenda-page__toggle' },
  { menu: 'Over ons', path: '/over-ons', title: /Bergharen Klassiek/, content: '.app-about-page__description' },
  { menu: 'Gebouw', path: '/gebouw', title: /Bergharen Klassiek/, content: '.app-content-page__description' },
  { menu: 'Concerten in de regio', path: '/concerten-in-de-regio', title: /Bergharen Klassiek/, content: '.app-content-page__description' },
  { menu: 'ANBI', path: '/anbi', title: /ANBI/, content: '.app-content-page__description' },
  { menu: 'Contact', path: '/contact', title: /^Contact/, content: '.app-contact-page app-contact-details' },
];

// A past concert in Storyblok with several photos. Concert pages opened by URL are rendered on the server, where
// requests can't be faked, so this one has to be real.
export const concertWithPhotos = { path: '/agenda/concert-dina-ivanova', title: 'Pianorecital Dina Ivanova' };

export const allPaths = [...menuPages.map((page) => page.path), concertWithPhotos.path];
