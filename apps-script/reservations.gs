/**
 * Reservations for Bergharen Klassiek.
 *
 * Receives reservations from the website, stores them in this spreadsheet and sends the guest a confirmation email.
 * Setup instructions are in apps-script/README.md.
 */

const RESERVATIONS_SHEET = "Reserveringen";
const CONCERTS_SHEET = "Concerten";
// Columns are found by their header, so they can be moved around in the spreadsheet. Missing columns are added at the end.
const RESERVATION_COLUMNS = [
  "Ontvangen",
  "Concert",
  "Datum concert",
  "Naam",
  "E-mail",
  "Aantal personen",
  "Event ID",
  "Annuleercode",
];
const CONCERT_COLUMNS = [
  "Concert",
  "Datum concert",
  "Capaciteit",
  "Gereserveerd",
  "Beschikbaar",
  "Event ID",
];
const SENDER_NAME = "Bergharen Klassiek";
// The confirmation email is sent from this address, and replies go here instead of to the Google account that sends it.
// Gmail can only send from it once it's added under "Send mail as" (see apps-script/README.md). Until then the email
// comes from the Google account's own address, with replies still going here.
// Keep in sync with reservationEmail in src/app/core/config/reservation.config.ts
const SENDER_EMAIL = "bergharenklassiek@outlook.com";
// Keep in sync with siteUrl and venue in src/app/core/config/site.config.ts
const SITE_URL = "https://bergharenklassiek.nl";
const VENUE_NAME = "Protestantse Kerk Bergharen";
const VENUE_ADDRESS = "Veldsestraat 12, Bergharen";
// Keep in sync with venue.parking in src/app/core/config/site.config.ts
const PARKING_INFO = "Parkeren: gratis op de parkeerplaatsen bij de kerk.";
const MAX_SEATS_PER_RESERVATION = 8;
// Used for every concert, unless a different capacity is filled in on the Concerten sheet
const DEFAULT_CAPACITY = 120;

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ status: "invalid" });
  }

  if (data.action === "lookup" || data.action === "cancel") {
    return handleCancellation(data);
  }

  // Honeypot: people never fill in this hidden field, bots do. Pretend it worked so they don't retry.
  if (data.website) {
    return respond({ status: "ok" });
  }

  const reservation = {
    // Storyblok story ID: unlike the URL slug it never changes, so all counting is done by it
    id: clean(data.id, 50),
    slug: clean(data.slug, 200),
    title: clean(data.title, 200),
    date: clean(data.date, 50),
    dateLabel: clean(data.dateLabel, 100),
    location: clean(data.location, 200),
    name: clean(data.name, 100),
    email: clean(data.email, 200),
    seats: Number(data.seats),
    // Secret, because anyone with this code can cancel the reservation. Only the guest gets it, in the email.
    cancelCode: Utilities.getUuid(),
  };

  const isValid =
    /^\d+$/.test(reservation.id) &&
    reservation.title &&
    reservation.name &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reservation.email) &&
    Number.isInteger(reservation.seats) &&
    reservation.seats >= 1 &&
    reservation.seats <= MAX_SEATS_PER_RESERVATION;
  if (!isValid) {
    return respond({ status: "invalid" });
  }

  // Only one reservation at a time, so two guests can't both take the last seats
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const reservations = getOrCreateSheet(
      spreadsheet,
      RESERVATIONS_SHEET,
      RESERVATION_COLUMNS,
    );
    const concerts = getOrCreateSheet(
      spreadsheet,
      CONCERTS_SHEET,
      CONCERT_COLUMNS,
    );

    const remaining =
      getCapacity(concerts, reservation) -
      (reservedSeatsPerConcert(reservations)[reservation.id] || 0);
    if (reservation.seats > remaining) {
      return respond({ status: "full", remaining: Math.max(0, remaining) });
    }

    appendRow(reservations, {
      Ontvangen: new Date(),
      Concert: safeCell(reservation.title),
      "Datum concert": safeCell(reservation.dateLabel || reservation.date),
      Naam: safeCell(reservation.name),
      "E-mail": safeCell(reservation.email),
      "Aantal personen": reservation.seats,
      "Event ID": asText(reservation.id),
      Annuleercode: reservation.cancelCode,
    });
    updateReservedTotals(spreadsheet);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  // The reservation is already saved, so a failed email mustn't make the guest think it failed and reserve again.
  // The error shows up under Executions in the Apps Script editor.
  try {
    sendConfirmation(reservation);
  } catch (err) {
    console.error(`Confirmation email to ${reservation.email} failed: ${err}`);
  }
  return respond({ status: "ok" });
}

/**
 * For the cancel page on the website. "lookup" returns the reservation's details, and "cancel" also deletes its row, which
 * frees the seats because they're counted from the rows. Guests see only what's in their confirmation email.
 */
function handleCancellation(data) {
  const code = clean(data.code, 50);
  // Also stops an empty code from matching older reservations, which have none
  if (!/^[0-9a-f-]{36}$/i.test(code)) {
    return respond({ status: "not_found" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const reservations = getOrCreateSheet(
      spreadsheet,
      RESERVATIONS_SHEET,
      RESERVATION_COLUMNS,
    );
    const rows = reservations.sheet.getDataRange().getValues();
    const value = (row, header) => row[reservations.columns[header] - 1];
    const index = rows.findIndex(
      (row, i) => i > 0 && String(value(row, "Annuleercode")) === code,
    );
    if (index === -1) {
      return respond({ status: "not_found" });
    }

    if (data.action === "cancel") {
      reservations.sheet.deleteRow(index + 1);
      updateReservedTotals(spreadsheet);
      SpreadsheetApp.flush();
      return respond({ status: "ok" });
    }

    return respond({
      status: "ok",
      details: {
        title: String(value(rows[index], "Concert")),
        dateLabel: String(value(rows[index], "Datum concert")),
        seats: Number(value(rows[index], "Aantal personen")),
      },
    });
  } finally {
    lock.releaseLock();
  }
}

// Lets you check the deployment by opening its URL in a browser
function doGet() {
  return respond({ status: "ok" });
}

// Runs when the spreadsheet is opened: adds a menu to refresh the totals, and refreshes them straight away
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Reserveringen")
    .addItem("Aantallen bijwerken", "refreshReservedTotals")
    .addToUi();
  refreshReservedTotals();
}

// Runs when someone edits the spreadsheet, so a changed capacity or reservation shows up in the totals straight away
function onEdit(e) {
  const name = e.range.getSheet().getName();
  if (name === RESERVATIONS_SHEET || name === CONCERTS_SHEET) {
    refreshReservedTotals();
  }
}

function refreshReservedTotals() {
  updateReservedTotals(SpreadsheetApp.getActiveSpreadsheet());
}

/**
 * Writes the number of reserved and available seats per concert into the Gereserveerd and Beschikbaar columns of the Concerten sheet.
 * The script writes plain numbers instead of a formula, because formula syntax depends on the spreadsheet's language.
 */
function updateReservedTotals(spreadsheet) {
  const reservationsSheet = spreadsheet.getSheetByName(RESERVATIONS_SHEET);
  const concertsSheet = spreadsheet.getSheetByName(CONCERTS_SHEET);
  if (!reservationsSheet || !concertsSheet || concertsSheet.getLastRow() < 2) {
    return;
  }

  const reservations = getOrCreateSheet(
    spreadsheet,
    RESERVATIONS_SHEET,
    RESERVATION_COLUMNS,
  );
  const concerts = getOrCreateSheet(
    spreadsheet,
    CONCERTS_SHEET,
    CONCERT_COLUMNS,
  );
  const totals = reservedSeatsPerConcert(reservations);
  const rowCount = concerts.sheet.getLastRow() - 1;
  const ids = concerts.sheet
    .getRange(2, concerts.columns["Event ID"], rowCount, 1)
    .getValues();
  const capacities = concerts.sheet
    .getRange(2, concerts.columns["Capaciteit"], rowCount, 1)
    .getValues();
  const reserved = ids.map(([id]) => totals[String(id)] || 0);
  concerts.sheet
    .getRange(2, concerts.columns["Gereserveerd"], rowCount, 1)
    .setValues(reserved.map((seats) => [seats]));
  concerts.sheet
    .getRange(2, concerts.columns["Beschikbaar"], rowCount, 1)
    .setValues(
      reserved.map((seats, i) => [
        Math.max(0, toCapacity(capacities[i][0]) - seats),
      ]),
    );
}

/**
 * Returns the capacity set for this concert in the Concerten sheet, or DEFAULT_CAPACITY when it's empty.
 * A concert that isn't listed yet is added with the default capacity, which you can change there.
 */
function getCapacity(concerts, reservation) {
  const rows = concerts.sheet.getDataRange().getValues();
  const idIndex = concerts.columns["Event ID"] - 1;
  const capacityIndex = concerts.columns["Capaciteit"] - 1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIndex]) === reservation.id) {
      return toCapacity(rows[i][capacityIndex]);
    }
  }

  appendRow(concerts, {
    Concert: safeCell(reservation.title),
    "Datum concert": safeCell(reservation.dateLabel || reservation.date),
    Capaciteit: DEFAULT_CAPACITY,
    Gereserveerd: 0,
    Beschikbaar: DEFAULT_CAPACITY,
    "Event ID": asText(reservation.id),
  });
  return DEFAULT_CAPACITY;
}

// The capacity in a Capaciteit cell, or DEFAULT_CAPACITY when it's empty or not a number
function toCapacity(value) {
  const capacity = Number(value);
  return value === "" || isNaN(capacity) ? DEFAULT_CAPACITY : capacity;
}

// Total reserved seats per event ID, counted from the Reserveringen sheet. Rows without an event ID are skipped.
function reservedSeatsPerConcert(reservations) {
  const rows = reservations.sheet.getDataRange().getValues();
  const idIndex = reservations.columns["Event ID"] - 1;
  const seatsIndex = reservations.columns["Aantal personen"] - 1;
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
  const persons =
    reservation.seats === 1 ? "1 persoon" : `${reservation.seats} personen`;
  // Storyblok dates look like "2026-11-15 20:00" and may be marked as UTC, but the time is already the local time.
  // So it's read from the text as-is, without converting time zones.
  const time = (reservation.date.match(/\b(\d{1,2}:\d{2})/) || [])[1];
  const body = [
    `Beste ${reservation.name},`,
    "",
    "Bedankt voor je reservering. We hebben het volgende voor je genoteerd:",
    "",
    `Concert: ${reservation.title}`,
    `Datum: ${reservation.dateLabel || reservation.date}`,
    ...(time ? [`Tijd: ${time} uur`] : []),
    ...(reservation.location ? [`Locatie: ${locationLine(reservation)}`] : []),
    `Aantal: ${persons}`,
    "",
    ...(reservation.location === VENUE_NAME
      ? [
          `Route: https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(VENUE_ADDRESS)}`,
          PARKING_INFO,
          "",
        ]
      : []),
    ...(calendarLink(reservation)
      ? [`Zet het concert in je agenda: ${calendarLink(reservation)}`, ""]
      : []),
    `Kun je toch niet komen? Annuleer je reservering: ${SITE_URL}/annuleren/${reservation.cancelCode}`,
    "Wil je je reservering wijzigen? Beantwoord dan deze e-mail.",
    "",
    "Tot ziens bij het concert!",
    "",
    "Met vriendelijke groet,",
    "Bergharen Klassiek",
  ].join("\n");

  const options = { name: SENDER_NAME, replyTo: SENDER_EMAIL };
  if (GmailApp.getAliases().includes(SENDER_EMAIL)) {
    options.from = SENDER_EMAIL;
  }
  GmailApp.sendEmail(
    reservation.email,
    `Bevestiging reservering: ${reservation.title}`,
    body,
    options,
  );
}

function locationLine(reservation) {
  return reservation.location === VENUE_NAME
    ? `${VENUE_NAME}, ${VENUE_ADDRESS}`
    : reservation.location;
}

// Only a real slug ends up in the link, because anyone can post to this script and the email goes to any address
function calendarLink(reservation) {
  return /^[\p{L}\p{N}-]+$/u.test(reservation.slug)
    ? `${SITE_URL}/agenda/${encodeURIComponent(reservation.slug)}.ics`
    : "";
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
  const existing = lastColumn
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String)
    : [];
  const columns = {};
  existing.forEach((header, i) => {
    if (header) {
      columns[header] = i + 1;
    }
  });

  let next = existing.length + 1;
  for (const header of headers) {
    if (!columns[header]) {
      sheet.getRange(1, next).setValue(header).setFontWeight("bold");
      columns[header] = next++;
    }
  }

  return { sheet, columns };
}

// Appends a row with the given values, each placed in the column with that header
function appendRow(target, values) {
  const width = Math.max(...Object.values(target.columns));
  const row = new Array(width).fill("");
  for (const [header, value] of Object.entries(values)) {
    row[target.columns[header] - 1] = value;
  }
  target.sheet.appendRow(row);
}

function clean(value, maxLength) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
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
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
