'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NotificationsDrawer } from './notifications-drawer';
import { api, DashboardMetrics } from '@/lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  /** Show date under title — use on dashboard only */
  showDate?: boolean;
}

function getPendingCount(m: DashboardMetrics | undefined): number {
  if (!m) return 0;
  const ops = (m.pendingDeposits ?? 0) + (m.pendingWithdrawals ?? 0) + (m.pendingTransfers ?? 0);
  const loans = m.pendingApprovals ?? 0;
  return ops + loans;
}

export function Header({ title, subtitle, showDate }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const today = new Intl.DateTimeFormat('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const isStaff = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!isStaff) return;
    api
      .get<{ success: boolean; data: DashboardMetrics }>('/reporting/dashboard')
      .then((res) => setPendingCount(getPendingCount(res.data)))
      .catch(() => setPendingCount(0));
  }, [isStaff]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    router.push(`/teller/customers?search=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-8">
          <div className="flex min-h-[3.5rem] items-center justify-between gap-4 py-3">
            {/* Page identity */}
            <div className="min-w-0 flex-1">
              {showDate && (
                <p className="mb-0.5 text-xs text-gray-400">{today}</p>
              )}
              <h1 className="truncate font-display text-lg font-semibold tracking-tight text-gray-900">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 truncate text-sm text-gray-500">{subtitle}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <form onSubmit={handleSearch} className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers"
                  aria-label="Search customers"
                  className="h-9 w-44 rounded-lg border border-gray-200 bg-gray-50 py-0 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 lg:w-52"
                />
              </form>

              {isStaff && (
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(true)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label={pendingCount > 0 ? `${pendingCount} notifications` : 'Notifications'}
                >
                  <Bell className="h-4 w-4" />
                  {pendingCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold leading-none text-white">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
              )}

              {user?.branch && (
                <div
                  className="hidden h-9 max-w-[11rem] items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 lg:flex"
                  title={user.branch.name}
                >
                  <span className="truncate text-xs font-medium text-gray-700">{user.branch.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isStaff && (
        <NotificationsDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      )}
    </>
  );
}
