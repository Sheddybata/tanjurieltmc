'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AccountSearchSelect, AccountOption } from '@/components/ui/account-search-select';
import { api } from '@/lib/api';
import { formatMoneyForApi } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-provider';

function FundChildSavingsForm() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');
  const accountIdParam = searchParams.get('accountId');

  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [prefill, setPrefill] = useState<AccountOption | null>(null);

  useEffect(() => {
    if (!customerId || !accountIdParam) return;
    api
      .get<{
        success: boolean;
        data: {
          firstName: string;
          lastName: string;
          phone: string;
          accounts: { id: string; accountNumber: string; type: string; label?: string; balance?: number }[];
        };
      }>(`/teller/customers/${customerId}`)
      .then((res) => {
        const account = res.data.accounts?.find((a) => a.id === accountIdParam && a.type === 'MY_PIKIN');
        if (!account) return;
        setPrefill({
          accountId: account.id,
          accountNumber: account.accountNumber,
          customerName: `${res.data.firstName} ${res.data.lastName}`,
          customerPhone: res.data.phone,
          balance: account.balance,
          accountType: account.type,
          label: account.label,
        });
        setAccountId(account.id);
      })
      .catch(() => {});
  }, [customerId, accountIdParam]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accountId) {
      showToast('Select a Child Savings account first', 'error');
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await api.post<{ success: boolean; data: { paymentRequest: { reference: string }; message: string } }>(
        '/teller/deposits',
        {
          accountId,
          amount: formatMoneyForApi(String(form.get('amount') ?? '')),
          narration: form.get('narration') || 'Child Savings contribution',
        },
      );
      showToast(`Contribution submitted — ${res.data.paymentRequest.reference}`, 'success');
      (e.target as HTMLFormElement).reset();
      if (!prefill) setAccountId('');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Could not submit contribution', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <AccountSearchSelect
          value={accountId}
          onChange={(id) => setAccountId(id)}
          accountTypeFilter="MY_PIKIN"
          prefill={prefill}
          label="Child Savings account"
        />
        <Input name="amount" label="Amount (NGN)" type="number" min="1" step="1" required />
        <Input name="narration" label="Narration" placeholder="Child Savings contribution" />
        <Button type="submit" loading={loading}>Submit for Approval</Button>
      </form>
    </Card>
  );
}

export default function FundChildSavingsPage() {
  return (
    <DashboardLayout>
      <Header
        title="Fund Child Savings"
        subtitle="Cash contribution to a Child Savings account — manager approval required before balance is credited"
      />
      <div className="p-8">
        <Suspense fallback={<Card className="max-w-lg p-6 text-sm text-gray-500">Loading…</Card>}>
          <FundChildSavingsForm />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
