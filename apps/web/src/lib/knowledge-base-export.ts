/**
 * Knowledge-base-specific CSV export helpers. Builds on the generic
 * serialization primitives in `@/lib/csv` so the column/filename policy for
 * this screen can be unit tested independently of the DOM-touching
 * download step.
 */

import { toCsv, type CsvColumn } from '@/lib/csv';
import type { KnowledgeArticle } from '@/lib/types';

const KNOWLEDGE_ARTICLE_CSV_COLUMNS: Array<CsvColumn<KnowledgeArticle>> = [
  { header: 'ID', getValue: (article) => article.id },
  { header: 'Title', getValue: (article) => article.title },
  { header: 'Category', getValue: (article) => article.category },
  { header: 'Snippet', getValue: (article) => article.snippet },
  { header: 'Content', getValue: (article) => article.content },
  { header: 'Updated At', getValue: (article) => article.updatedAt ?? '' },
];

/**
 * Serializes exactly the articles passed in (e.g. the caller's current
 * filtered/displayed list) into CSV text. Does not perform any filtering
 * itself — the caller is the single source of truth for which rows are
 * "currently displayed" and therefore exportable.
 */
export function createKnowledgeArticleCsv(articles: KnowledgeArticle[]): string {
  return toCsv(articles, KNOWLEDGE_ARTICLE_CSV_COLUMNS);
}

const MAX_FILENAME_SLUG_LENGTH = 60;

/**
 * Builds a deterministic, meaningful export filename derived only from the
 * active search query (no wall-clock timestamp), so the same filter always
 * produces the same filename and the behavior is reliable to unit test.
 */
export function buildKnowledgeBaseExportFilename(searchQuery: string): string {
  const trimmed = searchQuery.trim().toLowerCase();
  if (!trimmed) return 'knowledge-base-articles.csv';

  const slug = trimmed
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_FILENAME_SLUG_LENGTH);

  return slug ? `knowledge-base-articles-${slug}.csv` : 'knowledge-base-articles.csv';
}
