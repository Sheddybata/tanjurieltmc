'use client';

import { useEffect, useMemo, useState } from 'react';
import { Inbox } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageShell } from '@/components/ui/page-shell';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { useToast } from '@/components/ui/toast-provider';
import {
  SplitQueueLayout,
  QueueListItem,
  DetailPanel,
  DetailField,
} from '@/components/ui/split-queue-layout';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentRequest {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: number;
  channel: string;
  settlementProvider?: string;
  beneficiaryBank?: string;
  beneficiaryAccount?: string;
  beneficiaryName?: string;
  customerNote?: string;
  createdAt: string;
  account: {
    accountNumber: string;
    type?: string;
    label?: string;
    maturityDate?: string;
    customer: {
      firstName: string;
      lastName: string;
      phone: string;
      paymentRef: string;
    };
  };
  loan?: { loanNumber: string; outstandingBalance: number };
  initiatedBy?: { firstName: string; lastName: string; role: string };
}

export default function OperationsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bankRefs, setBankRefs] = useState<Record<string, string>>({});
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  async function loadPending() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: PaymentRequest[] }>('/operations/pending?limit=50');
      const list = Array.isArray(res.data) ? res.data : [];
      setRequests(list);
      setSelectedId((prev) => (prev && list.some((r) => r.id === prev) ? prev : list[0]?.id ?? null));
    } catch {
      setRequests([]);
      setSelectedId(null);
      showToast('Failed to load operations queue', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'ALL') return requests;
    return requests.filter((r) => r.type === filter);
  }, [requests, filter]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  const counts = useMemo(
    () => ({
      ALL: requests.length,
      DEPOSIT: requests.filter((r) => r.type === 'DEPOSIT').length,
      WITHDRAWAL: requests.filter((r) => r.type === 'WITHDRAWAL').length,
      TRANSFER: requests.filter((r) => r.type === 'TRANSFER').length,
      LOAN_REPAYMENT: requests.filter((r) => r.type === 'LOAN_REPAYMENT').length,
    }),
    [requests],
  );

  async function handleApprove(id: string, type: string, channel: string) {
    setActionLoading(id);
    try {
      const needsRef = (type === 'WITHDRAWAL' || type === 'TRANSFER') && channel !== 'CASH';
      const externalBankRef = bankRefs[id];
      if (needsRef && !externalBankRef?.trim()) {
        showToast('Enter the bank transfer reference before approving', 'error');
        return;
      }
      await api.post(`/operations/${id}/approve`, {
        externalBankRef: externalBankRef || undefined,
        comment: 'Approved via operations queue',
      });
      showToast('Request approved', 'success');
      await loadPending();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Approval failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    try {
      await api.post(`/operations/${id}/reject`, { comment: rejectReason || undefined });
      showToast('Request rejected', 'success');
      setRejectReason('');
      await loadPending();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Operations Queue"
        subtitle="Select a request on the left, review details, then approve or reject"
      />
      <PageShell wide>
        <SectionHeading
          title="Pending requests"
          description={`${requests.length} item${requests.length === 1 ? '' : 's'} in queue`}
        />

        <FilterTabs
          tabs={[
            { id: 'ALL', label: 'All', count: counts.ALL },
            { id: 'DEPOSIT', label: 'Deposits', count: counts.DEPOSIT },
            { id: 'WITHDRAWAL', label: 'Withdrawals', count: counts.WITHDRAWAL },
            { id: 'TRANSFER', label: 'Transfers', count: counts.TRANSFER },
            { id: 'LOAN_REPAYMENT', label: 'Loan repayments', count: counts.LOAN_REPAYMENT },
          ]}
          active={filter}
          onChange={setFilter}
        />

        {loading ? (
          <div className="flex h-96 items-center justify-center rounded-xl border border-gray-200 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          </div>
        ) : (
          <SplitQueueLayout
            isEmpty={filtered.length === 0}
            empty={
              <EmptyState
                icon={Inbox}
                title="Queue is clear"
                description="No pending deposits, withdrawals, transfers, or loan repayments right now."
              />
            }
            listHeader={
              <p className="text-xs font-medium text-gray-500">
                {filtered.length} in view · oldest first
              </p>
            }
            list={filtered.map((req) => (
              <QueueListItem
                key={req.id}
                selected={req.id === selectedId}
                onClick={() => setSelectedId(req.id)}
                title={`${req.account.customer.firstName} ${req.account.customer.lastName}`}
                subtitle={req.reference}
                amount={formatCurrency(Number(req.amount))}
                meta={formatDate(req.createdAt)}
                badges={
                  <>
                    <StatusBadge status={req.type} />
                    <StatusBadge status={req.status} />
                  </>
                }
              />
            ))}
            detail={
              <DetailPanel
                title={selected ? `${selected.type.replace(/_/g, ' ')} request` : 'Request details'}
                empty={!selected}
                emptyMessage="Select a pending request from the queue"
              >
                {selected && (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-gray-100 bg-white p-5">
                      <p className="font-display text-3xl font-bold text-brand-700">
                        {formatCurrency(Number(selected.amount))}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {selected.account.customer.firstName} {selected.account.customer.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{selected.account.accountNumber}</p>
                    </div>

                    <div className="grid gap-1 sm:grid-cols-2">
                      <DetailField label="Payment ref" value={selected.account.customer.paymentRef} />
                      <DetailField label="Phone" value={selected.account.customer.phone} />
                      <DetailField label="Channel" value={selected.channel.replace(/_/g, ' ')} />
                      <DetailField label="Reference" value={<span className="font-mono text-xs">{selected.reference}</span>} />
                      <DetailField label="Submitted" value={formatDate(selected.createdAt)} />
                      {selected.account.type && (
                        <DetailField label="Account type" value={selected.account.type.replace(/_/g, ' ')} />
                      )}
                      {selected.account.label && (
                        <DetailField label="Account label" value={selected.account.label} />
                      )}
                      {selected.account.type === 'MY_PIKIN' && selected.account.maturityDate && (
                        <DetailField label="Maturity date" value={formatDate(selected.account.maturityDate)} />
                      )}
                      {selected.loan && (
                        <DetailField
                          label="Loan"
                          value={`${selected.loan.loanNumber} (${formatCurrency(Number(selected.loan.outstandingBalance))} outstanding)`}
                        />
                      )}
                      {selected.settlementProvider && (
                        <DetailField label="Settlement bank" value={selected.settlementProvider} />
                      )}
                      {selected.initiatedBy && (
                        <DetailField
                          label="Initiated by"
                          value={`${selected.initiatedBy.firstName} ${selected.initiatedBy.lastName} (${selected.initiatedBy.role})`}
                        />
                      )}
                      {selected.beneficiaryName && (
                        <DetailField
                          label="Beneficiary"
                          value={`${selected.beneficiaryName} · ${selected.beneficiaryBank} · ${selected.beneficiaryAccount}`}
                        />
                      )}
                      {selected.customerNote && (
                        <div className="sm:col-span-2">
                          <DetailField label="Customer note" value={selected.customerNote} />
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Manager action</p>
                      {(selected.type === 'WITHDRAWAL' || selected.type === 'TRANSFER') && selected.channel !== 'CASH' && (
                        <Input
                          label="Bank transfer reference"
                          placeholder="Enter ref from Zenith / Opay / Moniepoint"
                          value={bankRefs[selected.id] || ''}
                          onChange={(e) => setBankRefs((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                        />
                      )}
                      {(selected.type === 'WITHDRAWAL' || selected.type === 'TRANSFER') && selected.channel === 'CASH' && (
                        <p className="mb-3 text-sm text-gray-600">Cash at branch — no bank reference required.</p>
                      )}
                      <Input
                        label="Rejection reason (optional)"
                        placeholder="Reason if rejecting"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="mt-4 flex gap-3">
                        <Button
                          className="flex-1"
                          loading={actionLoading === selected.id}
                          onClick={() => handleApprove(selected.id, selected.type, selected.channel)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          className="flex-1"
                          loading={actionLoading === selected.id}
                          onClick={() => handleReject(selected.id)}
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
