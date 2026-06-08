'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bot, Loader2, RefreshCcw, ShieldAlert, Sparkles, UserPlus2 } from 'lucide-react';
import { useParams } from 'next/navigation';

import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { normalizeSupportCase } from '@/lib/normalize';
import type { SupportCase } from '@/lib/types';
import { formatDateTime, getSlaCountdown } from '@/lib/utils';

const priorityOptions = ['Critical', 'High', 'Medium', 'Low'];
const statusOptions = ['New', 'Open', 'Pending', 'In Progress', 'Escalated', 'Resolved', 'Closed'];

export default function DashboardCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [caseData, setCaseData] = useState<SupportCase | null>(null);
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Open');
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!caseId) return;

    async function loadCase() {
      try {
        const response = await apiGet(`/api/cases/${caseId}/detail`);
        const nextCase = normalizeSupportCase(response);

        if (!nextCase) {
          throw new Error('Case details were not returned by the API.');
        }

        setCaseData(nextCase);
        setPriority(nextCase.priority);
        setStatus(nextCase.status);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this case.');
      } finally {
        setLoading(false);
      }
    }

    void loadCase();
  }, [caseId]);

  const slaCountdown = useMemo(() => getSlaCountdown(caseData?.slaDeadline), [caseData?.slaDeadline]);

  async function syncCase(update: Promise<unknown>, fallback: Partial<SupportCase>) {
    try {
      const response = await update;
      const nextCase = normalizeSupportCase(response);
      setCaseData((current) => (nextCase ? nextCase : current ? { ...current, ...fallback } : null));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update the case.');
    } finally {
      setBusyAction('');
    }
  }

  function handleAssignToMe() {
    if (!caseId) return;
    setError('');
    setBusyAction('assign');
    void syncCase(apiPost(`/api/cases/${caseId}/assign`, {}), { assignee: 'You' });
  }

  function handleEscalate() {
    if (!caseId) return;
    setError('');
    setBusyAction('escalate');
    void syncCase(apiPost(`/api/cases/${caseId}/escalate`, {}), { status: 'Escalated', priority: 'Critical' });
  }

  function handlePriorityUpdate() {
    if (!caseId) return;
    setError('');
    setBusyAction('priority');
    void syncCase(apiPut(`/api/cases/${caseId}/priority`, { priority }), { priority });
  }

  function handleStatusUpdate() {
    if (!caseId) return;
    setError('');
    setBusyAction('status');
    void syncCase(apiPut(`/api/cases/${caseId}/status`, { status }), { status });
  }

  function handleRefreshSummary() {
    if (!caseId) return;
    setError('');
    setBusyAction('summary');
    void syncCase(apiPost(`/api/cases/${caseId}/ai-summary`, {}), {});
  }

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex items-center justify-center rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-slate-500 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Loading case details...
        </div>
      ) : error && !caseData ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">{error}</div>
      ) : caseData ? (
        <>
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={caseData.status} />
                  <PriorityBadge priority={caseData.priority} />
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{caseData.category}</span>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Case #{caseData.id}</p>
                  <h1 className="mt-2 text-4xl font-semibold text-slate-950">{caseData.subject}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{caseData.description || 'No description provided.'}</p>
                </div>
                <div className="grid gap-4 rounded-[1.5rem] bg-slate-50 p-5 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">Customer</p>
                    <p className="mt-1 font-semibold text-slate-950">{caseData.customerName || caseData.customerEmail || 'On file'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Assignee</p>
                    <p className="mt-1 font-semibold text-slate-950">{caseData.assignee || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">SLA countdown</p>
                    <p className="mt-1 font-semibold text-slate-950">{slaCountdown}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 p-4 sm:grid-cols-2 xl:w-[24rem] xl:grid-cols-1">
                <button
                  type="button"
                  onClick={handleAssignToMe}
                  disabled={busyAction === 'assign'}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busyAction === 'assign' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus2 className="h-4 w-4" />}
                  Assign to me
                </button>
                <button
                  type="button"
                  onClick={handleEscalate}
                  disabled={busyAction === 'escalate'}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busyAction === 'escalate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                  Escalate
                </button>
                <div className="flex gap-2 sm:col-span-2 xl:col-span-1">
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="w-full rounded-full border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handlePriorityUpdate}
                    disabled={busyAction === 'priority'}
                    className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-200 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busyAction === 'priority' ? 'Saving...' : 'Change priority'}
                  </button>
                </div>
                <div className="flex gap-2 sm:col-span-2 xl:col-span-1">
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="w-full rounded-full border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleStatusUpdate}
                    disabled={busyAction === 'status'}
                    className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-200 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busyAction === 'status' ? 'Saving...' : 'Change status'}
                  </button>
                </div>
              </div>
            </div>
            {error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          </section>

          <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">AI insight</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">AI summary</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshSummary}
                    disabled={busyAction === 'summary'}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary-200 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busyAction === 'summary' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Refresh
                  </button>
                </div>
                <p className="mt-4 rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                  {caseData.aiSummary || 'No AI summary has been generated yet for this case.'}
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">Recommended workflow</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">Suggested next action</h2>
                  </div>
                </div>
                <p className="mt-4 rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                  {caseData.suggestedNextAction || 'Review recent customer comments, verify the latest change, and share an update with the customer.'}
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Comments timeline</h2>
                  <p className="mt-2 text-sm text-slate-600">Track both internal notes and customer-visible updates in chronological order.</p>
                </div>
                <div className="mt-6 space-y-4">
                  {caseData.comments.length ? (
                    caseData.comments.map((entry) => (
                      <div key={entry.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-950">{entry.author}</p>
                            <p className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              entry.visibility === 'internal'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {entry.visibility === 'internal' ? 'Internal' : 'Customer visible'}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{entry.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                      No comments have been recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">SLA watch</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">Countdown & milestones</h2>
                  </div>
                </div>
                <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Current SLA status</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{caseData.slaStatus || 'Monitoring'}</p>
                  <p className="mt-3 text-sm text-slate-600">Deadline: {formatDateTime(caseData.slaDeadline)}</p>
                  <p className="mt-2 text-sm font-semibold text-primary-700">{slaCountdown}</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-950">Audit history</h2>
                <p className="mt-2 text-sm text-slate-600">Expand each event to inspect workflow changes and system updates.</p>
                <div className="mt-6 space-y-3">
                  {caseData.auditHistory?.length ? (
                    caseData.auditHistory.map((entry) => (
                      <details key={entry.id} className="group rounded-[1.5rem] border border-slate-200 p-5">
                        <summary className="cursor-pointer list-none">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-950">{entry.action}</p>
                              <p className="text-xs text-slate-500">{entry.actor} • {formatDateTime(entry.createdAt)}</p>
                            </div>
                            <span className="text-sm font-medium text-primary-700 group-open:hidden">Show details</span>
                            <span className="hidden text-sm font-medium text-primary-700 group-open:inline">Hide details</span>
                          </div>
                        </summary>
                        <p className="mt-4 text-sm leading-6 text-slate-600">{entry.details || 'No additional audit details available.'}</p>
                      </details>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                      Audit history will appear here when changes are recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
