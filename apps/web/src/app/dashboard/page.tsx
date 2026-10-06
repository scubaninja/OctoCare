'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Clock3, Download, Loader2, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { apiGet } from '@/lib/api';
import { createSupportCasesCsv, filterSupportCases } from '@/lib/dashboard-export.mjs';
import { normalizeSupportCases } from '@/lib/normalize';
import type { DashboardStats, SupportCase } from '@/lib/types';
import { formatDateTime, titleCase } from '@/lib/utils';

type CaseFilters = {
  status: string;
  priority: string;
  category: string;
};

const defaultStats: DashboardStats = {
  totalCases: 0,
  openCases: 0,
  criticalCases: 0,
  slaAtRisk: 0,
};

const defaultFilters: CaseFilters = {
  status: '',
  priority: '',
  category: '',
};

function getSlaClass(value?: string) {
  const normalized = value?.toLowerCase() || '';
  if (normalized.includes('risk')) return 'bg-amber-100 text-amber-800';
  if (normalized.includes('breach')) return 'bg-red-100 text-red-700';
  if (normalized.includes('safe')) return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<CaseFilters>(defaultFilters);

  const filteredCases = filterSupportCases(cases, filters);

  function exportFilteredCases() {
    const blob = new Blob([createSupportCasesCsv(filteredCases)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `octocare-cases-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    async function loadDashboard() {
      try {
        const nextCases = normalizeSupportCases(await apiGet('/api/cases'));
        const activeCases = nextCases.filter((supportCase) => !['Resolved', 'Closed'].includes(supportCase.status));
        setStats({
          totalCases: nextCases.length,
          openCases: activeCases.length,
          criticalCases: nextCases.filter((supportCase) => ['Critical', 'Urgent'].includes(supportCase.priority)).length,
          slaAtRisk: activeCases.filter((supportCase) => supportCase.slaStatus !== 'Safe').length,
        });
        setCases(nextCases);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load the agent dashboard.');
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const statCards = [
    { label: 'Total cases', value: stats.totalCases, icon: Ticket, accent: 'bg-blue-50 text-blue-700' },
    { label: 'Open cases', value: stats.openCases, icon: BarChart3, accent: 'bg-indigo-50 text-indigo-700' },
    { label: 'Critical', value: stats.criticalCases, icon: AlertTriangle, accent: 'bg-red-50 text-red-700' },
    { label: 'SLA at risk', value: stats.slaAtRisk, icon: Clock3, accent: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">Internal operations</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">Agent dashboard</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Monitor queue health, prioritize escalations, and jump directly into the cases that need attention now.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-slate-500 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Loading dashboard...
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className={`inline-flex rounded-2xl p-3 ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Case queue</h2>
                <p className="mt-1 text-sm text-slate-500">Click a row to inspect full case details, AI summaries, and audit history.</p>
              </div>
              <button
                type="button"
                onClick={exportFilteredCases}
                aria-label="Export filtered cases as CSV"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                Export CSV
              </button>
            </div>

            <div className="grid gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-4 sm:grid-cols-3">
              {([
                ['status', 'Status', 'All statuses', [...new Set(cases.map((supportCase) => supportCase.status))].sort()],
                ['priority', 'Priority', 'All priorities', [...new Set(cases.map((supportCase) => supportCase.priority))].sort()],
                ['category', 'Category', 'All categories', [...new Set(cases.map((supportCase) => supportCase.category))].sort()],
              ] as const).map(([key, label, allLabel, filterOptions]) => (
                <label key={key} htmlFor={`case-filter-${key}`} className="text-sm font-medium text-slate-700">
                  {label}
                  <select
                    id={`case-filter-${key}`}
                    value={filters[key]}
                    onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}
                    className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    <option value="">{allLabel}</option>
                    {filterOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Subject</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Priority</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">SLA status</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredCases.length ? (
                    filteredCases.map((supportCase) => (
                      <tr
                        key={supportCase.id}
                        onClick={() => router.push(`/dashboard/cases/${supportCase.id}`)}
                        className="cursor-pointer transition hover:bg-primary-50/70"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-950">{supportCase.subject}</p>
                            <p className="mt-1 text-xs text-slate-500">#{supportCase.id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{supportCase.customerName || supportCase.customerEmail || 'Unknown'}</td>
                        <td className="px-6 py-4"><PriorityBadge priority={supportCase.priority} /></td>
                        <td className="px-6 py-4"><StatusBadge status={supportCase.status} /></td>
                        <td className="px-6 py-4 text-slate-600">{supportCase.category}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSlaClass(supportCase.slaStatus)}`}>
                            {titleCase(supportCase.slaStatus || 'Monitoring')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{formatDateTime(supportCase.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                        {cases.length ? 'No cases match the selected filters.' : 'No cases are currently available in the queue.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
