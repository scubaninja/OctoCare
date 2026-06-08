export type CaseStatus =
  | 'New'
  | 'Open'
  | 'Pending'
  | 'In Progress'
  | 'Resolved'
  | 'Closed'
  | 'Escalated';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface CaseComment {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  visibility: 'internal' | 'customer';
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  createdAt: string;
  details?: string;
}

export interface SupportCase {
  id: string;
  subject: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  status: CaseStatus | string;
  priority: PriorityLevel | string;
  category: string;
  createdAt: string;
  updatedAt: string;
  slaDeadline?: string;
  slaStatus?: string;
  comments: CaseComment[];
  aiSummary?: string;
  suggestedNextAction?: string;
  auditHistory?: AuditEntry[];
  assignee?: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  snippet: string;
  content: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalCases: number;
  openCases: number;
  criticalCases: number;
  slaAtRisk: number;
}
