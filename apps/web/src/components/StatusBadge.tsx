import { titleCase } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  new: 'bg-sky-100 text-sky-800',
  open: 'bg-blue-100 text-blue-800',
  pending: 'bg-amber-100 text-amber-800',
  'in progress': 'bg-indigo-100 text-indigo-800',
  escalated: 'bg-rose-100 text-rose-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-200 text-slate-700',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const className = statusStyles[normalized] ?? 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {titleCase(status)}
    </span>
  );
}
