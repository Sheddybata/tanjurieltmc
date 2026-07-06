'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface CustomerOption {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
}

const ACCOUNT_TYPES = [
  { value: 'SAVINGS', label: 'Savings Account' },
  { value: 'DAILY_SAVINGS', label: 'Daily Savings' },
  { value: 'MY_PIKIN', label: 'My Pikin (Child Savings)' },
  { value: 'CURRENT', label: 'Current Account' },
  { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit' },
];

export default function OpenAccountPage() {
  const searchParams = useSearchParams();
  const preselectedCustomer = searchParams.get('customerId') ?? '';

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accountType, setAccountType] = useState('SAVINGS');

  useEffect(() => {
    api.get<{ success: boolean; data: CustomerOption[] }>('/teller/customers?limit=100')
      .then((res) => setCustomers(res.data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const form = new FormData(e.currentTarget);

    try {
      const res = await api.post<{ success: boolean; data: { accountNumber: string } }>('/teller/accounts', {
        customerId: form.get('customerId'),
        type: form.get('type'),
        initialDeposit: form.get('initialDeposit') ? Number(form.get('initialDeposit')) : undefined,
        appPin: form.get('appPin') || undefined,
        label: form.get('label') || undefined,
        maturityDate: form.get('maturityDate') || undefined,
      });
      setMessage(`Account opened: ${res.data.accountNumber}`);
    } catch (err: unknown) {
      setMessage((err as { message?: string })?.message || 'Failed to open account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <Header title="Open Account" subtitle="Create savings, daily savings, My Pikin, or other account types" />
      <div className="p-8">
        <Card className="max-w-lg">
          {message && (
            <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.includes('Account opened') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              name="customerId"
              label="Customer"
              required
              defaultValue={preselectedCustomer}
              options={[
                { value: '', label: 'Select customer...' },
                ...customers.map((c) => ({
                  value: c.id,
                  label: `${c.firstName} ${c.lastName} (${c.customerNumber})`,
                })),
              ]}
            />
            <Select
              name="type"
              label="Account Type"
              required
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              options={ACCOUNT_TYPES}
            />
            {accountType === 'MY_PIKIN' && (
              <>
                <Input name="label" label="Child name / label" placeholder="e.g. Ada Eze" required />
                <Input name="maturityDate" label="Maturity date" type="date" required />
                <p className="text-xs text-gray-500">
                  My Pikin withdrawals are branch-only after maturity, with manager approval.
                </p>
              </>
            )}
            {accountType === 'DAILY_SAVINGS' && (
              <p className="text-xs text-gray-500">
                Daily savings transfers and withdrawals require manager approval like other accounts.
              </p>
            )}
            <Input name="initialDeposit" label="Initial Deposit (NGN)" type="number" min="0" step="0.01" />
            <Input
              name="appPin"
              label="Mobile app PIN (optional)"
              placeholder="4–6 digits — enables mobile login for this customer"
              maxLength={6}
            />
            <Button type="submit" loading={loading}>Open Account</Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
