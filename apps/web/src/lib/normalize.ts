import type {
  AuditEntry,
  CaseComment,
  DashboardStats,
  KnowledgeArticle,
  SupportCase,
} from '@/lib/types';

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' ? value : fallback;
}

function normalizeComment(value: unknown, index: number): CaseComment {
  const record = asRecord(value);

  return {
    id: getString(record?.id, `comment-${index}`),
    author: getString(record?.author, 'OctoCare Team'),
    message: getString(record?.message, ''),
    createdAt: getString(record?.createdAt, new Date().toISOString()),
    visibility: record?.visibility === 'internal' ? 'internal' : 'customer',
  };
}

function normalizeAuditEntry(value: unknown, index: number): AuditEntry {
  const record = asRecord(value);

  return {
    id: getString(record?.id, `audit-${index}`),
    actor: getString(record?.actor, 'System'),
    action: getString(record?.action, 'Updated case'),
    createdAt: getString(record?.createdAt, new Date().toISOString()),
    details: getString(record?.details),
  };
}

export function normalizeSupportCase(value: unknown): SupportCase | null {
  const wrapper = asRecord(value);
  const record = asRecord(wrapper?.case ?? value);
  if (!record) return null;

  const comments = Array.isArray(record.comments)
    ? record.comments.map((comment, index) => normalizeComment(comment, index))
    : [];
  const auditHistory = Array.isArray(record.auditHistory)
    ? record.auditHistory.map((entry, index) => normalizeAuditEntry(entry, index))
    : [];

  return {
    id: getString(record.id),
    subject: getString(record.subject, 'Untitled case'),
    description: getString(record.description),
    customerName: getString(record.customerName),
    customerEmail: getString(record.customerEmail),
    status: getString(record.status, 'Open'),
    priority: getString(record.priority, 'Medium'),
    category: getString(record.category, 'General'),
    createdAt: getString(record.createdAt, new Date().toISOString()),
    updatedAt: getString(record.updatedAt, getString(record.createdAt, new Date().toISOString())),
    slaDeadline: getString(record.slaDeadline),
    slaStatus: getString(record.slaStatus),
    comments,
    aiSummary: getString(record.aiSummary),
    suggestedNextAction: getString(record.suggestedNextAction),
    auditHistory,
    assignee: getString(record.assignee),
  };
}

export function normalizeSupportCases(value: unknown): SupportCase[] {
  const record = asRecord(value);
  const list = Array.isArray(record?.cases) ? record.cases : Array.isArray(value) ? value : [];

  return list
    .map((item) => normalizeSupportCase(item))
    .filter((item): item is SupportCase => Boolean(item));
}

export function normalizeKnowledgeArticles(value: unknown): KnowledgeArticle[] {
  const record = asRecord(value);
  const list = Array.isArray(record?.articles) ? record.articles : Array.isArray(value) ? value : [];
  const mapped: Array<KnowledgeArticle | null> = list.map((item, index) => {
    const article = asRecord(item);
    if (!article) return null;

    return {
      id: getString(article.id, `article-${index}`),
      title: getString(article.title, 'Untitled article'),
      category: getString(article.category, 'General'),
      snippet: getString(article.snippet, getString(article.content).slice(0, 140)),
      content: getString(article.content, 'No article content available yet.'),
      updatedAt: getString(article.updatedAt),
    };
  });

  return mapped.filter((item): item is KnowledgeArticle => item !== null);
}

export function normalizeDashboardStats(value: unknown): DashboardStats {
  const record = asRecord(value);
  const stats = asRecord(record?.stats ?? value);

  return {
    totalCases: getNumber(stats?.totalCases),
    openCases: getNumber(stats?.openCases),
    criticalCases: getNumber(stats?.criticalCases),
    slaAtRisk: getNumber(stats?.slaAtRisk),
  };
}
