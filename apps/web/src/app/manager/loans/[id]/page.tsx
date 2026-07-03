'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/ui/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-provider';

interface LoanDetail {
  id: string;
  loanNumber: string;
  status: string;
  principalAmount: number;
  tenureMonths: number;
  monthlyPayment: number;
  totalRepayable: number;
  outstandingBalance: number;
  purpose?: string;
  collateral?: string;
  collateralType?: string;
  collateralEstimatedValue?: number;
  collateralPhotoUrl?: string;
  collateralVerifiedAt?: string | null;
  guarantorName?: string;
  guarantorPhone?: string;
  submittedAt?: string;
  approvedAt?: string;
  disbursedAt?: string;
  customer: { firstName: string; lastName: string; phone: string; customerNumber: string };
  product: { name: string; code: string; requiresCollateral?: boolean };
  schedules: { installmentNumber: number; dueDate: string; totalDue: number; isPaid: boolean }[];
}

export default function LoanDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: LoanDetail }>(`/manager/loans/${id}`);
      setLoan(res.data);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Failed to load loan', 'error');
      setLoan(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'review' | 'approve' | 'reject' | 'verify-collateral' | 'disburse') {
    setActionLoading(true);
    try {
      await api.post(`/manager/loans/${id}/${action}`, { comment: `${action} from loan detail` });
      showToast(`Loan ${action.replace('-', ' ')} successful`, 'success');
      await load();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!loan) {
    return (
      <DashboardLayout>
        <PageShell>
          <p className="text-gray-500">Loan not found.</p>
          <Link href="/manager/loans" className="text-brand-600 hover:underline">Back to loans</Link>
        </PageShell>
      </DashboardLayout>
    );
  }

  const needsCollateral = loan.product.requiresCollateral !== false;
  const collateralVerified = Boolean(loan.collateralVerifiedAt);
  const nextDue = loan.schedules?.find((s) => !s.isPaid);

  return (
    <DashboardLayout>
      <Header title={loan.loanNumber} subtitle={`${loan.customer.firstName} ${loan.customer.lastName} · ${loan.product.name}`} />
      <PageShell>
        <div className="mb-4 flex flex-wrap gap-3">
          <Link href="/manager/loans" className="text-sm text-brand-600 hover:underline">← All loans</Link>
          <Link href="/manager/approvals" className="text-sm text-brand-600 hover:underline">Approval queue</Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <StatusBadge status={loan.status} />
              <span className="text-2xl font-bold text-brand-700">{formatCurrency(Number(loan.principalAmount))}</span>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><dt className="text-gray-500">Customer</dt><dd>{loan.customer.firstName} {loan.customer.lastName}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd>{loan.customer.phone}</dd></div>
              <div><dt className="text-gray-500">Tenure</dt><dd>{loan.tenureMonths} months</dd></div>
              <div><dt className="text-gray-500">Monthly</dt><dd>{formatCurrency(Number(loan.monthlyPayment))}</dd></div>
              <div><dt className="text-gray-500">Outstanding</dt><dd>{formatCurrency(Number(loan.outstandingBalance))}</dd></div>
              {loan.purpose && <div className="sm:col-span-2"><dt className="text-gray-500">Purpose</dt><dd>{loan.purpose}</dd></div>}
              {nextDue && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Next repayment</dt>
                  <dd>{formatDate(nextDue.dueDate)} — {formatCurrency(Number(nextDue.totalDue))}</dd>
                </div>
              )}
            </dl>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 font-semibold">Actions</h2>
            <div className="flex flex-col gap-2">
              {loan.status === 'SUBMITTED' && (
                <Button variant="secondary" loading={actionLoading} onClick={() => handleAction('review')}>Mark under review</Button>
              )}
              {needsCollateral && !collateralVerified && (
                <Button variant="secondary" loading={actionLoading} onClick={() => handleAction('verify-collateral')}>Verify collateral</Button>
              )}
              {['SUBMITTED', 'UNDER_REVIEW'].includes(loan.status) && (
                <>
                  <Button loading={actionLoading} disabled={needsCollateral && !collateralVerified} onClick={() => handleAction('approve')}>Approve</Button>
                  <Button variant="danger" loading={actionLoading} onClick={() => handleAction('reject')}>Reject</Button>
                </>
              )}
              {loan.status === 'APPROVED' && (
                <Button loading={actionLoading} onClick={() => handleAction('disburse')}>Disburse loan</Button>
              )}
            </div>
          </Card>
        </div>
        {(loan.collateral || loan.guarantorName) && (
          <Card className="mt-6 p-6">
            <h2 className="mb-4 font-semibold">Collateral & guarantor</h2>
            <dl className="grid gap-2 sm:grid-cols-2 text-sm">
              {loan.collateralType && <div><dt className="text-gray-500">Type</dt><dd>{loan.collateralType}</dd></div>}
              {loan.collateralEstimatedValue != null && (
                <div><dt className="text-gray-500">Est. value</dt><dd>{formatCurrency(Number(loan.collateralEstimatedValue))}</dd></div>
              )}
              {loan.collateral && <div className="sm:col-span-2"><dt className="text-gray-500">Description</dt><dd>{loan.collateral}</dd></div>}
              {loan.guarantorName && <div><dt className="text-gray-500">Guarantor</dt><dd>{loan.guarantorName}</dd></div>}
              {loan.guarantorPhone && <div><dt className="text-gray-500">Guarantor phone</dt><dd>{loan.guarantorPhone}</dd></div>}
              <div><dt className="text-gray-500">Verified</dt><dd>{collateralVerified ? formatDate(loan.collateralVerifiedAt!) : 'Pending'}</dd></div>
            </dl>
          </Card>
        )}
      </PageShell>
    </DashboardLayout>
  );
}
