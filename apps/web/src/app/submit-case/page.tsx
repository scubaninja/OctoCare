'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

import { apiPost } from '@/lib/api';

const categories = ['Billing', 'Technical', 'Shipping', 'Account', 'Product Feedback', 'General'] as const;

type Category = (typeof categories)[number];

interface CaseFormState {
  subject: string;
  description: string;
  category: Category;
}

const initialState: CaseFormState = {
  subject: '',
  description: '',
  category: 'Technical',
};

export default function SubmitCasePage() {
  const [form, setForm] = useState<CaseFormState>(initialState);
  const [caseId, setCaseId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setCaseId('');
    setLoading(true);

    try {
      const response = await apiPost('/api/cases', form);
      const createdId =
        (typeof response?.caseId === 'string' && response.caseId) ||
        (typeof response?.id === 'string' && response.id) ||
        (typeof response?.case === 'object' && response.case && 'id' in response.case && typeof response.case.id === 'string'
          ? response.case.id
          : 'pending-assignment');

      setCaseId(createdId);
      setForm(initialState);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit your support case right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-200">Customer intake</p>
        <h1 className="mt-4 text-4xl font-semibold">Submit a support case</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Share the details of your issue and our support team will route it to the right specialists. Provide enough context so we can resolve your request faster.
        </p>
        <div className="mt-8 space-y-4 rounded-[1.5rem] border border-white/10 bg-white/10 p-6">
          <h2 className="text-lg font-semibold">What happens next?</h2>
          <ul className="space-y-3 text-sm text-slate-200">
            <li>• Your case is routed based on category and urgency.</li>
            <li>• Agents review the submission and respond with updates.</li>
            <li>• You can track progress or add comments from the case portal.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium text-slate-700">
              Subject
            </label>
            <input
              id="subject"
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Summarize the issue you're experiencing"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as Category }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              rows={8}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe the problem, expected behavior, and any recent changes that may have caused it."
              className="w-full rounded-3xl border border-slate-200 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? 'Submitting case...' : 'Submit case'}
          </button>
        </form>

        {caseId ? (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Case submitted successfully</p>
                <p className="mt-1 text-sm">Your case ID is <span className="font-semibold">{caseId}</span>. Save it to track updates and add comments later.</p>
              </div>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      </section>
    </div>
  );
}
