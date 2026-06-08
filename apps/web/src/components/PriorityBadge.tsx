import { titleCase } from '@/lib/utils';

const priorityStyles: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 ring-red-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  low: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const normalized = priority.toLowerCase();
  const className = priorityStyles[normalized] ?? 'bg-slate-100 text-slate-700 ring-slate-200';

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${className}`}>
      {titleCase(priority)}
    </span>
  );
}
