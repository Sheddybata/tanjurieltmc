import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SplitQueueLayoutProps {
  listHeader?: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  empty?: ReactNode;
  isEmpty?: boolean;
  className?: string;
}

export function SplitQueueLayout({
  listHeader,
  list,
  detail,
  empty,
  isEmpty,
  className,
}: SplitQueueLayoutProps) {
  if (isEmpty && empty) {
    return <div className={className}>{empty}</div>;
  }

  return (
    <div className={cn('split-queue', className)}>
      <div className="split-queue-list">
        {listHeader && <div className="border-b border-gray-100 p-4">{listHeader}</div>}
        <div className="split-queue-list-scroll">{list}</div>
      </div>
      <div className="split-queue-detail">{detail}</div>
    </div>
  );
}

interface QueueListItemProps {
  selected?: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  amount?: string;
  badges?: ReactNode;
  meta?: string;
}

export function QueueListItem({
  selected,
  onClick,
  title,
  subtitle,
  amount,
  badges,
  meta,
}: QueueListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full border-b border-gray-50 px-4 py-3.5 text-left transition',
        selected ? 'bg-brand-50 ring-1 ring-inset ring-brand-200' : 'hover:bg-gray-50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {badges && <div className="mb-1.5 flex flex-wrap gap-1.5">{badges}</div>}
          <p className="truncate font-medium text-gray-900">{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>}
          {meta && <p className="mt-1 text-xs text-gray-400">{meta}</p>}
        </div>
        {amount && <p className="shrink-0 font-display text-sm font-bold text-brand-700">{amount}</p>}
      </div>
    </button>
  );
}

interface DetailPanelProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
}

export function DetailPanel({ title, children, actions, empty, emptyMessage }: DetailPanelProps) {
  if (empty) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-gray-400">{emptyMessage || 'Select an item from the queue'}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="font-display text-base font-semibold text-gray-900">{title}</h3>
        {actions}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
    </div>
  );
}

export function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="py-2.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
