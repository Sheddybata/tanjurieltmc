'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import {
  SplitQueueLayout,
  QueueListItem,
  DetailPanel,
  DetailField,
} from '@/components/ui/split-queue-layout';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface LoanProduct {
  name: string;
  code: string;
  requiresCollateral?: boolean;
}

interface Loan {
  id: string;
  loanNumber: string;
  status: string;
  principalAmount: number;
  purpose?: string;
  collateral?: string;
  collateralType?: string;
  collateralEstimatedValue?: number;
  collateralPhotoUrl?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  collateralVerifiedAt?: string | null;
  customer: { firstName: string; lastName: string };
  product: LoanProduct;
  submittedAt: string;
}

const COLLATERAL_LABELS: Record<string, string> = {
  PROPERTY: 'Property',
  VEHICLE: 'Vehicle',
  EQUIPMENT: 'Equipment',
  GUARANTOR: 'Guarantor',
  CASH: 'Cash / fixed deposit',
  OTHER: 'Other',
};

export default function ApprovalsPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  async function loadPending() {
    setLoading(true);
    try {
      const [submitted, review] = await Promise.all([
        api.get<{ success: boolean; data: Loan[] }>('/manager/loans?status=SUBMITTED'),
        api.get<{ success: boolean; data: Loan[] }>('/manager/loans?status=UNDER_REVIEW'),
      ]);
      const list = [...(submitted.data || []), ...(review.data || [])];
      setLoans(list);
      setSelectedId((prev) => (prev && list.some((l) => l.id === prev) ? prev : list[0]?.id ?? null));
    } catch {
      setLoans([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  const selected = loans.find((l) => l.id === selectedId) ?? null;
  const requiresCollateral = selected?.product?.requiresCollateral !== false;
  const collateralVerified = Boolean(selected?.collateralVerifiedAt);

  async function handleAction(loanId: string, action: 'review' | 'approve' | 'reject' | 'verify-collateral') {
    setActionLoading(loanId);
    try {
      await api.post(`/manager/loans/${loanId}/${action}`, { comment: `${action} via approval queue` });
      await loadPending();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <DashboardLayout>
      <Header title="Loan Approvals" subtitle="Select an application to review and make a decision" />
      <PageShell wide>
        <SectionHeading
          title="Awaiting decision"
          description={`${loans.length} application${loans.length === 1 ? '' : 's'} need manager action`}
        />

        {loading ? (
          <div className="flex h-96 items-center justify-center rounded-xl border border-gray-200 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          </div>
        ) : (
          <SplitQueueLayout
            isEmpty={loans.length === 0}
            empty={
              <EmptyState
                icon={CheckCircle}
                title="All caught up"
                description="There are no loan applications waiting for review or approval."
              />
            }
            listHeader={<p className="text-xs font-medium text-gray-500">{loans.length} pending</p>}
            list={loans.map((loan) => (
              <QueueListItem
                key={loan.id}
                selected={loan.id === selectedId}
                onClick={() => setSelectedId(loan.id)}
                title={`${loan.customer.firstName} ${loan.customer.lastName}`}
                subtitle={loan.product.name}
                amount={formatCurrency(Number(loan.principalAmount))}
                meta={loan.submittedAt ? formatDate(loan.submittedAt) : undefined}
                badges={
                  <>
                    <StatusBadge status={loan.status} />
                    {loan.product.requiresCollateral !== false && !loan.collateralVerifiedAt && (
                      <span className="badge-warning text-[10px]">Collateral</span>
                    )}
                  </>
                }
              />
            ))}
            detail={
              <DetailPanel
                title={selected ? selected.loanNumber : 'Application details'}
                empty={!selected}
                emptyMessage="Select a loan application from the queue"
              >
                {selected && (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-gray-100 bg-white p-5">
                      <StatusBadge status={selected.status} />
                      <p className="mt-3 font-display text-3xl font-bold text-brand-700">
                        {formatCurrency(Number(selected.principalAmount))}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {selected.customer.firstName} {selected.customer.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{selected.product.name}</p>
                    </div>

                    <div className="grid gap-1 sm:grid-cols-2">
                      <DetailField label="Loan number" value={<span className="font-mono text-xs">{selected.loanNumber}</span>} />
                      <DetailField label="Submitted" value={selected.submittedAt ? formatDate(selected.submittedAt) : '—'} />
                      <DetailField label="Product" value={selected.product.name} />
                      <DetailField label="Principal" value={formatCurrency(Number(selected.principalAmount))} />
                      {selected.purpose && (
                        <div className="sm:col-span-2">
                          <DetailField label="Purpose" value={selected.purpose} />
                        </div>
                      )}
                    </div>

                    {requiresCollateral && (
                      <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Collateral</p>
                          {collateralVerified ? (
                            <span className="badge-success flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="badge-warning">Awaiting verification</span>
                          )}
                        </div>
                        <div className="grid gap-1 sm:grid-cols-2">
                          <DetailField
                            label="Type"
                            value={COLLATERAL_LABELS[selected.collateralType || ''] || selected.collateralType || '—'}
                          />
                          <DetailField
                            label="Est. value"
                            value={
                              selected.collateralEstimatedValue != null
                                ? formatCurrency(Number(selected.collateralEstimatedValue))
                                : '—'
                            }
                          />
                          <div className="sm:col-span-2">
                            <DetailField label="Description" value={selected.collateral || '—'} />
                          </div>
                        </div>
                        {(selected.guarantorName || selected.guarantorPhone) && (
                          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Guarantor</p>
                            <div className="grid gap-1 sm:grid-cols-2">
                              <DetailField label="Name" value={selected.guarantorName || '—'} />
                              <DetailField label="Phone" value={selected.guarantorPhone || '—'} />
                            </div>
                          </div>
                        )}
                        {selected.collateralPhotoUrl && (
                          <div className="mt-4">
                            <p className="mb-2 text-xs font-medium text-gray-500">Photo evidence</p>
                            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                              {selected.collateralPhotoUrl.startsWith('http') || selected.collateralPhotoUrl.startsWith('/uploads') ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={selected.collateralPhotoUrl}
                                  alt="Collateral"
                                  className="max-h-full max-w-full rounded-lg object-contain"
                                />
                              ) : (
                                <span className="font-mono text-xs">{selected.collateralPhotoUrl}</span>
                              )}
                            </div>
                          </div>
                        )}
                        {!collateralVerified && (
                          <div className="mt-4">
                            <Button
                              variant="secondary"
                              loading={actionLoading === selected.id}
                              onClick={() => handleAction(selected.id, 'verify-collateral')}
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Verify collateral
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Decision</p>
                      {requiresCollateral && !collateralVerified && (
                        <p className="mb-4 text-sm text-amber-700">
                          Verify collateral before approving this loan.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {selected.status === 'SUBMITTED' && (
                          <Button
                            variant="secondary"
                            loading={actionLoading === selected.id}
                            onClick={() => handleAction(selected.id, 'review')}
                          >
                            Mark under review
                          </Button>
                        )}
                        <Button
                          loading={actionLoading === selected.id}
                          disabled={requiresCollateral && !collateralVerified}
                          onClick={() => handleAction(selected.id, 'approve')}
                        >
                          Approve loan
                        </Button>
                        <Button
                          variant="danger"
                          loading={actionLoading === selected.id}
                          onClick={() => handleAction(selected.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DetailPanel>
            }
          />
        )}
      </PageShell>
    </DashboardLayout>
  );
}
