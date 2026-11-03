/**
 * Reservations for Bergharen Klassiek.
 *
 * Receives reservations from the website, stores them in this spreadsheet and sends the guest a confirmation email.
 * A daily trigger emails guests a reminder a week before their concert.
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
  "Concertmoment",
  "Locatie",
  "Slug",
  "Herinnering verstuurd",
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
const REMINDER_DAYS_BEFORE = 7;
// A free Google account can send about 100 emails a day. The rest of the day's emails are kept free for confirmations,
// and any reminders over this limit go out the next day.
const MAX_REMINDERS_PER_DAY = 80;
const REMINDER_HOUR = 10;
// The first three letters of each month, as the website writes it out in "Datum concert"
const DUTCH_MONTHS = [
  "jan",
  "feb",
  "maa",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

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
      // As text, because Sheets would otherwise turn it into a date in its own time zone
      Concertmoment: asText(reservation.date),
      Locatie: safeCell(reservation.location),
      Slug: safeCell(reservation.slug),
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
  const lines = [
    `Beste ${reservation.name},`,
    "",
    "Bedankt voor je reservering. We hebben het volgende voor je genoteerd:",
    "",
    ...concertDetails(reservation),
    linkLine(
      "Kun je toch niet komen? ",
      "Annuleer je reservering",
      `${SITE_URL}/annuleren/${reservation.cancelCode}`,
    ),
    ...emailEnding(),
  ];
  sendToGuest(reservation, `Bevestiging reservering: ${reservation.title}`, lines);
}

// Run this once from the Apps Script editor. Running it again replaces the trigger, so there's never more than one.
function installReminderTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "sendReminders")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger("sendReminders")
    .timeBased()
    .everyDays(1)
    .atHour(REMINDER_HOUR)
    .create();
}

function sendReminders() {
  sendRemindersOn(new Date());
}

/**
 * Sends the reminders that are due, up to the daily limit. The next day's run sends the rest, because each row is marked
 * once it's sent. A failed email stays unmarked, so it's tried again the next day.
 *
 * The lock is held for one email at a time, because guests would get an error if a reservation had to wait for the whole
 * batch. So the rows are read again for each email: a cancellation in between can move them.
 */
function sendRemindersOn(now) {
  const today = dayNumber(now.getFullYear(), now.getMonth(), now.getDate());
  const failed = new Set();
  let sent = 0;
  while (sent < MAX_REMINDERS_PER_DAY) {
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const reservations = getOrCreateSheet(
        SpreadsheetApp.getActiveSpreadsheet(),
        RESERVATIONS_SHEET,
        RESERVATION_COLUMNS,
      );
      const due = nextDueReminder(reservations, today, failed);
      if (!due) {
        return;
      }
      try {
        sendReminder(due.reservation);
      } catch (err) {
        console.error(`Reminder to ${due.reservation.email} failed: ${err}`);
        failed.add(due.key);
        continue;
      }
      reservations.sheet
        .getRange(due.rowNumber, reservations.columns["Herinnering verstuurd"])
        .setValue(new Date());
      SpreadsheetApp.flush();
      sent++;
    } finally {
      lock.releaseLock();
    }
  }
}

// The due reminder for the soonest concert, or null when there are none left
function nextDueReminder(reservations, today, failed) {
  const rows = reservations.sheet.getDataRange().getValues();
  const value = (row, header) => row[reservations.columns[header] - 1] ?? "";
  let next = null;
  let nextDaysLeft = Infinity;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const key = JSON.stringify(row);
    // Reservations from before the Concertmoment column only have the date in Dutch
    const concertDay =
      toDayNumber(value(row, "Concertmoment")) ??
      toDayNumber(value(row, "Datum concert"));
    if (
      value(row, "Herinnering verstuurd") ||
      !value(row, "E-mail") ||
      concertDay === null ||
      failed.has(key)
    ) {
      continue;
    }

    const daysLeft = concertDay - today;
    const receivedDay = toDayNumber(value(row, "Ontvangen"));
    // Someone who books in the final week just got all of this in their confirmation
    const bookedInFinalWeek =
      receivedDay !== null && concertDay - receivedDay <= REMINDER_DAYS_BEFORE;
    if (
      daysLeft >= 1 &&
      daysLeft <= REMINDER_DAYS_BEFORE &&
      !bookedInFinalWeek &&
      daysLeft < nextDaysLeft
    ) {
      nextDaysLeft = daysLeft;
      next = {
        key,
        rowNumber: i + 1,
        reservation: {
          title: String(value(row, "Concert")),
          date: String(value(row, "Concertmoment")),
          dateLabel: dateLabelFromCell(value(row, "Datum concert")),
          location: String(value(row, "Locatie")),
          slug: String(value(row, "Slug")),
          name: String(value(row, "Naam")),
          email: String(value(row, "E-mail")),
          seats: Number(value(row, "Aantal personen")),
          cancelCode: String(value(row, "Annuleercode")),
        },
      };
    }
  }
  return next;
}

function sendReminder(reservation) {
  const lines = [
    `Beste ${reservation.name},`,
    "",
    "Binnenkort is het zover! Je hebt gereserveerd voor dit concert:",
    "",
    ...concertDetails(reservation),
    // Reservations from before the Annuleercode column have no cancel link
    reservation.cancelCode
      ? linkLine(
          "Kun je toch niet komen? ",
          "Annuleer dan je reservering, zodat iemand anders je plek kan krijgen",
          `${SITE_URL}/annuleren/${reservation.cancelCode}`,
        )
      : textBullet(
          "Kun je toch niet komen? Beantwoord dan deze e-mail, zodat iemand anders je plek kan krijgen.",
        ),
    ...emailEnding(),
  ];
  sendToGuest(reservation, `Herinnering: ${reservation.title}`, lines);
}

// A running count of days, which isn't affected by daylight saving time
function dayNumber(year, month, day) {
  return Date.UTC(year, month, day) / 86400000;
}

// Reads a date cell, "2026-11-22 16:00" or "zo 22 november 2026". Returns null when it isn't a date.
function toDayNumber(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return isNaN(value)
      ? null
      : dayNumber(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const iso = String(value).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return dayNumber(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }
  const dutch = String(value).match(/(\d{1,2})\s+(\p{L}{3})\p{L}*\s+(\d{4})/u);
  const month = dutch ? DUTCH_MONTHS.indexOf(dutch[2].toLowerCase()) : -1;
  return month === -1
    ? null
    : dayNumber(Number(dutch[3]), month, Number(dutch[1]));
}

// Sheets may have turned an edited date cell into a real date
function dateLabelFromCell(value) {
  return Object.prototype.toString.call(value) === "[object Date]"
    ? Utilities.formatDate(value, "Europe/Amsterdam", "d-M-yyyy")
    : String(value);
}

function concertDetails(reservation) {
  const persons =
    reservation.seats === 1 ? "1 persoon" : `${reservation.seats} personen`;
  // Storyblok dates look like "2026-11-15 20:00" and may be marked as UTC, but the time is already the local time.
  // So it's read from the text as-is, without converting time zones.
  const time = (reservation.date.match(/\b(\d{1,2}:\d{2})/) || [])[1];
  return [
    `Concert: ${reservation.title}`,
    `Datum: ${reservation.dateLabel || reservation.date}`,
    ...(time ? [`Tijd: ${time} uur`] : []),
    ...(reservation.location ? [`Locatie: ${locationLine(reservation)}`] : []),
    `Aantal: ${persons}`,
    "",
    ...(reservation.location === VENUE_NAME
      ? [
          linkLine(
            "",
            "Route",
            `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(VENUE_ADDRESS)}`,
          ),
          textBullet(PARKING_INFO),
        ]
      : []),
    ...(calendarLink(reservation)
      ? [linkLine("", "Zet het concert in je agenda", calendarLink(reservation))]
      : []),
  ];
}

function emailEnding() {
  return [
    "",
    "Wil je je reservering wijzigen? Beantwoord dan deze e-mail.",
    "",
    "Tot ziens bij het concert!",
    "",
    "Met vriendelijke groet,",
    "Bergharen Klassiek",
  ];
}

// A bullet with a link: clickable text in the HTML version, and the full address in the plain text version
function linkLine(before, text, url) {
  return {
    plain: `- ${before}${text}: ${url}`,
    html: `${escapeHtml(before)}<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>`,
  };
}

function textBullet(text) {
  return { plain: `- ${text}`, html: escapeHtml(text) };
}

// Bullets next to each other become one list. A list has its own spacing, so the empty lines around it are left out.
function toHtml(lines) {
  const isBullet = (line) => line !== undefined && line.html !== undefined;
  let html = "";
  lines.forEach((line, i) => {
    if (isBullet(line)) {
      html += `${isBullet(lines[i - 1]) ? "" : "<ul>"}<li>${line.html}</li>`;
      html += isBullet(lines[i + 1]) ? "" : "</ul>";
    } else if (line !== "" || !(isBullet(lines[i - 1]) || isBullet(lines[i + 1]))) {
      html += `${escapeHtml(line)}<br>`;
    }
  });
  return html;
}

// Names and titles come from a public form, so they mustn't be able to add links or markup to the email
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Sends an email with an HTML version, plus a plain text version for mail apps that don't show HTML
function sendToGuest(reservation, subject, lines) {
  const body = lines.map((line) => line.plain ?? line).join("\n");
  const options = {
    name: SENDER_NAME,
    replyTo: SENDER_EMAIL,
    htmlBody: toHtml(lines),
  };
  if (GmailApp.getAliases().includes(SENDER_EMAIL)) {
    options.from = SENDER_EMAIL;
  }
  GmailApp.sendEmail(reservation.email, subject, body, options);
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
