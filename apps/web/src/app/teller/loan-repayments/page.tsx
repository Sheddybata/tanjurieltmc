'use client';

import { useState, FormEvent } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast-provider';
import { formatCurrency, formatMoneyForApi } from '@/lib/utils';
import { primaryMemberAccountNumber } from '@/lib/member-id';

interface CustomerLoan {
  id: string;
  loanNumber: string;
  status: string;
  outstandingBalance: number;
}

interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  accounts?: { accountNumber: string; type: string }[];
  loans: CustomerLoan[];
}

const REPAYABLE = new Set(['DISBURSED', 'ACTIVE', 'OVERDUE']);

export default function LoanRepaymentsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loanId, setLoanId] = useState('');

  async function searchCustomer() {
    if (!query.trim()) {
      showToast('Enter account number, phone, or name', 'error');
      return;
    }
    setSearching(true);
    try {
      const res = await api.get<{ success: boolean; data: { id: string; firstName: string; lastName: string; customerNumber: string }[] }>(
        `/teller/customers?query=${encodeURIComponent(query.trim())}&limit=5`,
      );
      const match = res.data?.[0];
      if (!match) {
        showToast('No customer found', 'error');
        setCustomer(null);
        return;
      }
      const detail = await api.get<{ success: boolean; data: CustomerDetail }>(`/teller/customers/${match.id}`);
      setCustomer(detail.data);
      const firstLoan = detail.data.loans?.find((l) => REPAYABLE.has(l.status));
      setLoanId(firstLoan?.id ?? '');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Search failed', 'error');
    } finally {
      setSearching(false);
    }
  }

  const activeLoans = customer?.loans?.filter((l) => REPAYABLE.has(l.status)) ?? [];
  const selected = activeLoans.find((l) => l.id === loanId);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loanId) {
      showToast('Select a loan first', 'error');
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await api.post<{ success: boolean; data: { paymentRequest: { reference: string } } }>(
        '/teller/loans/repay',
        {
          loanId,
          amount: formatMoneyForApi(String(form.get('amount') ?? '')),
          narration: form.get('narration') || undefined,
        },
      );
      showToast(`Repayment submitted — ${res.data.paymentRequest.reference}`, 'success');
      (e.target as HTMLFormElement).reset();
      setLoanId('');
      setCustomer(null);
      setQuery('');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Repayment failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Loan Repayment"
        subtitle="Record cash received at the branch — manager must approve before it appears on mobile"
      />
      <div className="p-8">
        <Card className="max-w-lg">
          <div className="mb-6 space-y-3">
            <Input
              label="Find customer"
              placeholder="Account number, phone, or name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="button" variant="secondary" loading={searching} onClick={searchCustomer}>
              Search
            </Button>
          </div>

          {customer && (
            <p className="mb-4 text-sm text-gray-700">
              {customer.firstName} {customer.lastName} · {primaryMemberAccountNumber(customer.accounts, customer.phone)}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              label="Active loan"
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              required
              disabled={!customer || activeLoans.length === 0}
              options={[
                { value: '', label: customer ? (activeLoans.length ? 'Select loan...' : 'No active loans') : 'Search for a customer first' },
                ...activeLoans.map((l) => ({
                  value: l.id,
                  label: `${l.loanNumber} — ${formatCurrency(Number(l.outstandingBalance))} outstanding`,
                })),
              ]}
            />
            {selected && (
              <p className="text-sm text-gray-600">
                Outstanding: <strong>{formatCurrency(Number(selected.outstandingBalance))}</strong>
              </p>
            )}
            <Input name="amount" label="Amount received (NGN)" type="number" min="0.01" step="0.01" required />
            <Input name="narration" label="Narration" placeholder="Cash loan repayment" />
            <Button type="submit" loading={loading} disabled={!loanId}>
              Submit for Approval
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
