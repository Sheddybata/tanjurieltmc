'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function RegisterCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await api.post<{ success: boolean; data: { customerNumber: string } }>(
        '/teller/customers',
        { ...payload, monthlyIncome: payload.monthlyIncome ? Number(payload.monthlyIncome) : undefined },
      );
      setSuccess(`Customer registered successfully — ${res.data.customerNumber}`);
      setTimeout(() => router.push('/teller/customers'), 2000);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <Header title="Register Customer" subtitle="Capture new customer KYC information" />
      <div className="p-8">
        <Card className="max-w-3xl">
          {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input name="firstName" label="First Name" required />
            <Input name="lastName" label="Last Name" required />
            <Input name="middleName" label="Middle Name" />
            <Input name="dateOfBirth" label="Date of Birth" type="date" required />
            <Select name="gender" label="Gender" required options={[
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
              { value: 'OTHER', label: 'Other' },
            ]} />
            <Input name="phone" label="Phone Number" required placeholder="+234..." />
            <Input name="email" label="Email" type="email" />
            <Input name="bvn" label="BVN" maxLength={11} />
            <Input name="nin" label="NIN" />
            <Input name="address" label="Address" required className="md:col-span-2" />
            <Input name="city" label="City" required />
            <Input name="state" label="State" required />
            <Input name="occupation" label="Occupation" />
            <Input name="employer" label="Employer" />
            <Input name="monthlyIncome" label="Monthly Income (NGN)" type="number" min="0" />

            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" loading={loading}>Register Customer</Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
