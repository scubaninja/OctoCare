import { describe, expect, it } from 'vitest';

import { buildKnowledgeBaseExportFilename, createKnowledgeArticleCsv } from './knowledge-base-export';
import type { KnowledgeArticle } from './types';

function makeArticle(overrides: Partial<KnowledgeArticle> = {}): KnowledgeArticle {
  return {
    id: 'article-1',
    title: 'Reset your password',
    category: 'Account',
    snippet: 'Steps to reset your password.',
    content: 'Full password reset instructions.',
    updatedAt: '2024-01-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('createKnowledgeArticleCsv', () => {
  it('serializes only the provided articles with the expected headers', () => {
    const csv = createKnowledgeArticleCsv([makeArticle()]);
    const lines = csv.split('\r\n');

    expect(lines[0]).toBe('ID,Title,Category,Snippet,Content,Updated At');
    expect(lines[1]).toBe(
      'article-1,Reset your password,Account,Steps to reset your password.,Full password reset instructions.,2024-01-15T00:00:00.000Z',
    );
    expect(lines).toHaveLength(2);
  });

  it('produces only a header row for an empty (fully filtered-out) list', () => {
    expect(createKnowledgeArticleCsv([])).toBe('ID,Title,Category,Snippet,Content,Updated At');
  });

  it('exports exactly the rows provided, in the same order, no more and no fewer', () => {
    const csv = createKnowledgeArticleCsv([
      makeArticle({ id: 'a', title: 'Article A' }),
      makeArticle({ id: 'b', title: 'Article B' }),
    ]);
    const lines = csv.split('\r\n');

    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('Article A');
    expect(lines[2]).toContain('Article B');
  });

  it('falls back to an empty string for a missing updatedAt', () => {
    const csv = createKnowledgeArticleCsv([makeArticle({ updatedAt: undefined })]);
    expect(csv.endsWith(',')).toBe(true);
  });

  it('escapes commas, quotes, and embedded newlines in article fields', () => {
    const csv = createKnowledgeArticleCsv([
      makeArticle({
        title: 'Say "hello", world',
        content: 'Line one\nLine two',
      }),
    ]);

    expect(csv).toContain('"Say ""hello"", world"');
    expect(csv).toContain('"Line one\nLine two"');
  });

  it('neutralizes formula-injection payloads in exported fields', () => {
    const csv = createKnowledgeArticleCsv([makeArticle({ title: '=SUM(A1:A9)' })]);
    expect(csv).toContain("'=SUM(A1:A9)");
  });
});

describe('buildKnowledgeBaseExportFilename', () => {
  it('returns a stable default filename with no active search', () => {
    expect(buildKnowledgeBaseExportFilename('')).toBe('knowledge-base-articles.csv');
    expect(buildKnowledgeBaseExportFilename('   ')).toBe('knowledge-base-articles.csv');
  });

  it('is deterministic: the same query always yields the same filename', () => {
    expect(buildKnowledgeBaseExportFilename('Password Reset')).toBe(
      buildKnowledgeBaseExportFilename('Password Reset'),
    );
  });

  it('embeds a lowercase, slugified version of the search query', () => {
    expect(buildKnowledgeBaseExportFilename('Password Reset')).toBe(
      'knowledge-base-articles-password-reset.csv',
    );
  });

  it('strips punctuation and collapses whitespace when slugifying', () => {
    expect(buildKnowledgeBaseExportFilename('  Wi-Fi & VPN!! ')).toBe(
      'knowledge-base-articles-wi-fi-vpn.csv',
    );
  });

  it('truncates very long queries to keep the filename reasonable', () => {
    const longQuery = 'a'.repeat(200);
    const filename = buildKnowledgeBaseExportFilename(longQuery);

    expect(filename.length).toBeLessThan(90);
    expect(filename.startsWith('knowledge-base-articles-a')).toBe(true);
    expect(filename.endsWith('.csv')).toBe(true);
  });
});
