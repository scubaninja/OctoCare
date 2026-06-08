'use client';

import { FormEvent, useState } from 'react';
import { Loader2, MessageSquarePlus, Search } from 'lucide-react';

import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { apiPost } from '@/lib/api';
import { normalizeSupportCase } from '@/lib/normalize';
import type { SupportCase } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function TrackCasePage() {
  const [query, setQuery] = useState('');
  const [caseData, setCaseData] = useState<SupportCase | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiPost('/api/cases/track', { query });
      const nextCase = normalizeSupportCase(response);

      if (!nextCase) {
        throw new Error('No case was found for that ID or email.');
      }

      setCaseData(nextCase);
    } catch (lookupError) {
      setCaseData(null);
      setError(lookupError instanceof Error ? lookupError.message : 'Unable to find that support case.');
    } finally {
      setLoading(false);
    }
  }

  async function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!caseData || !comment.trim()) return;

    setError('');
    setCommentLoading(true);

    try {
      const response = await apiPost(`/api/cases/${caseData.id}/comments`, { message: comment.trim() });
      const refreshedCase = normalizeSupportCase(response);

      setCaseData(
        refreshedCase ?? {
          ...caseData,
          comments: [
            ...caseData.comments,
            {
              id: `comment-${Date.now()}`,
              author: 'You',
              message: comment.trim(),
              createdAt: new Date().toISOString(),
              visibility: 'customer',
            },
          ],
          updatedAt: new Date().toISOString(),
        },
      );
      setComment('');
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Unable to add your comment.');
    } finally {
      setCommentLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">Case tracking</p>
          <h1 className="text-4xl font-semibold text-slate-950">Track your support case</h1>
          <p className="text-sm leading-6 text-slate-600">
            Enter your case ID or email to check the latest status, review updates, and add follow-up details for our support team.
          </p>
        </div>

        <form onSubmit={handleLookup} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter case ID or email address"
              className="w-full rounded-full border border-slate-200 py-3 pl-11 pr-4 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? 'Looking up...' : 'Find case'}
          </button>
        </form>

        {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      </section>

      {caseData ? (
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={caseData.status} />
                <PriorityBadge priority={caseData.priority} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Case #{caseData.id}</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">{caseData.subject}</h2>
              </div>
              {caseData.description ? <p className="text-sm leading-6 text-slate-600">{caseData.description}</p> : null}
            </div>

            <dl className="grid gap-4 rounded-[1.5rem] bg-slate-50 p-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Category</dt>
                <dd className="mt-1 font-semibold text-slate-950">{caseData.category}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Created</dt>
                <dd className="mt-1 font-semibold text-slate-950">{formatDate(caseData.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Last update</dt>
                <dd className="mt-1 font-semibold text-slate-950">{formatDateTime(caseData.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Customer</dt>
                <dd className="mt-1 font-semibold text-slate-950">{caseData.customerEmail || caseData.customerName || 'On file'}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Conversation timeline</h2>
              <p className="mt-2 text-sm text-slate-600">Review the latest updates from OctoCare and add more context for the team.</p>
            </div>

            <div className="space-y-4">
              {caseData.comments.length ? (
                caseData.comments.map((entry) => (
                  <div key={entry.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{entry.author}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {entry.visibility === 'internal' ? 'Internal note' : 'Customer update'}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{entry.message}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                  No comments yet. Add a follow-up note to help the support team.
                </div>
              )}
            </div>

            <form onSubmit={handleComment} className="rounded-[1.5rem] bg-slate-50 p-5">
              <label htmlFor="comment" className="text-sm font-medium text-slate-700">
                Add a new comment
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="mt-3 w-full rounded-3xl border border-slate-200 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                placeholder="Share extra details, files uploaded, or what changed since the case was created."
              />
              <button
                type="submit"
                disabled={commentLoading || !comment.trim()}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {commentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
                {commentLoading ? 'Posting comment...' : 'Add comment'}
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
