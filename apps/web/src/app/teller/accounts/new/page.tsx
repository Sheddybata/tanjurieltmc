'use client';

import { useState, FormEvent, useEffect } from 'react';
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

export default function OpenAccountPage() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get<{ success: boolean; data: CustomerOption[] }>('/teller/customers')
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
      <Header title="Open Account" subtitle="Create a new account for an existing customer" />
      <div className="p-8">
        <Card className="max-w-lg">
          {message && (
            <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.includes('Account') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              name="customerId"
              label="Customer"
              required
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
              options={[
                { value: 'SAVINGS', label: 'Savings Account' },
                { value: 'CURRENT', label: 'Current Account' },
                { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit' },
              ]}
            />
            <Input name="initialDeposit" label="Initial Deposit (NGN)" type="number" min="0" step="0.01" />
            <Button type="submit" loading={loading}>Open Account</Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
