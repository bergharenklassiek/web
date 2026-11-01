// Web app URL of the Google Apps Script in apps-script/reservations.gs (see apps-script/README.md).
// While empty, the site falls back to reserving by email.
export const reservationEndpoint = 'https://script.google.com/macros/s/AKfycbyV8gBz28rTE7Xx0olmOo1swBgMtaqOEBTtD6vuBY1PZfDsWtMOB6Vm0iVZJ9HF1WZ3/exec';

// Keep in sync with SENDER_EMAIL in apps-script/reservations.gs
export const reservationEmail = 'bergharenklassiek@outlook.com';
// Keep in sync with MAX_SEATS_PER_RESERVATION in apps-script/reservations.gs
export const maxSeatsPerReservation = 8;
