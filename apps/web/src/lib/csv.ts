/**
 * Generic, DOM-light CSV helpers shared by any screen that needs to export
 * the data currently displayed to the user (e.g. a filtered results table).
 *
 * The serialization logic (`escapeCsvField`, `toCsv`) is pure and has no
 * browser dependency so it can be unit tested in isolation. `downloadCsv`
 * is the only piece that touches the DOM/Blob APIs and is kept intentionally
 * small so it can be mocked in component tests.
 */

export type CsvColumn<T> = {
  header: string;
  getValue: (row: T) => string;
};

/**
 * UTF-8 byte-order mark. Prepending it to the CSV payload lets spreadsheet
 * applications such as Excel reliably detect UTF-8 encoding instead of
 * mis-rendering non-ASCII characters (e.g. curly quotes, accented letters).
 */
export const CSV_UTF8_BOM = '\uFEFF';

const CSV_MIME_TYPE = 'text/csv;charset=utf-8;';

/**
 * Characters that spreadsheet applications (Excel, Google Sheets, LibreOffice)
 * treat as the start of a formula when a cell begins with them. Left
 * unescaped, a malicious article title/content such as `=HYPERLINK(...)`
 * could execute a formula when the exported file is opened.
 */
const FORMULA_TRIGGER_CHARACTERS = new Set(['=', '+', '-', '@', '\t', '\r']);

/**
 * Neutralizes CSV/formula-injection payloads by prefixing values that start
 * with a formula-trigger character with a single quote, per OWASP guidance.
 * Spreadsheet applications then treat the cell as literal text.
 */
export function sanitizeCsvFormulaInjection(value: string): string {
  if (value.length > 0 && FORMULA_TRIGGER_CHARACTERS.has(value[0])) {
    return `'${value}`;
  }

  return value;
}

/**
 * Escapes a single CSV field: neutralizes formula-injection payloads, then
 * quotes/doubles internal quotes per RFC 4180 whenever the value contains a
 * comma, double quote, or line break (CR and/or LF).
 */
export function escapeCsvField(value: string): string {
  const sanitized = sanitizeCsvFormulaInjection(value);
  const needsQuoting = /[",\r\n]/.test(sanitized);
  const escaped = sanitized.replace(/"/g, '""');

  return needsQuoting ? `"${escaped}"` : escaped;
}

/**
 * Serializes rows into RFC 4180-style CSV text (CRLF line endings) using the
 * supplied column definitions. Pure function with no DOM access, so it can
 * be unit tested without a browser environment.
 */
export function toCsv<T>(rows: T[], columns: Array<CsvColumn<T>>): string {
  const headerLine = columns.map((column) => escapeCsvField(column.header)).join(',');
  const rowLines = rows.map((row) =>
    columns.map((column) => escapeCsvField(column.getValue(row) ?? '')).join(','),
  );

  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Triggers a client-side download of CSV text as a file. Only touches the
 * DOM/Blob APIs (kept isolated so it can be mocked in component tests).
 * Prepends a UTF-8 BOM so Excel opens the file with the correct encoding,
 * and revokes the generated object URL immediately after the download is
 * initiated to avoid leaking memory.
 */
export function downloadCsv(filename: string, csvContent: string): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob([CSV_UTF8_BOM, csvContent], { type: CSV_MIME_TYPE });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
