import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  SUBMITTED: 'bg-blue-50 text-blue-800 ring-blue-200',
  UNDER_REVIEW: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-800 ring-red-200',
  DISBURSED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  ACTIVE: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  OVERDUE: 'bg-red-50 text-red-800 ring-red-200',
  DEPOSIT: 'bg-green-50 text-green-800 ring-green-200',
  WITHDRAWAL: 'bg-orange-50 text-orange-800 ring-orange-200',
  TRANSFER: 'bg-violet-50 text-violet-800 ring-violet-200',
  CREATE: 'bg-blue-50 text-blue-800 ring-blue-200',
  LOGIN: 'bg-gray-50 text-gray-700 ring-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: 'Under review',
  SUBMITTED: 'Submitted',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] || status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  const style = STATUS_STYLES[status] || 'bg-gray-50 text-gray-700 ring-gray-200';

  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', style, className)}>
      {label}
    </span>
  );
}
