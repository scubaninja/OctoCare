import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CSV_UTF8_BOM,
  downloadCsv,
  escapeCsvField,
  sanitizeCsvFormulaInjection,
  toCsv,
} from './csv';

describe('sanitizeCsvFormulaInjection', () => {
  it('leaves ordinary text untouched', () => {
    expect(sanitizeCsvFormulaInjection('Reset your password')).toBe('Reset your password');
  });

  it.each(['=', '+', '-', '@', '\t', '\r'])(
    'prefixes values starting with "%s" with a single quote',
    (trigger) => {
      const value = `${trigger}HYPERLINK("https://evil.example","click")`;
      expect(sanitizeCsvFormulaInjection(value)).toBe(`'${value}`);
    },
  );

  it('does not treat a formula-trigger character in the middle of a value as dangerous', () => {
    expect(sanitizeCsvFormulaInjection('Totals = 12')).toBe('Totals = 12');
  });
});

describe('escapeCsvField', () => {
  it('returns plain values unchanged', () => {
    expect(escapeCsvField('Reset your password')).toBe('Reset your password');
  });

  it('quotes values containing a comma', () => {
    expect(escapeCsvField('Account, Billing')).toBe('"Account, Billing"');
  });

  it('quotes and doubles internal double quotes', () => {
    expect(escapeCsvField('Say "hello"')).toBe('"Say ""hello"""');
  });

  it('quotes values containing a line feed', () => {
    expect(escapeCsvField('Line one\nLine two')).toBe('"Line one\nLine two"');
  });

  it('quotes values containing a carriage return', () => {
    expect(escapeCsvField('Line one\r\nLine two')).toBe('"Line one\r\nLine two"');
  });

  it('neutralizes formula-injection payloads before quoting', () => {
    expect(escapeCsvField('=SUM(A1:A9)')).toBe("'=SUM(A1:A9)");
  });

  it('neutralizes and quotes when a formula payload also contains a comma', () => {
    expect(escapeCsvField('=SUM(A1,A9)')).toBe('"\'=SUM(A1,A9)"');
  });
});

describe('toCsv', () => {
  type Row = { name: string; note: string };
  const columns = [
    { header: 'Name', getValue: (row: Row) => row.name },
    { header: 'Note', getValue: (row: Row) => row.note },
  ];

  it('produces a header-only CSV for an empty list', () => {
    expect(toCsv<Row>([], columns)).toBe('Name,Note');
  });

  it('serializes rows in order, joined with CRLF', () => {
    const rows: Row[] = [
      { name: 'Ada', note: 'First' },
      { name: 'Grace', note: 'Second' },
    ];

    expect(toCsv(rows, columns)).toBe('Name,Note\r\nAda,First\r\nGrace,Second');
  });

  it('escapes each field independently', () => {
    const rows: Row[] = [{ name: 'Smith, Jane', note: 'Says "hi"' }];

    expect(toCsv(rows, columns)).toBe('Name,Note\r\n"Smith, Jane","Says ""hi"""');
  });
});

describe('downloadCsv', () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    createObjectURLMock = vi.fn(() => 'blob:mock-url');
    revokeObjectURLMock = vi.fn();
    URL.createObjectURL = createObjectURLMock as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURLMock as unknown as typeof URL.revokeObjectURL;
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    clickSpy.mockRestore();
  });

  it('creates an object URL, clicks a download link, and revokes the URL', () => {
    downloadCsv('articles.csv', 'a,b\r\n1,2');

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    // The URL must be revoked only after the download has been initiated.
    expect(revokeObjectURLMock.mock.invocationCallOrder[0]).toBeGreaterThan(
      clickSpy.mock.invocationCallOrder[0],
    );
  });

  it('uses the provided filename and a CSV MIME type', () => {
    downloadCsv('my-export.csv', 'a,b');

    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe('text/csv;charset=utf-8;');
  });

  it('prepends a UTF-8 BOM to the exported content', async () => {
    downloadCsv('my-export.csv', 'a,b\r\n1,2');

    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    expect(text.startsWith(CSV_UTF8_BOM)).toBe(true);
    expect(text).toBe(`${CSV_UTF8_BOM}a,b\r\n1,2`);
  });

  it('does nothing when document is unavailable (non-browser environment)', () => {
    vi.stubGlobal('document', undefined);

    try {
      expect(() => downloadCsv('articles.csv', 'a,b')).not.toThrow();
      expect(createObjectURLMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
