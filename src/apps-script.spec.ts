import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createContext, runInContext } from 'node:vm';

// In-memory stand-in for a Google Sheet. Like Sheets, it doesn't store the apostrophe that marks a cell as text.
class FakeSheet {
  rows: unknown[][] = [];
  constructor(readonly name: string) {}
  setFrozenRows() {}
  getLastRow() {
    return this.rows.length;
  }
  getLastColumn() {
    return Math.max(0, ...this.rows.map((row) => row.length));
  }
  private set(row: number, column: number, value: unknown) {
    while (this.rows.length < row) {
      this.rows.push([]);
    }
    const stored = typeof value === 'string' && value.startsWith("'") ? value.slice(1) : value;
    this.rows[row - 1][column - 1] = stored;
  }
  deleteRow(row: number) {
    this.rows.splice(row - 1, 1);
  }
  appendRow(values: unknown[]) {
    const row = this.rows.length + 1;
    values.forEach((value, i) => this.set(row, i + 1, value));
  }
  getDataRange() {
    return { getValues: () => this.rows.map((row) => [...row]) };
  }
  getRange(row: number, column: number, rowCount = 1, columnCount = 1) {
    const range = {
      getValues: () => Array.from({ length: rowCount }, (_, r) =>
        Array.from({ length: columnCount }, (_, c) => this.rows[row - 1 + r]?.[column - 1 + c] ?? '')),
      setValue: (value: unknown) => {
        this.set(row, column, value);
        return range;
      },
      setValues: (values: unknown[][]) => {
        values.forEach((line, r) => line.forEach((value, c) => this.set(row + r, column + c, value)));
        return range;
      },
      setFontWeight: () => range,
    };
    return range;
  }
  // The rows below the headers, as objects by header
  records(): Record<string, unknown>[] {
    const [headers = [], ...rows] = this.rows;
    return rows.map((row) => Object.fromEntries(headers.map((header, i) => [String(header), row[i]])));
  }
}

describe('reservations script', () => {
  const script = readFileSync(join(process.cwd(), 'apps-script/reservations.gs'), 'utf8');
  const valid = {
    id: '123',
    slug: 'pianorecital-nicolò',
    title: 'Pianorecital',
    date: '2026-11-22 16:00',
    dateLabel: 'zo 22 november 2026',
    location: 'Protestantse Kerk Bergharen',
    name: 'Anna',
    email: 'anna@example.com',
    seats: 2,
    website: '',
  };

  let sheets: Map<string, FakeSheet>;
  let sendEmail: ReturnType<typeof vi.fn>;
  let aliases: string[];
  let releaseLock: ReturnType<typeof vi.fn>;
  let codes: number;
  let triggers: { getHandlerFunction: () => string }[];
  let context: Record<string, (...args: never[]) => { json: string }>;

  beforeEach(() => {
    sheets = new Map();
    codes = 0;
    triggers = [];
    sendEmail = vi.fn();
    aliases = [];
    releaseLock = vi.fn();
    const spreadsheet = {
      getSheetByName: (name: string) => sheets.get(name) ?? null,
      insertSheet: (name: string) => {
        const sheet = new FakeSheet(name);
        sheets.set(name, sheet);
        return sheet;
      },
    };
    context = createContext({
      console: { error: () => undefined },
      SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, flush: () => undefined },
      LockService: { getScriptLock: () => ({ waitLock: () => undefined, releaseLock }) },
      ContentService: {
        MimeType: { JSON: 'json' },
        createTextOutput: (json: string) => ({ setMimeType: () => ({ json }) }),
      },
      GmailApp: { getAliases: () => aliases, sendEmail },
      Utilities: {
        getUuid: () => `00000000-0000-4000-8000-${String(++codes).padStart(12, '0')}`,
        formatDate: (date: Date) => `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`,
      },
      ScriptApp: {
        getProjectTriggers: () => triggers,
        deleteTrigger: (trigger: unknown) => triggers.splice(triggers.indexOf(trigger as never), 1),
        newTrigger: (handler: string) => {
          const builder = {
            timeBased: () => builder,
            everyDays: () => builder,
            atHour: () => builder,
            create: () => triggers.push({ getHandlerFunction: () => handler }),
          };
          return builder;
        },
      },
    }) as never;
    runInContext(script, context as never);
  });

  const post = (data: unknown) =>
    JSON.parse((context['doPost'] as unknown as (e: unknown) => { json: string })({ postData: { contents: JSON.stringify(data) } }).json);
  const reservations = () => sheets.get('Reserveringen')?.records() ?? [];
  const concerts = () => sheets.get('Concerten')?.records() ?? [];
  const emailBody = () => sendEmail.mock.calls[0][2] as string;

  /** Sets the capacity for concert 123, by adding it to the Concerten sheet through a first small reservation */
  function setCapacity(capacity: number | string) {
    post({ ...valid, seats: 1 });
    const sheet = sheets.get('Concerten')!;
    const column = (sheet.rows[0] as string[]).indexOf('Capaciteit');
    sheet.rows[1][column] = capacity;
  }

  describe('a valid reservation', () => {
    it('should be stored', () => {
      expect(post(valid)).toEqual({ status: 'ok' });

      expect(reservations()).toHaveLength(1);
      expect(reservations()[0]).toMatchObject({
        Concert: 'Pianorecital',
        'Datum concert': 'zo 22 november 2026',
        Naam: 'Anna',
        'E-mail': 'anna@example.com',
        'Aantal personen': 2,
        'Event ID': '123',
      });
    });

    it('should release the lock', () => {
      post(valid);

      expect(releaseLock).toHaveBeenCalled();
    });

    it('should add the concert with the default capacity and update its totals', () => {
      post(valid);

      expect(concerts()[0]).toMatchObject({ Capaciteit: 120, Gereserveerd: 2, Beschikbaar: 118, 'Event ID': '123' });
    });
  });

  describe('capacity', () => {
    it('should accept reservations up to the last seat', () => {
      setCapacity(5);

      expect(post({ ...valid, seats: 4 })).toEqual({ status: 'ok' });
      expect(concerts()[0]).toMatchObject({ Gereserveerd: 5, Beschikbaar: 0 });
    });

    it('should refuse more seats than are left, and say how many remain', () => {
      setCapacity(5);

      expect(post({ ...valid, seats: 5 })).toEqual({ status: 'full', remaining: 4 });
      expect(reservations()).toHaveLength(1);
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should report no seats left for a full concert', () => {
      setCapacity(1);

      expect(post({ ...valid, seats: 1 })).toEqual({ status: 'full', remaining: 0 });
    });

    it('should not report negative seats when the capacity was lowered', () => {
      post({ ...valid, seats: 8 });
      const sheet = sheets.get('Concerten')!;
      sheet.rows[1][(sheet.rows[0] as string[]).indexOf('Capaciteit')] = 3;

      expect(post({ ...valid, seats: 1 })).toEqual({ status: 'full', remaining: 0 });
    });

    it('should fall back to the default for an empty or invalid capacity', () => {
      setCapacity('');
      expect(post({ ...valid, seats: 8 })).toEqual({ status: 'ok' });

      const sheet = sheets.get('Concerten')!;
      sheet.rows[1][(sheet.rows[0] as string[]).indexOf('Capaciteit')] = 'veel';
      expect(post({ ...valid, seats: 8 })).toEqual({ status: 'ok' });
    });

    it('should count each concert separately', () => {
      setCapacity(1);

      expect(post({ ...valid, id: '456', seats: 8 })).toEqual({ status: 'ok' });
    });

    it('should hold the lock while refusing too', () => {
      setCapacity(1);
      releaseLock.mockClear();

      post({ ...valid, seats: 1 });

      expect(releaseLock).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalid input', () => {
    it.each([
      ['a missing id', { id: '' }],
      ['an id that is not a number', { id: 'abc' }],
      ['a missing title', { title: '' }],
      ['a missing name', { name: '   ' }],
      ['an invalid email address', { email: 'geen-adres' }],
      ['no seats', { seats: 0 }],
      ['too many seats', { seats: 9 }],
      ['a partial seat', { seats: 1.5 }],
      ['seats that are not a number', { seats: 'twee' }],
    ])('should refuse %s', (_name, change) => {
      expect(post({ ...valid, ...change })).toEqual({ status: 'invalid' });
      expect(reservations()).toHaveLength(0);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should refuse a body that is not JSON', () => {
      const output = (context['doPost'] as unknown as (e: unknown) => { json: string })({ postData: { contents: '{' } });

      expect(JSON.parse(output.json)).toEqual({ status: 'invalid' });
    });

    it('should accept the maximum number of seats', () => {
      expect(post({ ...valid, seats: 8 })).toEqual({ status: 'ok' });
    });
  });

  describe('protection', () => {
    it('should pretend a bot succeeded, without storing or emailing', () => {
      expect(post({ ...valid, website: 'https://spam.example' })).toEqual({ status: 'ok' });

      expect(reservations()).toHaveLength(0);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should stop input from running as a spreadsheet formula', () => {
      post(valid);

      // The fake sheet removes the apostrophe, so this checks what was written instead
      const written = sheets.get('Reserveringen')!;
      const appendRow = vi.spyOn(written, 'appendRow');
      post({ ...valid, name: '=IMPORTXML("https://evil.example")' });

      const headers = written.rows[0] as string[];
      expect(appendRow.mock.calls[0][0][headers.indexOf('Naam')]).toBe('\'=IMPORTXML("https://evil.example")');
    });

    it('should cut off very long input', () => {
      post({ ...valid, name: 'x'.repeat(500) });

      expect(reservations()[0]['Naam']).toHaveLength(100);
    });
  });

  describe('confirmation email', () => {
    it('should go to the guest with the concert details, and replies to the foundation', () => {
      post(valid);

      const [to, subject, body, options] = sendEmail.mock.calls[0];
      expect(to).toBe('anna@example.com');
      expect(subject).toBe('Bevestiging reservering: Pianorecital');
      expect(body).toContain('Beste Anna,');
      expect(body).toContain('Datum: zo 22 november 2026');
      expect(body).toContain('Tijd: 16:00 uur');
      expect(body).toContain('Aantal: 2 personen');
      expect(options.replyTo).toBe('bergharenklassiek@outlook.com');
    });

    it('should use the singular for one person', () => {
      post({ ...valid, seats: 1 });

      expect(emailBody()).toContain('Aantal: 1 persoon\n');
    });

    it('should only send from the foundation address once Gmail allows it', () => {
      post(valid);
      expect(sendEmail.mock.calls[0][3].from).toBeUndefined();

      aliases = ['bergharenklassiek@outlook.com'];
      post(valid);
      expect(sendEmail.mock.calls[1][3].from).toBe('bergharenklassiek@outlook.com');
    });

    it('should include the address, route and parking for our venue', () => {
      post(valid);

      expect(emailBody()).toContain('Locatie: Protestantse Kerk Bergharen, Veldsestraat 12, Bergharen');
      expect(emailBody()).toContain('Route: https://www.google.com/maps/dir/?api=1&destination=Veldsestraat%2012%2C%20Bergharen');
      expect(emailBody()).toContain('Parkeren: gratis op de parkeerplaatsen bij de kerk.');
    });

    it('should not claim our route and parking for another venue', () => {
      post({ ...valid, location: 'Concertgebouw' });

      expect(emailBody()).toContain('Locatie: Concertgebouw\n');
      expect(emailBody()).not.toContain('Route:');
      expect(emailBody()).not.toContain('Parkeren:');
    });

    it('should link to the calendar file, with an encoded slug', () => {
      post(valid);

      expect(emailBody()).toContain('Zet het concert in je agenda: https://bergharenklassiek.nl/agenda/pianorecital-nicol%C3%B2.ics');
    });

    it.each([
      ['a missing slug', ''],
      ['a slug that tries to add a link', 'x https://evil.example/ y'],
      ['a slug with a path', '../evil'],
    ])('should leave out the calendar link for %s', (_name, slug) => {
      post({ ...valid, slug });

      expect(emailBody()).not.toContain('Zet het concert');
      expect(emailBody()).not.toContain('evil');
    });

    it('should keep the reservation when the email fails', () => {
      sendEmail.mockImplementation(() => {
        throw new Error('Gmail is down');
      });

      expect(post(valid)).toEqual({ status: 'ok' });
      expect(reservations()).toHaveLength(1);
    });
  });

  describe('cancelling', () => {
    const code = '00000000-0000-4000-8000-000000000001';

    it('should store a different code for every reservation, and email the link', () => {
      post(valid);
      post(valid);

      expect(reservations().map((row) => row['Annuleercode'])).toEqual([code, '00000000-0000-4000-8000-000000000002']);
      expect(emailBody()).toContain(`https://bergharenklassiek.nl/annuleren/${code}`);
    });

    it('should look up the details without changing anything', () => {
      post(valid);

      expect(post({ action: 'lookup', code })).toEqual({
        status: 'ok',
        details: { title: 'Pianorecital', dateLabel: 'zo 22 november 2026', seats: 2 },
      });
      expect(reservations().length).toBe(1);
    });

    it('should delete only that reservation and free its seats', () => {
      post(valid);
      post({ ...valid, name: 'Bert', seats: 3 });

      expect(post({ action: 'cancel', code })).toEqual({ status: 'ok' });

      expect(reservations().map((row) => row['Naam'])).toEqual(['Bert']);
      expect(concerts()[0]['Gereserveerd']).toBe(3);
      expect(concerts()[0]['Beschikbaar']).toBe(117);
    });

    it('should not find a reservation that was already cancelled', () => {
      post(valid);
      post({ action: 'cancel', code });

      expect(post({ action: 'cancel', code })).toEqual({ status: 'not_found' });
      expect(post({ action: 'lookup', code })).toEqual({ status: 'not_found' });
    });

    it.each([[''], ['geen-code'], [undefined]])('should not accept the code %s', (badCode) => {
      post(valid);

      expect(post({ action: 'cancel', code: badCode })).toEqual({ status: 'not_found' });
      expect(reservations().length).toBe(1);
    });

    it('should not let an empty code match an older reservation without a code', () => {
      post(valid);
      const sheet = sheets.get('Reserveringen')!;
      sheet.rows[1][(sheet.rows[0] as string[]).indexOf('Annuleercode')] = '';

      expect(post({ action: 'cancel', code: '' })).toEqual({ status: 'not_found' });
      expect(post({ action: 'cancel', code })).toEqual({ status: 'not_found' });
      expect(reservations().length).toBe(1);
    });

    it('should release the lock', () => {
      post(valid);
      releaseLock.mockClear();

      post({ action: 'lookup', code });

      expect(releaseLock).toHaveBeenCalled();
    });

    it('should not send an email', () => {
      post(valid);
      sendEmail.mockClear();

      post({ action: 'cancel', code });

      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('reminders', () => {
    // The concert in `valid` is on 22 November, so its reminders start on the 15th
    const remind = (day: number, month = 10) =>
      (context['sendRemindersOn'] as unknown as (now: Date) => void)(new Date(2026, month, day, 10));
    const emailOn = (index: number) => sendEmail.mock.calls[index];

    /** Adds reservations for the concert, booked long before it */
    function book(count: number, overrides = {}) {
      setCapacity(1000);
      sheets.get('Reserveringen')!.rows.splice(1);
      for (let i = 0; i < count; i++) {
        post({ ...valid, seats: 1, email: `guest${i}@example.com`, ...overrides });
      }
      const sheet = sheets.get('Reserveringen')!;
      const received = (sheet.rows[0] as string[]).indexOf('Ontvangen');
      sheet.rows.slice(1).forEach((row) => (row[received] = new Date(2026, 9, 1)));
      sendEmail.mockClear();
    }
    const setCell = (rowIndex: number, header: string, value: unknown) => {
      const sheet = sheets.get('Reserveringen')!;
      sheet.rows[rowIndex + 1][(sheet.rows[0] as string[]).indexOf(header)] = value;
    };
    const reminded = () => reservations().filter((row) => row['Herinnering verstuurd']).length;

    it('should not be sent more than a week before the concert', () => {
      book(1);
      remind(14);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should be sent a week before the concert, with the details and cancel link', () => {
      book(1);
      remind(15);

      expect(sendEmail).toHaveBeenCalledTimes(1);
      const [to, subject, body, options] = emailOn(0);
      expect(to).toBe('guest0@example.com');
      expect(subject).toBe('Herinnering: Pianorecital');
      expect(body).toContain('Beste Anna,');
      expect(body).toContain('Datum: zo 22 november 2026');
      expect(body).toContain('Tijd: 16:00 uur');
      expect(body).toContain('Veldsestraat 12, Bergharen');
      expect(body).toContain('.ics');
      expect(body).toContain(`/annuleren/${reservations()[0]['Annuleercode']}`);
      expect(options.replyTo).toBe('bergharenklassiek@outlook.com');
    });

    it('should be sent only once', () => {
      book(1);
      remind(15);
      remind(16);
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should send more than 100 registrations over two days', () => {
      book(120);

      remind(15);
      expect(sendEmail).toHaveBeenCalledTimes(80);
      expect(reminded()).toBe(80);

      remind(16);
      expect(sendEmail).toHaveBeenCalledTimes(120);
      expect(reminded()).toBe(120);
      expect(new Set(sendEmail.mock.calls.map(([to]) => to)).size).toBe(120);
    });

    it('should send everything in one day when it fits', () => {
      book(80);
      remind(15);
      expect(reminded()).toBe(80);
    });

    it('should catch up after a missed day, but not on the day of the concert', () => {
      book(2);
      remind(22);
      expect(sendEmail).not.toHaveBeenCalled();

      remind(21);
      expect(sendEmail).toHaveBeenCalledTimes(2);
    });

    it('should skip guests who booked in the final week, or on the day it started', () => {
      book(2);
      setCell(0, 'Ontvangen', new Date(2026, 10, 15, 8));
      setCell(1, 'Ontvangen', new Date(2026, 10, 14, 8));
      remind(15);

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(emailOn(0)[0]).toBe('guest1@example.com');
    });

    it('should not remind a cancelled guest', () => {
      book(2);
      post({ action: 'cancel', code: reservations()[0]['Annuleercode'] });
      remind(15);

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(emailOn(0)[0]).toBe('guest1@example.com');
    });

    it('should mark the right row when an email was cancelled during the batch', () => {
      book(3);
      sendEmail.mockImplementationOnce(() => {
        post({ action: 'cancel', code: reservations()[0]['Annuleercode'] });
      });
      remind(15);

      expect(reservations().map((row) => row['E-mail'])).toEqual(['guest1@example.com', 'guest2@example.com']);
      expect(reminded()).toBe(2);
    });

    it('should skip a row where the column was filled in by hand', () => {
      book(1);
      setCell(0, 'Herinnering verstuurd', 'concert afgelast');
      remind(15);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should follow a changed date in the Concertmoment column', () => {
      book(1);
      setCell(0, 'Concertmoment', '2026-12-06 16:00');
      remind(15);
      expect(sendEmail).not.toHaveBeenCalled();

      remind(29);
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should send the soonest concert first when the limit is reached', () => {
      book(81);
      setCell(80, 'Concertmoment', '2026-11-18 16:00');
      remind(15);
      expect(emailOn(0)[0]).toBe('guest80@example.com');
    });

    it('should work for an older reservation that only has the Dutch date', () => {
      book(1);
      for (const header of ['Concertmoment', 'Locatie', 'Slug', 'Annuleercode']) {
        setCell(0, header, '');
      }
      remind(15);

      const body = emailOn(0)[2];
      expect(body).toContain('Datum: zo 22 november 2026');
      expect(body).toContain('Beantwoord dan deze e-mail, zodat iemand anders');
      expect(body).not.toContain('/annuleren/');
      expect(body).not.toContain('Locatie:');
    });

    it.each([
      ['januari', 0], ['februari', 1], ['maart', 2], ['april', 3], ['mei', 4], ['juni', 5],
      ['juli', 6], ['augustus', 7], ['september', 8], ['oktober', 9], ['november', 10], ['december', 11],
    ])('should read %s in an older reservation', (name, month) => {
      book(1);
      setCell(0, 'Concertmoment', '');
      setCell(0, 'Datum concert', `zo 10 ${name} 2027`);
      setCell(0, 'Ontvangen', new Date(2026, 0, 1));
      (context['sendRemindersOn'] as unknown as (now: Date) => void)(new Date(2027, month, 3, 10));
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should show a date cell that Sheets turned into a real date', () => {
      book(1);
      setCell(0, 'Concertmoment', '');
      setCell(0, 'Datum concert', new Date(2026, 10, 22));
      remind(15);
      expect(emailOn(0)[2]).toContain('Datum: 22-11-2026');
    });

    it('should mark nothing for a failed email, carry on, and try again the next day', () => {
      book(2);
      sendEmail.mockImplementationOnce(() => {
        throw new Error('Service invoked too many times');
      });
      remind(15);

      expect(reservations().map((row) => Boolean(row['Herinnering verstuurd']))).toEqual([false, true]);
      remind(16);
      expect(reminded()).toBe(2);
    });

    it('should release the lock after every email', () => {
      book(2);
      releaseLock.mockClear();
      remind(15);
      expect(releaseLock).toHaveBeenCalledTimes(3);
    });

    it('should keep one daily trigger when it is installed twice', () => {
      (context['installReminderTrigger'] as unknown as () => void)();
      (context['installReminderTrigger'] as unknown as () => void)();
      expect(triggers.map((trigger) => trigger.getHandlerFunction())).toEqual(['sendReminders']);
    });
  });

  describe('existing spreadsheets', () => {
    it('should find columns that were moved, and add missing ones', () => {
      const sheet = new FakeSheet('Reserveringen');
      sheet.appendRow(['Naam', 'Eigen kolom', 'Event ID', 'Aantal personen']);
      sheet.appendRow(['Bert', 'notitie', '123', 3]);
      sheets.set('Reserveringen', sheet);

      post(valid);

      expect(reservations()[1]).toMatchObject({ Naam: 'Anna', 'Event ID': '123', 'Aantal personen': 2, 'E-mail': 'anna@example.com' });
      expect(reservations()[1]['Eigen kolom']).toBe('');
      expect(concerts()[0]).toMatchObject({ Gereserveerd: 5 });
    });

    it('should skip rows without an event ID when counting', () => {
      const sheet = new FakeSheet('Reserveringen');
      sheet.appendRow(['Event ID', 'Aantal personen']);
      sheet.appendRow(['', 50]);
      sheets.set('Reserveringen', sheet);

      post(valid);

      expect(concerts()[0]).toMatchObject({ Gereserveerd: 2 });
    });
  });
});
