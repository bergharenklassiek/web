/**
 * Reservations for Bergharen Klassiek.
 *
 * Receives reservations from the website, stores them in this spreadsheet and sends the guest a confirmation email.
 * Setup instructions are in apps-script/README.md.
 */

const RESERVATIONS_SHEET = 'Reserveringen';
const CONCERTS_SHEET = 'Concerten';
// Columns are found by their header, so they can be moved around in the spreadsheet. Missing columns are added at the end.
const RESERVATION_COLUMNS = ['Ontvangen', 'Concert', 'Datum concert', 'Naam', 'E-mail', 'Aantal personen', 'Event ID'];
const CONCERT_COLUMNS = ['Concert', 'Datum concert', 'Capaciteit', 'Gereserveerd', 'Event ID'];
const SENDER_NAME = 'Bergharen Klassiek';
// Replies to the confirmation email go here instead of to the Google account that sends it.
// Keep in sync with reservationEmail in src/app/core/config/reservation.config.ts
const REPLY_TO = 'bergharenklassiek@outlook.com';
const MAX_SEATS_PER_RESERVATION = 8;
// Used for every concert, unless a different capacity is filled in on the Concerten sheet
const DEFAULT_CAPACITY = 100;

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ status: 'invalid' });
  }

  // Honeypot: people never fill in this hidden field, bots do. Pretend it worked so they don't retry.
  if (data.website) {
    return respond({ status: 'ok' });
  }

  const reservation = {
    // Storyblok story ID: unlike the URL slug it never changes, so all counting is done by it
    id: clean(data.id, 50),
    title: clean(data.title, 200),
    date: clean(data.date, 50),
    dateLabel: clean(data.dateLabel, 100),
    name: clean(data.name, 100),
    email: clean(data.email, 200),
    seats: Number(data.seats),
  };

  const isValid = /^\d+$/.test(reservation.id)
    && reservation.title
    && reservation.name
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reservation.email)
    && Number.isInteger(reservation.seats)
    && reservation.seats >= 1
    && reservation.seats <= MAX_SEATS_PER_RESERVATION;
  if (!isValid) {
    return respond({ status: 'invalid' });
  }

  // Only one reservation at a time, so two guests can't both take the last seats
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const reservations = getOrCreateSheet(spreadsheet, RESERVATIONS_SHEET, RESERVATION_COLUMNS);
    const concerts = getOrCreateSheet(spreadsheet, CONCERTS_SHEET, CONCERT_COLUMNS);

    const remaining = getCapacity(concerts, reservation) - (reservedSeatsPerConcert(reservations)[reservation.id] || 0);
    if (reservation.seats > remaining) {
      return respond({ status: 'full', remaining: Math.max(0, remaining) });
    }

    appendRow(reservations, {
      'Ontvangen': new Date(),
      'Concert': safeCell(reservation.title),
      'Datum concert': safeCell(reservation.dateLabel || reservation.date),
      'Naam': safeCell(reservation.name),
      'E-mail': safeCell(reservation.email),
      'Aantal personen': reservation.seats,
      'Event ID': asText(reservation.id),
    });
    updateReservedTotals(spreadsheet);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  sendConfirmation(reservation);
  return respond({ status: 'ok' });
}

// Lets you check the deployment by opening its URL in a browser
function doGet() {
  return respond({ status: 'ok' });
}

// Runs when the spreadsheet is opened: adds a menu to refresh the totals, and refreshes them straight away
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Reserveringen')
    .addItem('Aantallen bijwerken', 'refreshReservedTotals')
    .addToUi();
  refreshReservedTotals();
}

function refreshReservedTotals() {
  updateReservedTotals(SpreadsheetApp.getActiveSpreadsheet());
}

/**
 * Writes the number of reserved seats per concert into the Gereserveerd column of the Concerten sheet.
 * The script writes plain numbers instead of a formula, because formula syntax depends on the spreadsheet's language.
 */
function updateReservedTotals(spreadsheet) {
  const reservationsSheet = spreadsheet.getSheetByName(RESERVATIONS_SHEET);
  const concertsSheet = spreadsheet.getSheetByName(CONCERTS_SHEET);
  if (!reservationsSheet || !concertsSheet || concertsSheet.getLastRow() < 2) {
    return;
  }

  const reservations = getOrCreateSheet(spreadsheet, RESERVATIONS_SHEET, RESERVATION_COLUMNS);
  const concerts = getOrCreateSheet(spreadsheet, CONCERTS_SHEET, CONCERT_COLUMNS);
  const totals = reservedSeatsPerConcert(reservations);
  const rowCount = concerts.sheet.getLastRow() - 1;
  const ids = concerts.sheet.getRange(2, concerts.columns['Event ID'], rowCount, 1).getValues();
  concerts.sheet
    .getRange(2, concerts.columns['Gereserveerd'], rowCount, 1)
    .setValues(ids.map(([id]) => [totals[String(id)] || 0]));
}

/**
 * Returns the capacity set for this concert in the Concerten sheet, or DEFAULT_CAPACITY when it's empty.
 * A concert that isn't listed yet is added with the default capacity, which you can change there.
 */
function getCapacity(concerts, reservation) {
  const rows = concerts.sheet.getDataRange().getValues();
  const idIndex = concerts.columns['Event ID'] - 1;
  const capacityIndex = concerts.columns['Capaciteit'] - 1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIndex]) === reservation.id) {
      const capacity = Number(rows[i][capacityIndex]);
      return rows[i][capacityIndex] === '' || isNaN(capacity) ? DEFAULT_CAPACITY : capacity;
    }
  }

  appendRow(concerts, {
    'Concert': safeCell(reservation.title),
    'Datum concert': safeCell(reservation.dateLabel || reservation.date),
    'Capaciteit': DEFAULT_CAPACITY,
    'Gereserveerd': 0,
    'Event ID': asText(reservation.id),
  });
  return DEFAULT_CAPACITY;
}

// Total reserved seats per event ID, counted from the Reserveringen sheet. Rows without an event ID are skipped.
function reservedSeatsPerConcert(reservations) {
  const rows = reservations.sheet.getDataRange().getValues();
  const idIndex = reservations.columns['Event ID'] - 1;
  const seatsIndex = reservations.columns['Aantal personen'] - 1;
  const totals = {};
  for (let i = 1; i < rows.length; i++) {
    const id = String(rows[i][idIndex]);
    if (id) {
      totals[id] = (totals[id] || 0) + (Number(rows[i][seatsIndex]) || 0);
    }
  }
  return totals;
}

function sendConfirmation(reservation) {
  const persons = reservation.seats === 1 ? '1 persoon' : `${reservation.seats} personen`;
  const body = [
    `Beste ${reservation.name},`,
    '',
    'Bedankt voor je reservering. We hebben het volgende voor je genoteerd:',
    '',
    `Concert: ${reservation.title}`,
    `Datum: ${reservation.dateLabel || reservation.date}`,
    `Aantal: ${persons}`,
    '',
    'Wil je je reservering wijzigen of annuleren? Beantwoord dan deze e-mail.',
    '',
    'Tot ziens bij het concert!',
    '',
    'Met vriendelijke groet,',
    'Bergharen Klassiek',
  ].join('\n');

  MailApp.sendEmail({
    to: reservation.email,
    subject: `Bevestiging reservering: ${reservation.title}`,
    body: body,
    name: SENDER_NAME,
    replyTo: REPLY_TO,
  });
}

/**
 * Returns the sheet and the position (1-based) of each column, found by its header.
 * Creates the sheet if needed, and adds any missing columns at the end, so older spreadsheets keep working.
 */
function getOrCreateSheet(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.setFrozenRows(1);
  }

  const lastColumn = sheet.getLastColumn();
  const existing = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String) : [];
  const columns = {};
  existing.forEach((header, i) => {
    if (header) {
      columns[header] = i + 1;
    }
  });

  let next = existing.length + 1;
  for (const header of headers) {
    if (!columns[header]) {
      sheet.getRange(1, next).setValue(header).setFontWeight('bold');
      columns[header] = next++;
    }
  }

  return { sheet, columns };
}

// Appends a row with the given values, each placed in the column with that header
function appendRow(target, values) {
  const width = Math.max(...Object.values(target.columns));
  const row = new Array(width).fill('');
  for (const [header, value] of Object.entries(values)) {
    row[target.columns[header] - 1] = value;
  }
  target.sheet.appendRow(row);
}

function clean(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

// Storyblok IDs are long numbers, which Sheets would otherwise show as e.g. 1.29413E+14. The apostrophe isn't displayed.
function asText(value) {
  return `'${value}`;
}

// Stops input such as "=IMPORTXML(...)" from being run as a spreadsheet formula
function safeCell(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function respond(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
