'use client';

import { useEffect, useState, FormEvent } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

const PROVIDERS = ['ZENITH', 'OPAY', 'MONIEPOINT'] as const;

interface SettlementAccount {
  provider: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions?: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: SettlementAccount[] }>('/settings/settlement-accounts');
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(provider: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(provider);
    setMessage('');
    const form = new FormData(e.currentTarget);
    try {
      await api.put(`/settings/settlement-accounts/${provider}`, {
        bankName: form.get('bankName'),
        accountName: form.get('accountName'),
        accountNumber: form.get('accountNumber'),
        instructions: form.get('instructions') || undefined,
        isActive: true,
      });
      setMessage(`${provider} account updated`);
      await loadAccounts();
    } catch {
      setMessage('Failed to update account');
    } finally {
      setSaving(null);
    }
  }

  const accountFor = (provider: string) =>
    accounts.find((a) => a.provider === provider) || {
      provider,
      bankName: provider === 'ZENITH' ? 'Zenith Bank' : provider === 'OPAY' ? 'Opay' : 'Moniepoint',
      accountName: 'Tanjuriel Thrift and Microcredit Cooperative LTD',
      accountNumber: '',
      instructions: 'Use customer payment reference in transfer narration.',
      isActive: true,
    };

  return (
    <DashboardLayout>
      <Header title="System Settings" subtitle="Settlement banks and platform configuration" />
      <div className="p-8 space-y-6">
        {message && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        <Card title="Settlement bank accounts">
          <p className="mb-4 text-sm text-gray-500">
            Customers transfer to these accounts. Managers verify incoming payments before approving deposits.
          </p>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-6">
              {PROVIDERS.map((provider) => {
                const acct = accountFor(provider);
                return (
                  <form key={provider} onSubmit={(e) => handleSave(provider, e)} className="rounded-lg border border-gray-100 p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">{provider}</h3>
                    <Input name="bankName" label="Bank name" defaultValue={acct.bankName} required />
                    <Input name="accountName" label="Account name" defaultValue={acct.accountName} required />
                    <Input name="accountNumber" label="Account number" defaultValue={acct.accountNumber} required />
                    <Input name="instructions" label="Instructions for customers" defaultValue={acct.instructions || ''} />
                    <Button type="submit" size="sm" loading={saving === provider}>Save {provider}</Button>
                  </form>
                );
              })}
            </div>
          )}
        </Card>
        <Card title="Manual operations mode">
          <p className="text-sm text-gray-500">
            Managers approve all deposits and outbound transfers manually using Zenith, Opay, or Moniepoint apps.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
