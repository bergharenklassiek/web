export const siteUrl = 'https://bergharenklassiek.nl';
export const siteName = 'Bergharen Klassiek';
export const defaultDescription = 'Bergharen Klassiek: klassieke muziek in de Protestantse Kerk te Bergharen. Pianorecitals, strijkkwartetten, vocale muziek en meer. Van harte uitgenodigd!';

// Used when sharing a page that has no photo of its own
export const defaultShareImage = {
  url: `${siteUrl}/full-logo-BK.png`,
  width: 1949,
  height: 390,
  alt: `Logo van ${siteName}`,
};

export const venue = {
  name: 'Protestantse Kerk Bergharen',
  streetAddress: 'Veldsestraat 12',
  addressLocality: 'Bergharen',
  addressCountry: 'NL',
  // Shown with the location of a concert. Keep in sync with PARKING_INFO in apps-script/reservations.gs
  parking: 'Parkeren: gratis op de parkeerplaatsen bij de kerk.',
};
