/**
 * @typedef {import('./types').SupportCase} SupportCase
 * @typedef {{ status: string, priority: string, category: string }} CaseFilters
 */

/**
 * @param {SupportCase[]} cases
 * @param {CaseFilters} filters
 */
export function filterSupportCases(cases, filters) {
  return cases.filter((supportCase) =>
    (!filters.status || supportCase.status === filters.status)
    && (!filters.priority || supportCase.priority === filters.priority)
    && (!filters.category || supportCase.category === filters.category),
  );
}

function escapeCsvCell(value) {
  let cell = String(value ?? '');
  if (/^[\u0000-\u0020]*[=+\-@]/.test(cell)) {
    cell = `'${cell}`;
  }
  return `"${cell.replaceAll('"', '""')}"`;
}

/**
 * @param {SupportCase[]} cases
 */
export function createSupportCasesCsv(cases) {
  const rows = [
    ['Case ID', 'Subject', 'Customer', 'Priority', 'Status', 'Category', 'SLA status', 'Created'],
    ...cases.map((supportCase) => [
      supportCase.id,
      supportCase.subject,
      supportCase.customerName || supportCase.customerEmail || 'Unknown',
      supportCase.priority,
      supportCase.status,
      supportCase.category,
      supportCase.slaStatus || 'Monitoring',
      supportCase.createdAt,
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}
