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

export default function WithdrawalsPage() {
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
      const res = await api.post<{ success: boolean; data: { paymentRequest: { reference: string } } }>(
        '/teller/withdrawals',
        {
          accountId,
          amount: formatMoneyForApi(String(form.get('amount') ?? '')),
          narration: form.get('narration') || undefined,
        },
      );
      showToast(`Withdrawal submitted — ${res.data.paymentRequest.reference}`, 'success');
      (e.target as HTMLFormElement).reset();
      setAccountId('');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Withdrawal failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <Header title="Submit Withdrawal" subtitle="Teller initiates — manager must approve and pay out manually" />
      <div className="p-8">
        <Card className="max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <AccountSearchSelect value={accountId} onChange={(id) => setAccountId(id)} />
            <Input name="amount" label="Amount (NGN)" type="number" min="0.01" step="0.01" required />
            <Input name="narration" label="Narration" placeholder="Cash withdrawal" />
            <Button type="submit" loading={loading}>Submit for Approval</Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
