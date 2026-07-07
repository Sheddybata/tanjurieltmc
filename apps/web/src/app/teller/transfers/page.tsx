'use client';

import { useState, FormEvent } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AccountSearchSelect } from '@/components/ui/account-search-select';
import { api } from '@/lib/api';
import { formatMoneyForApi } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-provider';

export default function TellerTransfersPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accountId) {
      showToast('Select a customer account first', 'error');
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await api.post<{ success: boolean; data: { paymentRequest: { reference: string }; message: string } }>(
        '/teller/transfers',
        {
          accountId,
          amount: formatMoneyForApi(String(form.get('amount') ?? '')),
          beneficiaryBank: form.get('beneficiaryBank'),
          beneficiaryAccount: form.get('beneficiaryAccount'),
          beneficiaryName: form.get('beneficiaryName'),
          narration: form.get('narration') || undefined,
        },
      );
      showToast(`Transfer submitted — ${res.data.paymentRequest.reference}`, 'success');
      (e.target as HTMLFormElement).reset();
      setAccountId('');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Transfer failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Transfer on Behalf"
        subtitle="Initiate a transfer from a customer account — manager must approve before funds are sent"
      />
      <div className="p-8">
        <Card className="max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <AccountSearchSelect
              value={accountId}
              onChange={(id) => setAccountId(id)}
              label="Source account (not Child Savings)"
            />
            <p className="text-xs text-gray-500">Child Savings accounts cannot be used for transfers.</p>
            <Input name="amount" label="Amount (NGN)" type="number" min="0.01" step="0.01" required />
            <Input name="beneficiaryBank" label="Beneficiary bank" required />
            <Input name="beneficiaryAccount" label="Beneficiary account number" required />
            <Input name="beneficiaryName" label="Beneficiary name" required />
            <Input name="narration" label="Narration" placeholder="Transfer on behalf of customer" />
            <Button type="submit" loading={loading}>Submit for Approval</Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
