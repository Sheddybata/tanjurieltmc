'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import {
  SplitQueueLayout,
  QueueListItem,
  DetailPanel,
  DetailField,
} from '@/components/ui/split-queue-layout';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface PendingCustomer {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  bvn?: string;
  nin?: string;
  kycStatus: string;
  registrationSource?: string;
  createdAt: string;
  branch?: { name: string; code: string };
  accounts: { accountNumber: string; type: string }[];
}

export default function RegistrationsPage() {
  const [customers, setCustomers] = useState<PendingCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  async function loadPending() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: PendingCustomer[] }>(
        '/teller/customers/pending-kyc',
      );
      const list = res.data || [];
      setCustomers(list);
      setSelectedId((prev) => (prev && list.some((c) => c.id === prev) ? prev : list[0]?.id ?? null));
    } catch {
      setCustomers([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  async function handleVerify(customerId: string, action: 'verify' | 'reject') {
    setActionLoading(customerId);
    try {
      if (action === 'verify') {
        await api.patch(`/teller/customers/${customerId}/verify-kyc`, {});
      } else {
        await api.patch(`/teller/customers/${customerId}/reject-kyc`, { reason: 'Documents could not be verified' });
      }
      await loadPending();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Mobile Registrations"
        subtitle="Review self-service signups from the mobile app (Head Office – Jos)"
      />
      <PageShell wide>
        <SectionHeading
          title="Pending KYC"
          description={`${customers.length} customer${customers.length === 1 ? '' : 's'} awaiting teller verification`}
        />

        {loading ? (
          <div className="flex h-96 items-center justify-center rounded-xl border border-gray-200 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          </div>
        ) : (
          <SplitQueueLayout
            isEmpty={customers.length === 0}
            empty={
              <EmptyState
                icon={CheckCircle}
                title="No pending registrations"
                description="New mobile signups will appear here for BVN/NIN review before banking features unlock."
              />
            }
            listHeader={<p className="text-xs font-medium text-gray-500">{customers.length} pending</p>}
            list={customers.map((customer) => (
              <QueueListItem
                key={customer.id}
                selected={customer.id === selectedId}
                onClick={() => setSelectedId(customer.id)}
                title={`${customer.firstName} ${customer.lastName}`}
                subtitle={customer.phone}
                meta={customer.createdAt ? formatDate(customer.createdAt) : undefined}
                badges={<span className="badge-warning">PENDING</span>}
              />
            ))}
            detail={
              <DetailPanel
                title={selected ? `${selected.firstName} ${selected.lastName}` : 'Registration details'}
                empty={!selected}
                emptyMessage="Select a registration from the queue"
              >
                {selected && (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-gray-100 bg-white p-5">
                      <span className="badge-warning">KYC PENDING</span>
                      <p className="mt-3 text-lg font-semibold text-gray-900">
                        {selected.firstName} {selected.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{selected.phone}</p>
                      {selected.registrationSource === 'MOBILE' && (
                        <p className="mt-2 text-xs text-brand-600">Mobile self-registration</p>
                      )}
                    </div>

                    <div className="grid gap-1 sm:grid-cols-2">
                      <DetailField label="Customer #" value={<span className="font-mono text-xs">{selected.customerNumber}</span>} />
                      <DetailField label="Registered" value={selected.createdAt ? formatDate(selected.createdAt) : '—'} />
                      <DetailField label="Email" value={selected.email || '—'} />
                      <DetailField label="Branch" value={selected.branch?.name || 'Head Office – Jos'} />
                      <DetailField label="BVN" value={<span className="font-mono">{selected.bvn || '—'}</span>} />
                      <DetailField label="NIN" value={<span className="font-mono">{selected.nin || '—'}</span>} />
                      <DetailField
                        label="Account"
                        value={selected.accounts?.[0]?.accountNumber || '—'}
                      />
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                      Verify identity documents at the branch before approving. Approved customers can fund, transfer, and apply for loans in the app.
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Decision</p>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          loading={actionLoading === selected.id}
                          onClick={() => handleVerify(selected.id, 'verify')}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve KYC
                        </Button>
                        <Button
                          variant="danger"
                          loading={actionLoading === selected.id}
                          onClick={() => handleVerify(selected.id, 'reject')}
                        >
                          <XCircle className="h-4 w-4" />
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
