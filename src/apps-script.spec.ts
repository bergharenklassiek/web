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
  let context: Record<string, (...args: never[]) => { json: string }>;

  beforeEach(() => {
    sheets = new Map();
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
