import test from 'node:test';
import assert from 'node:assert/strict';

import { createSupportCasesCsv, filterSupportCases } from '../src/lib/dashboard-export.mjs';

const cases = [
  {
    id: 'case-1',
    subject: 'Damaged, "fragile" item',
    customerName: 'Taylor',
    customerEmail: 'taylor@example.com',
    priority: 'High',
    status: 'Open',
    category: 'Shipping',
    slaStatus: 'At Risk',
    createdAt: '2026-10-01T12:30:00Z',
  },
  {
    id: 'case-2',
    subject: '=HYPERLINK("https://example.test")',
    customerName: '',
    customerEmail: 'alex@example.com',
    priority: 'Low',
    status: 'Resolved',
    category: 'Billing',
    slaStatus: '',
    createdAt: '2026-10-02T12:30:00Z',
  },
];

test('filters cases by every selected queue filter', () => {
  assert.deepEqual(
    filterSupportCases(cases, { status: 'Open', priority: 'High', category: 'Shipping' }),
    [cases[0]],
  );
  assert.deepEqual(
    filterSupportCases(cases, { status: 'Open', priority: '', category: 'Billing' }),
    [],
  );
});

test('exports quoted CSV and neutralizes spreadsheet formulas', () => {
  const csv = createSupportCasesCsv(cases);

  assert.match(csv, /^"Case ID","Subject","Customer","Priority","Status","Category","SLA status","Created"/);
  assert.match(csv, /"Damaged, ""fragile"" item"/);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.test""\)"/);
  assert.match(csv, /"alex@example\.com","Low","Resolved","Billing","Monitoring"/);
});

test('CSV export contains only cases matching the active filters', () => {
  const filtered = filterSupportCases(cases, { status: 'Open', priority: '', category: '' });
  const csv = createSupportCasesCsv(filtered);

  assert.match(csv, /"case-1"/);
  assert.doesNotMatch(csv, /"case-2"/);
  assert.equal(csv.split('\r\n').length, 2);
});
