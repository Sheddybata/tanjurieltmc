'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { accountOfficerLabel } from '@/lib/account-officers';
import { useAuth } from '@/lib/auth-context';

interface Summary {
  customerCount: number;
  activeLoans: number;
  overdueInstallments: number;
  dueThisWeekInstallments: number;
}

export default function AccountOfficerDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ success: boolean; data: Summary }>('/account-officer/summary')
      .then((res) => setSummary(res.data))
      .catch((err: unknown) => {
        setError((err as { message?: string })?.message || 'Could not load portfolio summary');
      });
  }, []);

  const officerName = user?.accountOfficer
    ? accountOfficerLabel(user.accountOfficer)
    : `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  return (
    <DashboardLayout>
      <Header
        title="Portfolio overview"
        subtitle={officerName ? `Account officer: ${officerName}` : 'Your assigned members'}
      />
      <div className="space-y-6 p-8">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5">
            <p className="text-sm text-gray-500">My customers</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{summary?.customerCount ?? '—'}</p>
            <Link href="/account-officer/customers" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
              View list
            </Link>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-500">Active loans</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{summary?.activeLoans ?? '—'}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-500">Overdue installments</p>
            <p className="mt-2 text-3xl font-semibold text-red-600">{summary?.overdueInstallments ?? '—'}</p>
            <Link href="/account-officer/loan-follow-up?filter=overdue" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
              Follow up
            </Link>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-500">Due in 7 days</p>
            <p className="mt-2 text-3xl font-semibold text-amber-700">{summary?.dueThisWeekInstallments ?? '—'}</p>
            <Link href="/account-officer/loan-follow-up?filter=week" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
              View schedule
            </Link>
          </Card>
        </div>
        <Card className="p-6 text-sm text-gray-600">
          This portal is read-only: use it to see your members and when loan payments are due. Tellers and managers
          handle deposits, withdrawals, and approvals at the branch.
        </Card>
      </div>
    </DashboardLayout>
  );
}
