'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpenText, Download, Loader2, Search } from 'lucide-react';

import { apiGet } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { buildKnowledgeBaseExportFilename, createKnowledgeArticleCsv } from '@/lib/knowledge-base-export';
import { normalizeKnowledgeArticles } from '@/lib/normalize';
import type { KnowledgeArticle } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportStatus, setExportStatus] = useState('');

  useEffect(() => {
    async function loadArticles() {
      try {
        const response = await apiGet('/api/knowledge-base/articles');
        const nextArticles = normalizeKnowledgeArticles(response);
        setArticles(nextArticles);
        setSelectedArticleId((current) => current || nextArticles[0]?.id || '');
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load articles right now.');
      } finally {
        setLoading(false);
      }
    }

    void loadArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return articles;

    return articles.filter((article) =>
      [article.title, article.category, article.snippet, article.content].some((field) => field.toLowerCase().includes(query)),
    );
  }, [articles, search]);

  const selectedArticle = filteredArticles.find((article) => article.id === selectedArticleId) ?? filteredArticles[0] ?? null;

  const exportDisabled = loading || Boolean(error) || filteredArticles.length === 0;

  function handleExport() {
    if (exportDisabled) return;

    const filename = buildKnowledgeBaseExportFilename(search);
    const csvContent = createKnowledgeArticleCsv(filteredArticles);
    downloadCsv(filename, csvContent);

    const count = filteredArticles.length;
    setExportStatus(`Exported ${count} article${count === 1 ? '' : 's'} as ${filename}.`);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">Self-service knowledge</p>
          <h1 className="text-4xl font-semibold text-slate-950">Knowledge base</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Search how-to articles, troubleshooting content, and best practices. Results update instantly as you type.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label htmlFor="knowledge-base-search" className="sr-only">
              Search knowledge base articles
            </label>
            <input
              id="knowledge-base-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by keyword, topic, or category"
              className="w-full rounded-full border border-slate-200 py-3 pl-11 pr-4 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportDisabled}
            aria-describedby="knowledge-base-export-hint"
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-700 sm:w-auto"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
        </div>
        <p id="knowledge-base-export-hint" className="sr-only">
          Exports the articles currently displayed below, including any active search filter, as a CSV file.
        </p>
        <p role="status" aria-live="polite" className="sr-only">
          {exportStatus}
        </p>
      </section>

      {loading ? (
        <div className="flex items-center justify-center rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-slate-500 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Loading articles...
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">{error}</div>
      ) : (
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4 self-start">
            {filteredArticles.length ? (
              filteredArticles.map((article) => {
                const active = selectedArticle?.id === article.id;
                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => setSelectedArticleId(article.id)}
                    className={`rounded-[1.5rem] border p-5 text-left transition ${
                      active
                        ? 'border-primary-200 bg-primary-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-primary-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                        <BookOpenText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">{article.category}</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-950">{article.title}</h2>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{article.snippet}</p>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
                No articles matched your search.
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            {selectedArticle ? (
              <article className="space-y-5">
                <div className="space-y-2 border-b border-slate-100 pb-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">{selectedArticle.category}</p>
                  <h2 className="text-3xl font-semibold text-slate-950">{selectedArticle.title}</h2>
                  <p className="text-sm text-slate-500">Updated {formatDate(selectedArticle.updatedAt)}</p>
                </div>
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{selectedArticle.content}</p>
              </article>
            ) : (
              <div className="rounded-[1.5rem] bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                Select an article to view the full content.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
