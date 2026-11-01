// Web app URL of the Google Apps Script in apps-script/reservations.gs (see apps-script/README.md).
// While empty, the site falls back to reserving by email.
export const reservationEndpoint = 'https://script.google.com/macros/s/AKfycbwLScqLkkNBvZy61IZeDiJlnC3l-WlTyr5M0gbG_Rcpo694CchJiXoBYvwFhvP5or6p/exec';

// Keep in sync with SENDER_EMAIL in apps-script/reservations.gs
export const reservationEmail = 'bergharenklassiek@outlook.com';
// Keep in sync with MAX_SEATS_PER_RESERVATION in apps-script/reservations.gs
export const maxSeatsPerReservation = 8;
