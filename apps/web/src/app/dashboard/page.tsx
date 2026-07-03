'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle,
  Scale,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { MetricTile } from '@/components/ui/metric-tile';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/ui/page-shell';
import { ActionBanner } from '@/components/ui/action-banner';
import { SectionHeading } from '@/components/ui/section-heading';
import { api, DashboardMetrics } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@tanjuriel/shared';

interface TrendPoint {
  date: string;
  deposits: number;
  withdrawals: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, trendsRes] = await Promise.all([
          api.get<{ success: boolean; data: DashboardMetrics }>('/reporting/dashboard'),
          api.get<{ success: boolean; data: TrendPoint[] }>('/reporting/trends?days=14'),
        ]);
        setMetrics(dashRes.data);
        setTrends(trendsRes.data);
      } catch {
        // empty state shown below
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const pendingOps =
    (metrics?.pendingDeposits ?? 0) +
    (metrics?.pendingWithdrawals ?? 0) +
    (metrics?.pendingTransfers ?? 0);

  return (
    <DashboardLayout>
      <Header
        showDate
        title={`${greeting()}, ${user?.firstName}`}
        subtitle="Operational overview"
      />

      <PageShell>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : (
          <>
            {isManager && (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {pendingOps > 0 && (
                  <ActionBanner
                    icon={ClipboardList}
                    title="Operations queue"
                    description="Deposits, withdrawals, and transfers awaiting your approval"
                    href="/manager/operations"
                    count={pendingOps}
                    variant="warning"
                  />
                )}
                {(metrics?.pendingApprovals || 0) > 0 && (
                  <ActionBanner
                    icon={CheckCircle}
                    title="Loan approvals"
                    description="Loan applications waiting for review or decision"
                    href="/manager/approvals"
                    count={metrics?.pendingApprovals}
                    variant="info"
                  />
                )}
                {pendingOps === 0 && !metrics?.pendingApprovals && (
                  <ActionBanner
                    icon={Scale}
                    title="Reconciliation"
                    description="Compare customer ledger balances with settlement bank accounts"
                    href="/manager/reconciliation"
                    variant="info"
                  />
                )}
              </div>
            )}

            <section>
              <SectionHeading title="Today's activity" description="Branch transaction volume" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricTile label="Deposits today" value={formatCurrency(metrics?.totalDepositsToday || 0)} />
                <MetricTile label="Withdrawals today" value={formatCurrency(metrics?.totalWithdrawalsToday || 0)} />
                <MetricTile label="Active accounts" value={formatNumber(metrics?.activeAccounts || 0)} />
                <MetricTile label="Total customers" value={formatNumber(metrics?.totalCustomers || 0)} />
              </div>
            </section>

            {isManager && (
              <section>
                <SectionHeading title="Credit portfolio" description="Loan book health and risk" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricTile label="Active loans" value={formatNumber(metrics?.activeLoans || 0)} />
                  <MetricTile label="Overdue loans" value={formatNumber(metrics?.overdueLoans || 0)} />
                  <MetricTile label="Portfolio at risk" value={formatPercent(metrics?.portfolioAtRisk || 0)} />
                  <MetricTile label="Total portfolio" value={formatCurrency(metrics?.totalPortfolio || 0)} />
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card title="Transaction trends" subtitle="Deposits vs withdrawals — last 14 days" className="xl:col-span-2">
                <div className="h-80">
                  {trends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trends} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="depositGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2d8647" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#2d8647" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="withdrawGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f0" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={56} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                        <Legend />
                        <Area type="monotone" dataKey="deposits" stroke="#2d8647" fill="url(#depositGrad)" strokeWidth={2} name="Deposits" />
                        <Area type="monotone" dataKey="withdrawals" stroke="#f97316" fill="url(#withdrawGrad)" strokeWidth={2} name="Withdrawals" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      No transaction data yet
                    </div>
                  )}
                </div>
              </Card>

              {isManager && (
                <Card title="Quick links" subtitle="Common manager tasks">
                  <div className="space-y-2">
                    {[
                      { href: '/manager/operations', label: 'Operations queue', desc: 'Approve pending transactions' },
                      { href: '/manager/reconciliation', label: 'Reconciliation', desc: 'Ledger vs bank balances' },
                      { href: '/manager/approvals', label: 'Loan approvals', desc: 'Review loan applications' },
                      { href: '/reports', label: 'Reports', desc: 'Generate financial summaries' },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block rounded-lg border border-gray-100 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/50"
                      >
                        <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                        <p className="text-xs text-gray-500">{link.desc}</p>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </PageShell>
    </DashboardLayout>
  );
}
