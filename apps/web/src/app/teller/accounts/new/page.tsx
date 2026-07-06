'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatMoneyForApi } from '@/lib/utils';
import { TELLER_OPEN_ACCOUNT_TYPES } from '@/lib/account-types';

interface CustomerOption {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
}

function OpenAccountForm() {
  const searchParams = useSearchParams();
  const preselectedCustomer = searchParams.get('customerId') ?? '';

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersError, setCustomersError] = useState('');
  const [customerId, setCustomerId] = useState(preselectedCustomer);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accountType, setAccountType] = useState('SAVINGS');

  useEffect(() => {
    setCustomerId(preselectedCustomer);
  }, [preselectedCustomer]);

  useEffect(() => {
    api.get<{ success: boolean; data: CustomerOption[] }>('/teller/customers?limit=100')
      .then((res) => {
        setCustomers(res.data);
        setCustomersError('');
      })
      .catch((err: unknown) => {
        setCustomers([]);
        setCustomersError((err as { message?: string })?.message || 'Could not load customers from the server');
      });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!customerId) {
      setMessage('Please select a customer. If the list is empty, check that you are logged in and the API is reachable.');
      setLoading(false);
      return;
    }

    const form = new FormData(e.currentTarget);

    try {
      const res = await api.post<{ success: boolean; data: { accountNumber: string } }>('/teller/accounts', {
        customerId,
        type: accountType,
        initialDeposit: form.get('initialDeposit')
          ? formatMoneyForApi(String(form.get('initialDeposit')))
          : undefined,
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
    <Card className="max-w-lg">
      {customersError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {customersError}. Customer list could not be loaded — you cannot open an account until this is fixed.
        </div>
      )}
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
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          options={[
            { value: '', label: customers.length ? 'Select customer...' : 'No customers loaded' },
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
          options={[...TELLER_OPEN_ACCOUNT_TYPES]}
        />
        {accountType === 'MY_PIKIN' && (
          <>
            <Input name="label" label="Child name / label" placeholder="e.g. Ada Eze" required />
            <Input name="maturityDate" label="Maturity date" type="date" required />
            <p className="text-xs text-gray-500">
              After maturity, the member can request withdrawal on mobile; manager approves before cash is paid at branch.
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
  );
}

export default function OpenAccountPage() {
  return (
    <DashboardLayout>
      <Header title="Open Account" subtitle="Savings, Daily Savings, or My Pikin Savings" />
      <div className="p-8">
        <Suspense fallback={<Card className="max-w-lg p-6 text-sm text-gray-500">Loading…</Card>}>
          <OpenAccountForm />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
