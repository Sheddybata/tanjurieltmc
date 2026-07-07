'use client';

import { useState, FormEvent, useEffect, Suspense, useRef } from 'react';
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
import { CONTRIBUTION_FREQUENCY_OPTIONS } from '@/lib/contribution-frequency';
import { formatCustomerOptionLabel } from '@/lib/member-id';

interface CustomerOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  accounts?: { accountNumber: string; type: string }[];
}

function OpenAccountForm() {
  const searchParams = useSearchParams();
  const preselectedCustomer = searchParams.get('customerId') ?? '';
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersError, setCustomersError] = useState('');
  const [customerId, setCustomerId] = useState(preselectedCustomer);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accountType, setAccountType] = useState('SAVINGS');
  const [contributionFrequency, setContributionFrequency] = useState('DAILY');
  const [photoName, setPhotoName] = useState('');

  const showFrequency = accountType === 'DAILY_SAVINGS' || accountType === 'MY_PIKIN';
  const isChildSavings = accountType === 'MY_PIKIN';

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
    form.set('customerId', customerId);
    form.set('type', accountType);
    if (showFrequency) {
      form.set('contributionFrequency', contributionFrequency);
    }

    const initialDeposit = form.get('initialDeposit');
    if (initialDeposit) {
      form.set('initialDeposit', formatMoneyForApi(String(initialDeposit)));
    }

    if (isChildSavings) {
      const photo = photoInputRef.current?.files?.[0];
      if (!photo) {
        setMessage('A photo of the child is required for Child Savings');
        setLoading(false);
        return;
      }
      form.set('childPhoto', photo);
    }

    try {
      const res = await api.post<{ success: boolean; data: { accountNumber: string } }>('/teller/accounts', form);
      setMessage(`Account opened: ${res.data.accountNumber}`);
      setPhotoName('');
      if (photoInputRef.current) photoInputRef.current.value = '';
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
              label: formatCustomerOptionLabel(c.firstName, c.lastName, c.accounts, c.phone),
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
        {showFrequency && (
          <Select
            name="contributionFrequency"
            label="Contribution frequency"
            required
            value={contributionFrequency}
            onChange={(e) => setContributionFrequency(e.target.value)}
            options={[...CONTRIBUTION_FREQUENCY_OPTIONS]}
          />
        )}
        {isChildSavings && (
          <>
            <Input name="label" label="Child's full name" placeholder="e.g. Ada Eze" required />
            <Input name="childDateOfBirth" label="Date of birth" type="date" required />
            <Input name="childSchool" label="Current school" placeholder="e.g. St. Mary Primary School" required />
            <Input name="fatherName" label="Father's name" placeholder="e.g. John Eze" required />
            <Input name="motherName" label="Mother's name" placeholder="e.g. Mary Eze" required />
            <Input name="maturityDate" label="Maturity date" type="date" required />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Child photo (required)</label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
                onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? '')}
              />
              {photoName && <p className="mt-1 text-xs text-gray-500">{photoName}</p>}
            </div>
            <p className="text-xs text-gray-500">
              Members can open multiple Child Savings accounts (different children or maturity dates).
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
      <Header title="Open Account" subtitle="Savings, Daily Savings, or Child Savings" />
      <div className="p-8">
        <Suspense fallback={<Card className="max-w-lg p-6 text-sm text-gray-500">Loading…</Card>}>
          <OpenAccountForm />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
