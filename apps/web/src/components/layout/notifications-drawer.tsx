'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, X, ClipboardList, CheckCircle } from 'lucide-react';
import { api, DashboardMetrics } from '@/lib/api';
import { cn } from '@/lib/utils';

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsDrawer({ open, onClose }: NotificationsDrawerProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    if (!open) return;
    api
      .get<{ success: boolean; data: DashboardMetrics }>('/reporting/dashboard')
      .then((res) => setMetrics(res.data))
      .catch(() => setMetrics(null));
  }, [open]);

  const pendingOps =
    (metrics?.pendingDeposits ?? 0) +
    (metrics?.pendingWithdrawals ?? 0) +
    (metrics?.pendingTransfers ?? 0);

  const items = [
    pendingOps > 0 && {
      href: '/manager/operations',
      icon: ClipboardList,
      title: 'Operations queue',
      desc: `${pendingOps} transaction${pendingOps === 1 ? '' : 's'} awaiting approval`,
      variant: 'warning' as const,
    },
    (metrics?.pendingApprovals || 0) > 0 && {
      href: '/manager/approvals',
      icon: CheckCircle,
      title: 'Loan approvals',
      desc: `${metrics?.pendingApprovals} loan application${metrics?.pendingApprovals === 1 ? '' : 's'} pending`,
      variant: 'info' as const,
    },
  ].filter(Boolean) as Array<{
    href: string;
    icon: typeof ClipboardList;
    title: string;
    desc: string;
    variant: 'warning' | 'info';
  }>;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-elevated">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-500" />
            <h2 className="font-display font-semibold text-gray-900">Notifications</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
              <p className="text-sm font-medium text-gray-600">All caught up</p>
              <p className="mt-1 text-xs text-gray-400">No pending items need your attention</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex gap-3 rounded-xl border p-4 transition hover:shadow-card',
                    item.variant === 'warning' ? 'border-amber-200 bg-amber-50/50' : 'border-brand-200 bg-brand-50/50',
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0', item.variant === 'warning' ? 'text-amber-600' : 'text-brand-600')} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
