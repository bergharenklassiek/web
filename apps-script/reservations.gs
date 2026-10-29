/**
 * Reservations for Bergharen Klassiek.
 *
 * Receives reservations from the website, stores them in this spreadsheet and sends the guest a confirmation email.
 * Setup instructions are in apps-script/README.md.
 */

const RESERVATIONS_SHEET = 'Reserveringen';
const CONCERTS_SHEET = 'Concerten';
const SENDER_NAME = 'Bergharen Klassiek';
// Replies to the confirmation email go here instead of to the Google account that sends it
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
    slug: clean(data.slug, 200),
    title: clean(data.title, 200),
    date: clean(data.date, 50),
    dateLabel: clean(data.dateLabel, 100),
    name: clean(data.name, 100),
    email: clean(data.email, 200),
    seats: Number(data.seats),
  };

  const isValid = reservation.slug
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
    const reservations = getOrCreateSheet(spreadsheet, RESERVATIONS_SHEET, ['Ontvangen', 'Concert', 'Slug', 'Datum concert', 'Naam', 'E-mail', 'Aantal personen']);
    const concerts = getOrCreateSheet(spreadsheet, CONCERTS_SHEET, ['Slug', 'Concert', 'Capaciteit', 'Gereserveerd']);

    const remaining = getCapacity(concerts, reservation) - (reservedSeatsPerConcert(reservations)[reservation.slug] || 0);
    if (reservation.seats > remaining) {
      return respond({ status: 'full', remaining: Math.max(0, remaining) });
    }

    reservations.appendRow([
      new Date(),
      safeCell(reservation.title),
      safeCell(reservation.slug),
      safeCell(reservation.dateLabel || reservation.date),
      safeCell(reservation.name),
      safeCell(reservation.email),
      reservation.seats,
    ]);
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
  const reservations = spreadsheet.getSheetByName(RESERVATIONS_SHEET);
  const concerts = spreadsheet.getSheetByName(CONCERTS_SHEET);
  if (!reservations || !concerts || concerts.getLastRow() < 2) {
    return;
  }

  const totals = reservedSeatsPerConcert(reservations);
  const rowCount = concerts.getLastRow() - 1;
  const slugs = concerts.getRange(2, 1, rowCount, 1).getValues();
  concerts.getRange(2, 4, rowCount, 1).setValues(slugs.map(([slug]) => [totals[slug] || 0]));
}

/**
 * Returns the capacity set for this concert in the Concerten sheet, or DEFAULT_CAPACITY when it's empty.
 * A concert that isn't listed yet is added with the default capacity, which you can change there.
 */
function getCapacity(concerts, reservation) {
  const rows = concerts.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === reservation.slug) {
      const capacity = Number(rows[i][2]);
      return rows[i][2] === '' || isNaN(capacity) ? DEFAULT_CAPACITY : capacity;
    }
  }

  concerts.appendRow([safeCell(reservation.slug), safeCell(reservation.title), DEFAULT_CAPACITY, 0]);
  return DEFAULT_CAPACITY;
}

// Total reserved seats per concert slug, counted from the Reserveringen sheet
function reservedSeatsPerConcert(reservations) {
  const rows = reservations.getDataRange().getValues();
  const totals = {};
  for (let i = 1; i < rows.length; i++) {
    const slug = rows[i][2];
    totals[slug] = (totals[slug] || 0) + (Number(rows[i][6]) || 0);
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

function getOrCreateSheet(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

function clean(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

// Stops input such as "=IMPORTXML(...)" from being run as a spreadsheet formula
function safeCell(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function respond(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
